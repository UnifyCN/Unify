// @ts-nocheck Deno runtime — Supabase Edge Functions
/**
 * Single source of truth for chat-completion calls in edge functions.
 *
 * Why OpenRouter: one API key for many upstream providers (Google, Anthropic,
 * Meta, DeepSeek, etc.) plus an automatic fallback chain on per-upstream 429s.
 *
 * Models default to env vars so they can be tuned without redeploying:
 *   OPENROUTER_MODEL_PRIMARY    (default: deepseek/deepseek-v4-flash)
 *   OPENROUTER_MODEL_FALLBACKS  (comma-separated; default: gemini-2.5-flash)
 *
 * The helper requests inline usage data so we get token counts AND a USD cost
 * straight from OpenRouter — no per-model rate table to maintain.
 */

import { fetchWithRetry } from './fetchWithRetry.ts';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const DEFAULT_PRIMARY_MODEL = 'deepseek/deepseek-v4-flash';
const DEFAULT_FALLBACK_MODELS = ['google/gemini-2.5-flash'];

export type OpenRouterMessageRole = 'system' | 'user' | 'assistant';

export interface OpenRouterMessage {
  role: OpenRouterMessageRole;
  content: string;
}

export interface OpenRouterCallOptions {
  messages: OpenRouterMessage[];
  /** Primary model — overrides OPENROUTER_MODEL_PRIMARY env. */
  model?: string;
  /** Fallback chain — overrides OPENROUTER_MODEL_FALLBACKS env. */
  fallbackModels?: string[];
  maxTokens?: number;
  temperature?: number;
  /** Set true to request JSON-only output via response_format. */
  jsonMode?: boolean;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
  /** Optional metadata for OpenRouter's dashboard / leaderboards. */
  appName?: string;
  appUrl?: string;
}

export interface OpenRouterUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd?: number;
}

export type OpenRouterResult =
  | {
      ok: true;
      content: string;
      /** The actual model OpenRouter served from (after fallback resolution). */
      model: string;
      /** The upstream provider (e.g. "Google", "Anthropic"). */
      provider: string;
      usage: OpenRouterUsage;
    }
  | {
      ok: false;
      status: number;
      /** True if 429 or 5xx — caller can surface a "busy" message vs hard error. */
      retryable: boolean;
      message: string;
    };

function readDefaultPrimaryModel(): string {
  return Deno.env.get('OPENROUTER_MODEL_PRIMARY') ?? DEFAULT_PRIMARY_MODEL;
}

function readDefaultFallbackModels(): string[] {
  const raw = Deno.env.get('OPENROUTER_MODEL_FALLBACKS');
  if (!raw) return [...DEFAULT_FALLBACK_MODELS];
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export async function callOpenRouter(
  options: OpenRouterCallOptions
): Promise<OpenRouterResult> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      retryable: false,
      message: 'OPENROUTER_API_KEY not set in Supabase secrets',
    };
  }

  const primary = options.model ?? readDefaultPrimaryModel();
  const fallbacks = options.fallbackModels ?? readDefaultFallbackModels();
  const models = [primary, ...fallbacks.filter(m => m !== primary)];

  const body: Record<string, unknown> = {
    model: primary,
    models,
    messages: options.messages,
    // Ask OpenRouter to inline usage + cost in the response.
    usage: { include: true },
  };
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.jsonMode) body.response_format = { type: 'json_object' };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  // HTTP header values must be valid ByteString (≤ U+00FF). Replace any
  // higher code points (em-dash, smart quotes, emoji, etc.) with '-' so
  // a caller passing a stylized appName doesn't crash request construction.
  if (options.appUrl) headers['HTTP-Referer'] = toByteString(options.appUrl);
  if (options.appName) headers['X-Title'] = toByteString(options.appName);

  try {
    const response = await fetchWithRetry(
      ENDPOINT,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: options.signal,
      },
      {
        timeoutMs: options.timeoutMs ?? 25000,
        retries: options.retries ?? 1,
        retryDelayMs: options.retryDelayMs ?? 500,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return {
        ok: false,
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
        message: `OpenRouter ${response.status}: ${errorBody.slice(0, 500)}`,
      };
    }

    const data = await response.json();
    const choice = data?.choices?.[0];
    const content =
      typeof choice?.message?.content === 'string'
        ? choice.message.content.trim()
        : '';

    if (!content) {
      return {
        ok: false,
        status: 502,
        retryable: false,
        message: 'OpenRouter returned an empty completion',
      };
    }

    const usageRaw = data?.usage ?? {};
    const usage: OpenRouterUsage = {
      promptTokens: Number(usageRaw.prompt_tokens) || 0,
      completionTokens: Number(usageRaw.completion_tokens) || 0,
      totalTokens: Number(usageRaw.total_tokens) || 0,
      costUsd:
        typeof usageRaw.cost === 'number' ? usageRaw.cost : undefined,
    };

    const resolvedModel =
      typeof data?.model === 'string' ? data.model : primary;
    const resolvedProvider =
      typeof data?.provider === 'string'
        ? data.provider
        : extractProviderFromModel(resolvedModel);

    return {
      ok: true,
      content,
      model: resolvedModel,
      provider: resolvedProvider,
      usage,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        status: 504,
        retryable: false,
        message: 'OpenRouter request aborted (timeout or caller cancelled)',
      };
    }
    return {
      ok: false,
      status: 500,
      retryable: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/** Strip the "provider/" prefix from a model id, e.g. "google/gemini-2.5-flash" → "google". */
function extractProviderFromModel(model: string): string {
  const slash = model.indexOf('/');
  return slash > 0 ? model.slice(0, slash) : 'openrouter';
}

/** Replace any code point > U+00FF with '-' so the string is a valid HTTP header value. */
function toByteString(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[^\x00-\xff]/g, '-');
}

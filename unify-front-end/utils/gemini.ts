import Constants from 'expo-constants';
// IMPORTANT: use expo/fetch (not the global fetch) for streaming. React
// Native's standard fetch buffers the full response before resolving, so
// `response.body` is always null. expo/fetch exposes `body` as a real
// ReadableStream<Uint8Array> on Hermes — required for SSE consumption.
import { fetch } from 'expo/fetch';
import { supabase } from '@/lib/supabase';
import { parseSSEStream } from '@/utils/sseParser';
import { Source } from '@/helpers/companion/messageHelpers';
import { QueryType, TokenUsage } from '@/types/chatbot';

interface ConversationMessage {
  message: string;
  role: 'user' | 'assistant';
}

/**
 * Error thrown when rag-query signals upstream rate-limit / capacity issues.
 * Callers can check `error.code === 'ai_companion_busy'` to surface a
 * friendly toast instead of a generic failure.
 */
export class AICompanionBusyError extends Error {
  readonly code = 'ai_companion_busy' as const;
  constructor(message: string) {
    super(message);
    this.name = 'AICompanionBusyError';
  }
}

const BUSY_FALLBACK_MESSAGE =
  'AI Companion is busy right now. Please try again in a minute.';

// Function to call the RAG query edge function
export const callGeminiAPI = async (
  prompt: string,
  conversationIdentifier?: string,
  messages?: ConversationMessage[]
) => {
  const { data, error } = await supabase.functions.invoke('rag-query', {
    body: {
      prompt,
      conversationIdentifier,
      messages: messages || [],
    },
  });

  if (error) {
    // FunctionsHttpError exposes the failing Response via error.context.
    // We read the body so we can:
    //  (a) detect the rag-query "busy" 503 and throw a typed error, and
    //  (b) surface the real server-side message in logs instead of
    //      the generic "non-2xx status code" wrapper.
    const ctx = (error as { context?: Response }).context;
    let bodyText = '';
    if (ctx && typeof ctx.text === 'function') {
      try {
        bodyText = await ctx.text();
      } catch {
        // ignore body read failures
      }
    }

    // Try to parse the body as JSON to check for the busy code.
    let parsed: { error?: string; code?: string } | null = null;
    if (bodyText) {
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        // body wasn't JSON — that's fine, fall through to generic error
      }
    }

    if (
      parsed?.code === 'ai_companion_busy' ||
      ctx?.status === 503
    ) {
      throw new AICompanionBusyError(parsed?.error ?? BUSY_FALLBACK_MESSAGE);
    }

    throw new Error(
      bodyText ? `${error.message} — ${bodyText}` : error.message
    );
  }

  if (!data) {
    throw new Error('No data received from RAG API');
  }

  return data;
};

// ============================================================================
// STREAMING
// ============================================================================

export interface StreamMetadata {
  sources?: Source[];
  queryType?: QueryType;
  disclaimer?: string;
  lastVerified?: string;
}

export interface StreamComplete {
  cleanAnswer: string;
  suggestedNextSteps?: string[];
  tokenUsage?: TokenUsage;
  estimatedCostUsd?: number;
  model?: string;
  provider?: string;
}

export interface StreamCallbacks {
  onMetadata: (m: StreamMetadata) => void;
  onToken: (delta: string) => void;
  onComplete: (c: StreamComplete) => void;
  onError: (e: Error) => void;
}

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = Constants.expoConfig?.extra as Extra | undefined;
const SUPABASE_URL =
  extra?.supabaseUrl?.trim() || process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY =
  extra?.supabaseAnonKey?.trim() ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * Streaming variant of {@link callGeminiAPI}. Calls the rag-query edge
 * function with `stream: true`, parses the returned SSE stream, and dispatches
 * incremental updates via the supplied callbacks.
 *
 * Uses raw `fetch()` rather than `supabase.functions.invoke()` because the
 * Supabase JS client buffers the full response body — we need access to
 * `response.body` as a `ReadableStream<Uint8Array>` so we can read tokens as
 * they arrive.
 *
 * Hermes / Expo dev-mode caveat: Expo's `CdpInterceptor` (Chrome DevTools
 * inspector hook) can buffer streaming `fetch` responses in dev, making the
 * stream look frozen. See Expo issue #27526. Production builds and Hermes
 * without the JS inspector connected work fine.
 */
export const streamGeminiAPI = async (
  prompt: string,
  conversationIdentifier: string | undefined,
  messages: ConversationMessage[] | undefined,
  callbacks: StreamCallbacks
): Promise<void> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    callbacks.onError(
      new Error(
        'Supabase URL or anon key missing — cannot stream from rag-query'
      )
    );
    return;
  }

  let response: Response;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      callbacks.onError(new Error('Not authenticated — no Supabase session'));
      return;
    }

    response = await fetch(`${SUPABASE_URL}/functions/v1/rag-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        prompt,
        conversationIdentifier,
        messages: messages || [],
        stream: true,
      }),
    });
  } catch (err) {
    callbacks.onError(
      err instanceof Error ? err : new Error('Network error calling rag-query')
    );
    return;
  }

  // Surface the busy 503 / ai_companion_busy in the same shape callers expect.
  if (!response.ok) {
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch {
      // ignore
    }
    let parsed: { error?: string; code?: string } | null = null;
    if (bodyText) {
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        // not JSON
      }
    }
    if (parsed?.code === 'ai_companion_busy' || response.status === 503) {
      callbacks.onError(
        new AICompanionBusyError(parsed?.error ?? BUSY_FALLBACK_MESSAGE)
      );
      return;
    }
    callbacks.onError(
      new Error(
        bodyText
          ? `rag-query ${response.status}: ${bodyText}`
          : `rag-query ${response.status}`
      )
    );
    return;
  }

  if (!response.body) {
    callbacks.onError(
      new Error('rag-query streaming response has no body')
    );
    return;
  }

  let completeReceived = false;
  try {
    for await (const evt of parseSSEStream(response.body)) {
      switch (evt.event) {
        case 'metadata': {
          try {
            const meta = JSON.parse(evt.data) as StreamMetadata;
            callbacks.onMetadata(meta);
          } catch (parseErr) {
            console.warn('Failed to parse metadata SSE:', parseErr);
          }
          break;
        }
        case 'token': {
          try {
            const { delta } = JSON.parse(evt.data) as { delta?: string };
            if (typeof delta === 'string' && delta.length > 0) {
              callbacks.onToken(delta);
            }
          } catch (parseErr) {
            console.warn('Failed to parse token SSE:', parseErr);
          }
          break;
        }
        case 'complete': {
          try {
            const payload = JSON.parse(evt.data) as StreamComplete;
            completeReceived = true;
            callbacks.onComplete(payload);
          } catch (parseErr) {
            callbacks.onError(
              parseErr instanceof Error
                ? parseErr
                : new Error('Failed to parse complete event')
            );
            return;
          }
          break;
        }
        case 'error': {
          try {
            const { error } = JSON.parse(evt.data) as { error?: string };
            callbacks.onError(
              new Error(error || 'Streaming error from rag-query')
            );
          } catch {
            callbacks.onError(new Error('Streaming error from rag-query'));
          }
          return;
        }
        default:
          // Unknown event — ignore for forward compatibility.
          break;
      }
    }
    if (!completeReceived) {
      callbacks.onError(
        new Error('Stream ended before completion event arrived')
      );
    }
  } catch (err) {
    callbacks.onError(
      err instanceof Error ? err : new Error('Stream parse failed')
    );
  }
};

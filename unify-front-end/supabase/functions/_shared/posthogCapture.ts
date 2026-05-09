/**
 * Shared PostHog capture utility for edge functions.
 * Sends events directly via PostHog's HTTP API (no SDK needed in Deno).
 */

const POSTHOG_HOST = 'https://us.i.posthog.com';

interface AiGenerationProperties {
  // Required
  $ai_model: string;
  $ai_provider: string;

  // Token usage
  $ai_input_tokens?: number;
  $ai_output_tokens?: number;
  $ai_total_tokens?: number;

  // Cost
  $ai_input_cost_usd?: number;
  $ai_output_cost_usd?: number;
  $ai_total_cost_usd?: number;

  // Trace
  $ai_trace_id?: string;

  // Custom properties
  [key: string]: unknown;
}

/**
 * Capture a PostHog `$ai_generation` event from an edge function.
 * This powers the LLM analytics dashboard (Generations view, cost tracking).
 *
 * Requires POSTHOG_API_KEY env var set in Supabase secrets.
 */
export function captureAiGeneration(
  distinctId: string,
  properties: AiGenerationProperties
): void {
  const apiKey = Deno.env.get('POSTHOG_API_KEY');
  if (!apiKey) {
    console.warn('POSTHOG_API_KEY not set — skipping $ai_generation capture');
    return;
  }

  const body = JSON.stringify({
    api_key: apiKey,
    event: '$ai_generation',
    distinct_id: distinctId,
    properties: {
      ...properties,
      $lib: 'posthog-edge-functions',
    },
  });

  // Fire-and-forget — don't block the response
  fetch(`${POSTHOG_HOST}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(err => {
    console.error('PostHog capture failed:', err);
  });
}

/**
 * Helper to compute Gemini cost from token counts.
 * Pricing as of 2025 for Gemini 2.5 Flash:
 *   Input:  $0.15 per 1M tokens
 *   Output: $0.60 per 1M tokens
 *
 * For Gemini 2.0 Flash:
 *   Input:  $0.10 per 1M tokens
 *   Output: $0.40 per 1M tokens
 */
export function computeGeminiCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): { inputCost: number; outputCost: number; totalCost: number } {
  // Determine pricing based on model
  let inputRate: number;
  let outputRate: number;

  if (model.includes('2.5')) {
    // Gemini 2.5 Flash
    inputRate = 0.15 / 1_000_000;
    outputRate = 0.6 / 1_000_000;
  } else {
    // Gemini 2.0 Flash (default)
    inputRate = 0.1 / 1_000_000;
    outputRate = 0.4 / 1_000_000;
  }

  const inputCost = inputTokens * inputRate;
  const outputCost = outputTokens * outputRate;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

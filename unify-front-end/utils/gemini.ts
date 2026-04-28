import { supabase } from '@/lib/supabase';

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

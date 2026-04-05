/**
 * Shared fetch utility with retry + timeout logic.
 * Used by both rag-query and ingest-documents edge functions.
 */

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 400;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options?: { timeoutMs?: number; retries?: number; retryDelayMs?: number }
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options?.retries ?? DEFAULT_MAX_RETRIES;
  const retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let cleanupAbortListener: (() => void) | undefined;
    let signal: AbortSignal = controller.signal;

    if (init.signal) {
      if (typeof AbortSignal.any === 'function') {
        signal = AbortSignal.any([init.signal, controller.signal]);
      } else if (init.signal.aborted) {
        controller.abort(init.signal.reason);
      } else {
        const abortWithCallerReason = () =>
          controller.abort(init.signal?.reason);
        init.signal.addEventListener('abort', abortWithCallerReason, {
          once: true,
        });
        cleanupAbortListener = () =>
          init.signal?.removeEventListener('abort', abortWithCallerReason);
      }
    }

    try {
      const response = await fetch(url, {
        ...init,
        signal,
      });

      if (response.ok) {
        return response;
      }

      const retriable = response.status >= 500 || response.status === 429;
      if (!retriable || attempt === retries) {
        return response;
      }
    } catch (error) {
      lastError = error;

      // If the caller's signal triggered the abort, rethrow immediately — don't retry.
      if (
        init?.signal?.aborted ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) {
        throw error;
      }

      if (attempt === retries) {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
      cleanupAbortListener?.();
    }

    attempt += 1;
    await sleep(retryDelayMs * attempt);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Request failed after retries');
}

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

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      const retriable = response.status >= 500 || response.status === 429;
      if (!retriable || attempt === retries) {
        return response;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (attempt === retries) {
        throw error;
      }
    }

    attempt += 1;
    await sleep(retryDelayMs * attempt);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Request failed after retries');
}

/**
 * Pure SSE (Server-Sent Events) parser for ReadableStream<Uint8Array>.
 *
 * Yields one `{ event, data }` object per parsed SSE message. SSE messages are
 * delimited by `\n\n` and each line within a message is `<field>: <value>`.
 * We support the two fields rag-query emits today:
 *   - `event: <name>`  (defaults to 'message' if absent, per SSE spec)
 *   - `data: <json>`   (joined with '\n' if multiple data lines, per spec)
 *
 * Comments (lines starting with `:`) and unknown fields are ignored.
 *
 * No React / RN dependencies — pure async generator over a ReadableStream so
 * it's trivially unit-testable.
 *
 * Hermes/Expo dev-mode caveat: Expo's `CdpInterceptor` (Chrome DevTools
 * inspector hook) can buffer/block streaming `fetch` responses in dev mode,
 * making `response.body.getReader()` look frozen. See Expo issue #27526.
 * Production builds and Hermes without the inspector work fine.
 */

export interface SSEEvent {
  event: string;
  data: string;
}

/**
 * Parse an SSE byte stream into discrete events.
 *
 * Caller should `for await (const evt of parseSSEStream(body)) { ... }`.
 * Releases the stream's lock automatically when the generator completes
 * (via try/finally in the consumer's `for await`, or by exiting normally).
 */
export async function* parseSSEStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<SSEEvent, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // Flush any final message that wasn't terminated by `\n\n`.
        const trailing = buffer.trim();
        if (trailing.length > 0) {
          const evt = parseSingleEvent(trailing);
          if (evt) yield evt;
        }
        return;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by a blank line (`\n\n` or `\r\n\r\n`).
      // Normalize CRLF to LF so we only have to scan for `\n\n`.
      buffer = buffer.replace(/\r\n/g, '\n');

      let separatorIndex = buffer.indexOf('\n\n');
      while (separatorIndex !== -1) {
        const rawMessage = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        const evt = parseSingleEvent(rawMessage);
        if (evt) yield evt;

        separatorIndex = buffer.indexOf('\n\n');
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // releaseLock throws if the reader is in an active read — safe to ignore
      // because the stream is already done at this point.
    }
  }
}

function parseSingleEvent(rawMessage: string): SSEEvent | null {
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of rawMessage.split('\n')) {
    if (line.length === 0) continue;
    // Comment line per SSE spec — ignore.
    if (line.startsWith(':')) continue;

    const colonIndex = line.indexOf(':');
    const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
    // Per spec, a single leading space after the colon is stripped.
    let value = colonIndex === -1 ? '' : line.slice(colonIndex + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') {
      event = value;
    } else if (field === 'data') {
      dataLines.push(value);
    }
    // id / retry / unknown fields — ignored for our use case.
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}

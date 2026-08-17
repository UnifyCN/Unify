/**
 * Builds and opens a resource URL, then records the open only after the opener
 * succeeds. URL construction stays inside the guarded path because `new URL()`
 * can throw for malformed partner content.
 */
export async function openResourceLink(
  buildUrl: () => string,
  open: (url: string) => Promise<unknown>,
  onOpened?: () => void
): Promise<boolean> {
  try {
    const url = buildUrl();
    await open(url);
    onOpened?.();
    return true;
  } catch {
    return false;
  }
}

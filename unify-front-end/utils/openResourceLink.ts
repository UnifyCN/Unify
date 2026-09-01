import type { ResourceLinkFailureReason } from '@/types/partner';

/**
 * Builds a resource URL, records click intent, then hands the URL to the native
 * launcher. Click analytics deliberately runs before launch so iOS dismissal
 * and Android task resolution cannot change the meaning of the event.
 */
type Options = {
  buildUrl: () => string;
  launch: (url: string) => Promise<unknown>;
  onIntent?: () => void;
  onFailure?: (reason: ResourceLinkFailureReason) => void;
};

function reportFailure(
  callback: Options['onFailure'],
  reason: ResourceLinkFailureReason
) {
  try {
    callback?.(reason);
  } catch {
    // Analytics must never prevent error recovery or surface a second failure.
  }
}

export async function launchResourceLink({
  buildUrl,
  launch,
  onIntent,
  onFailure,
}: Options): Promise<boolean> {
  let url: string;
  try {
    url = buildUrl();
  } catch {
    reportFailure(onFailure, 'invalid_url');
    return false;
  }

  try {
    onIntent?.();
  } catch {
    // Analytics must never block the user's requested navigation.
  }

  try {
    await launch(url);
    return true;
  } catch {
    reportFailure(onFailure, 'launch_failed');
    return false;
  }
}

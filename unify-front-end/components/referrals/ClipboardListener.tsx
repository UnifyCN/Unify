import { useClipboardOnFirstLaunch } from '@/hooks/referrals/useClipboardOnFirstLaunch';

/**
 * Mounted once at the app root. Runs the first-launch clipboard read for
 * detecting `unify-invite:CODE` payloads. Renders nothing.
 */
export function ClipboardListener(): null {
  useClipboardOnFirstLaunch();
  return null;
}

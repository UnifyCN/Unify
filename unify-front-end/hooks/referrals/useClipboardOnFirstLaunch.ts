import { useEffect, useRef } from 'react';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useInviteCode } from '@/context/InviteCodeContext';
import { parseInviteCode } from '@/utils/inviteLink';
import { useAnalytics, AnalyticsEvents } from '@/utils/analytics';

const FIRST_LAUNCH_FLAG = '@unify/clipboard_invite_check_done';

/**
 * On the first cold launch only, read the iOS clipboard ONCE looking for a
 * `unify-invite:CODE` payload. If found, hand the code to InviteCodeContext so
 * onboarding step 3 can pre-fill it. Subsequent launches no-op.
 *
 * iOS 14+ shows a paste banner on read. We accept that one-time banner because
 * the alternative (manual entry only) loses ~50% of attribution. We do NOT
 * retry — if the user pastes another invite later they can type it manually.
 */
export function useClipboardOnFirstLaunch(): void {
  const { setCode } = useInviteCode();
  const { capture } = useAnalytics();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const flag = await AsyncStorage.getItem(FIRST_LAUNCH_FLAG);
        if (flag === '1') return;

        const raw = await Clipboard.getStringAsync();
        const code = parseInviteCode(raw);

        if (!cancelled && code) {
          setCode(code, 'clipboard');
          capture(AnalyticsEvents.INVITE_CODE_DETECTED_FROM_CLIPBOARD, { code });
        }
      } catch (err) {
        // Permission denied / clipboard unavailable: no-op
        console.debug('useClipboardOnFirstLaunch: skipped', err);
      } finally {
        try {
          await AsyncStorage.setItem(FIRST_LAUNCH_FLAG, '1');
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setCode, capture]);
}

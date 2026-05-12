import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
  GIVEAWAY,
  millisecondsUntilDeadline,
} from '@/constants/Giveaway';

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export interface GiveawayCountdown {
  /** True while the deadline is in the future. */
  isActive: boolean;
  /** Compact display string like "8d 14h" or "3h 22m" or "47m" or "" once expired.
   *  Format is language-neutral: digit + single-letter unit. The translated
   *  prefix ("Ends in") is rendered separately. */
  display: string;
  /** Raw remaining time, useful for finer-grained UIs. */
  days: number;
  hours: number;
  minutes: number;
}

function compute(now: number): GiveawayCountdown {
  const remaining = Math.max(
    0,
    GIVEAWAY.deadlineUtc.getTime() - now
  );
  const isActive = remaining > 0;

  const days = Math.floor(remaining / MS_PER_DAY);
  const hours = Math.floor((remaining % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((remaining % MS_PER_HOUR) / MS_PER_MINUTE);

  let display = '';
  if (isActive) {
    if (days > 0) {
      // 1+ days remain: show "Xd Yh" — minutes don't add useful precision
      display = `${days}d ${hours}h`;
    } else if (hours > 0) {
      // < 1 day: show "Xh Ym" — minutes start mattering
      display = `${hours}h ${minutes}m`;
    } else {
      // < 1 hour: show "Xm" — every minute counts now
      display = `${Math.max(1, minutes)}m`;
    }
  }

  return { isActive, display, days, hours, minutes };
}

/**
 * Live countdown to the giveaway deadline. Ticks every 60 seconds —
 * per-second updates were intentionally rejected (no UX benefit, battery cost).
 *
 * Re-syncs immediately when the app returns to the foreground, so a user
 * coming back after the deadline sees the expired state without waiting
 * for the next tick.
 */
export function useGiveawayCountdown(): GiveawayCountdown {
  const [state, setState] = useState<GiveawayCountdown>(() =>
    compute(Date.now())
  );

  useEffect(() => {
    if (millisecondsUntilDeadline() <= 0) return; // already expired, no need to tick

    const interval = setInterval(() => {
      setState(compute(Date.now()));
    }, MS_PER_MINUTE);

    const onAppStateChange = (next: AppStateStatus) => {
      if (next === 'active') {
        setState(compute(Date.now()));
      }
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return state;
}

import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
  GIVEAWAY,
  isGiveawayActive,
  millisecondsUntilDeadline,
} from '@/constants/Giveaway';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export interface PreciseCountdown {
  isActive: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function compute(now: number): PreciseCountdown {
  const remaining = Math.max(0, GIVEAWAY.deadlineUtc.getTime() - now);
  const isActive = isGiveawayActive(new Date(now));
  return {
    isActive,
    days: Math.floor(remaining / MS_PER_DAY),
    hours: Math.floor((remaining % MS_PER_DAY) / MS_PER_HOUR),
    minutes: Math.floor((remaining % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((remaining % MS_PER_MINUTE) / MS_PER_SECOND),
  };
}

/**
 * Per-second countdown for the welcome / entry screens where urgency matters
 * and the user is only on screen briefly. The banner uses the per-minute
 * variant since it's always mounted and per-second ticks would burn battery.
 */
export function useGiveawayCountdownPrecise(): PreciseCountdown {
  const [state, setState] = useState<PreciseCountdown>(() =>
    compute(Date.now())
  );

  useEffect(() => {
    if (millisecondsUntilDeadline() <= 0) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      const next = compute(Date.now());
      setState(next);
      if (!next.isActive && interval) {
        clearInterval(interval);
        interval = undefined;
      }
    };

    interval = setInterval(tick, MS_PER_SECOND);

    const onAppStateChange = (next: AppStateStatus) => {
      if (next === 'active') {
        tick();
      }
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      if (interval) clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return state;
}

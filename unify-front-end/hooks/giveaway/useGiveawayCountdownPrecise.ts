import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
  GIVEAWAY,
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
  const isActive = remaining > 0;
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

    const interval = setInterval(() => {
      setState(compute(Date.now()));
    }, MS_PER_SECOND);

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

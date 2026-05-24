import { useEffect, useRef } from 'react';
import { requestStoreReview } from '@/utils/storeReview';

const REVIEW_PROMPT_THRESHOLDS = [3, 5] as const;
const PROMPT_DELAY_MS = 1500;

/**
 * Fires the iOS App Store review prompt when the user's lifetime
 * Companion message count crosses 3 or 5 during the current session.
 * Apple's SKStoreReviewRequest enforces the 3-per-year hard limit,
 * so we don't dedupe across app launches ourselves.
 */
export function useCompanionReviewPrompt(messageCount: number | undefined) {
  const baselineRef = useRef<number | null>(null);
  const firedRef = useRef<Set<number>>(new Set());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (messageCount === undefined) return;

    if (baselineRef.current === null) {
      baselineRef.current = messageCount;
      return;
    }

    for (const threshold of REVIEW_PROMPT_THRESHOLDS) {
      if (
        messageCount >= threshold &&
        baselineRef.current < threshold &&
        !firedRef.current.has(threshold)
      ) {
        firedRef.current.add(threshold);
        timeoutRef.current = setTimeout(requestStoreReview, PROMPT_DELAY_MS);
        break;
      }
    }
  }, [messageCount]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
}

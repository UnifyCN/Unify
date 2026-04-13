/**
 * Feature flags
 *
 * Set to `true` to enable; `false` falls back to the prior behavior.
 * These are compile-time constants — no remote flag service required.
 * Swap to an async/remote flag system in a future iteration if needed.
 */
export const FEATURE_FLAGS = {
  /** Rank Learn modules by personalization score from the personalize edge function. */
  personalization_enabled: true,
} as const;

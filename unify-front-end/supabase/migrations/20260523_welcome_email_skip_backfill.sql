-- ============================================================================
-- Welcome email: skip backfill of stale users
--
-- The original cron deploy intended to backfill ~86 users who had completed
-- onboarding before the server-side trigger existed. Backfill ran into Resend's
-- rate limit and only ~25 of 86 got delivered before we decided to abandon it.
--
-- Sending a "Welcome to Unify" to someone who joined 2 weeks ago feels off
-- anyway — they've already explored or churned. From here on the cron only
-- handles new onboardings (current traffic is well under Resend's rate limit
-- so the throttle problem disappears).
--
-- Retire the remaining stale rows by bumping welcome_email_attempts to the
-- cap (5), which is the natural "we tried, give up" signal the cron already
-- respects. Brand-new users (welcome_email_attempts = 0) are untouched.
-- ============================================================================

UPDATE public.user_onboarding_profiles
SET welcome_email_attempts = 5
WHERE onboarding_completed = true
  AND welcome_email_sent_at IS NULL
  AND welcome_email_attempts > 0
  AND welcome_email_attempts < 5;

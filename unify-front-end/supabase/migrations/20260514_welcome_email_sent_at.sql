-- supabase/migrations/20260514_welcome_email_sent_at.sql
ALTER TABLE public.user_onboarding_profiles
  ADD COLUMN welcome_email_sent_at timestamp with time zone;

COMMENT ON COLUMN public.user_onboarding_profiles.welcome_email_sent_at IS
  'Timestamp when the welcome email was successfully sent via Resend. NULL = not yet sent. Set by the send-welcome-email edge function (service role). Acts as the idempotency gate so redo-onboarding does not re-send.';

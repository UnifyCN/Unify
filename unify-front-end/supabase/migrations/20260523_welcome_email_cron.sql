-- ============================================================================
-- Welcome email server-side trigger
--
-- Problem: the client-side fire-and-forget trigger in OnboardingQuiz was
-- losing sends silently (older app builds + swallowed errors + RN navigation
-- cancelling in-flight fetches). DB shows ~1 send out of ~20 onboardings
-- since the feature shipped on 2026-05-15.
--
-- Fix: move the trigger here. Cron polls every 2 minutes, finds users with
-- onboarding_completed AND welcome_email_sent_at IS NULL, fires the edge
-- function once per user with bounded retry (5 attempts, 5 min apart).
-- ============================================================================

ALTER TABLE public.user_onboarding_profiles
  ADD COLUMN IF NOT EXISTS welcome_email_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS welcome_email_last_attempt_at timestamp with time zone;

COMMENT ON COLUMN public.user_onboarding_profiles.welcome_email_attempts IS
  'Number of times send-welcome-email has tried to deliver. Cron stops retrying at 5. Rows with attempts=5 AND welcome_email_sent_at IS NULL are permanently abandoned and indicate a Resend-side failure worth investigating.';
COMMENT ON COLUMN public.user_onboarding_profiles.welcome_email_last_attempt_at IS
  'When the most recent send was attempted. Cron uses this to space retries 5 min apart.';

create or replace function public.trigger_send_pending_welcome_emails()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _supabase_url text;
  _service_key text;
  _welcome_api_key text;
  _row record;
begin
  _supabase_url := current_setting('app.settings.supabase_url', true);
  if _supabase_url is null or _supabase_url = '' then
    _supabase_url := (
      select decrypted_secret from vault.decrypted_secrets
      where name = 'supabase_url'
      limit 1
    );
  end if;

  _service_key := (
    select decrypted_secret from vault.decrypted_secrets
    where name = 'service_role_key'
    limit 1
  );

  _welcome_api_key := (
    select decrypted_secret from vault.decrypted_secrets
    where name = 'welcome_email_api_key'
    limit 1
  );

  if _supabase_url is null or _service_key is null or _welcome_api_key is null then
    raise warning 'trigger_send_pending_welcome_emails: missing supabase_url, service_role_key, or welcome_email_api_key in vault';
    return;
  end if;

  -- Fire one POST per pending user. Edge function handles dedup via
  -- welcome_email_sent_at + attempt-counter bump, so racing with the next cron
  -- tick is safe. LIMIT 50 caps blast radius if a deploy backfills a lot at once.
  for _row in
    select id
    from public.user_onboarding_profiles
    where onboarding_completed = true
      and welcome_email_sent_at is null
      and welcome_email_attempts < 5
      and (welcome_email_last_attempt_at is null
           or welcome_email_last_attempt_at < now() - interval '5 minutes')
      and updated_at > now() - interval '30 days'
    order by updated_at asc
    limit 50
  loop
    perform net.http_post(
      url := _supabase_url || '/functions/v1/send-welcome-email',
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_key,
        'x-api-key', _welcome_api_key
      )::jsonb,
      body := json_build_object('userId', _row.id)::jsonb,
      timeout_milliseconds := 15000
    );
  end loop;
end;
$$;

revoke execute on function public.trigger_send_pending_welcome_emails() from public, anon, authenticated;
grant execute on function public.trigger_send_pending_welcome_emails() to service_role;

do $$
declare
  _job_id bigint;
begin
  for _job_id in
    select jobid from cron.job where jobname = 'send-pending-welcome-emails'
  loop
    perform cron.unschedule(_job_id);
  end loop;

  perform cron.schedule(
    'send-pending-welcome-emails',
    '*/2 * * * *',
    'select public.trigger_send_pending_welcome_emails()'
  );
end;
$$;

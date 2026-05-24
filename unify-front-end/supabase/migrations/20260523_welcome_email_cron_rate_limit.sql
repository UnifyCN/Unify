-- ============================================================================
-- Welcome email cron: throttle to dodge Resend rate limit
--
-- Initial deploy fired the whole batch (up to 50 net.http_post calls) in a
-- tight loop — all 50 sends hit Resend within <1s. With Resend's default
-- 2 req/sec limit that meant ~80% returned 429 and ~17% got delivered
-- (observed: 15/87 on the backfill batch).
--
-- pg_sleep(0.6) between calls gives ~1.6 req/sec — under the limit, with
-- headroom. A full batch of 50 now takes ~30s, still well under the
-- cron's 2-minute interval.
-- ============================================================================

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
    perform pg_sleep(0.6);
  end loop;
end;
$$;

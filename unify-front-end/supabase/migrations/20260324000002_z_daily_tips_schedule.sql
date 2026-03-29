-- ============================================================================
-- Daily tips cron schedule
-- Runs daily at 6 AM UTC to generate personalized tips for each cohort
-- Pattern: vault-based wrapper function (same as learn reminders)
-- ============================================================================

create or replace function public.trigger_generate_daily_tips()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _supabase_url text;
  _service_key text;
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

  if _supabase_url is null or _service_key is null then
    raise warning 'trigger_generate_daily_tips: missing supabase_url or service_role_key in vault';
    return;
  end if;

  perform net.http_post(
    url := _supabase_url || '/functions/v1/generate-daily-tips',
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    )::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
end;
$$;

revoke execute on function public.trigger_generate_daily_tips() from public, anon, authenticated;
grant execute on function public.trigger_generate_daily_tips() to service_role;

-- Schedule: 6 AM UTC daily (idempotent — unschedule first)
do $$
declare
  _job_id bigint;
begin
  for _job_id in
    select jobid from cron.job where jobname = 'generate-daily-tips'
  loop
    perform cron.unschedule(_job_id);
  end loop;

  perform cron.schedule(
    'generate-daily-tips',
    '0 6 * * *',
    'select public.trigger_generate_daily_tips()'
  );
end;
$$;

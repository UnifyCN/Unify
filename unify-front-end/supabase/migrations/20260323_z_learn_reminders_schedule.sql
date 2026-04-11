-- ============================================================================
-- Learn reminders cron schedule
-- Runs daily at 2 PM UTC (~9-10 AM Eastern) to send tiered learn reminders
-- ============================================================================

create or replace function public.trigger_send_learn_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _supabase_url text;
  _service_key text;
  _learn_reminders_api_key text;
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

  _learn_reminders_api_key := (
    select decrypted_secret from vault.decrypted_secrets
    where name = 'learn_reminders_api_key'
    limit 1
  );

  if _supabase_url is null or _service_key is null or _learn_reminders_api_key is null then
    raise warning 'trigger_send_learn_reminders: missing supabase_url, service_role_key, or learn_reminders_api_key in vault';
    return;
  end if;

  perform net.http_post(
    url := _supabase_url || '/functions/v1/send-learn-reminders',
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key,
      'x-api-key', _learn_reminders_api_key
    )::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

revoke execute on function public.trigger_send_learn_reminders() from public, anon, authenticated;
grant execute on function public.trigger_send_learn_reminders() to service_role;

do $$
declare
  _job_id bigint;
begin
  for _job_id in
    select jobid from cron.job where jobname = 'learn-reminders-daily'
  loop
    perform cron.unschedule(_job_id);
  end loop;

  perform cron.schedule(
    'learn-reminders-daily',
    '0 14 * * *',
    'select public.trigger_send_learn_reminders()'
  );
end;
$$;

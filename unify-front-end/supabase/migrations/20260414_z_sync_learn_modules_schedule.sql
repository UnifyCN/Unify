-- ============================================================================
-- Weekly safety-net: Sanity → learn_modules via Edge Function sync-learn-modules
-- Same vault pattern as learn-reminders (supabase_url + API key).
-- Vault secrets required:
--   - supabase_url
--   - sync_learn_modules_api_key  (same value as Edge secret SYNC_LEARN_MODULES_API_KEY)
-- ============================================================================

create or replace function public.trigger_sync_learn_modules()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _supabase_url text;
  _api_key text;
begin
  _supabase_url := current_setting('app.settings.supabase_url', true);
  if _supabase_url is null or _supabase_url = '' then
    _supabase_url := (
      select decrypted_secret from vault.decrypted_secrets
      where name = 'supabase_url'
      limit 1
    );
  end if;

  _api_key := (
    select decrypted_secret from vault.decrypted_secrets
    where name = 'sync_learn_modules_api_key'
    limit 1
  );

  if _supabase_url is null or _api_key is null then
    raise warning 'trigger_sync_learn_modules: missing supabase_url or sync_learn_modules_api_key in vault';
    return;
  end if;

  perform net.http_post(
    url := _supabase_url || '/functions/v1/sync-learn-modules',
    headers := json_build_object(
      'Content-Type', 'application/json',
      'x-api-key', _api_key
    )::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
end;
$$;

revoke execute on function public.trigger_sync_learn_modules() from public, anon, authenticated;
grant execute on function public.trigger_sync_learn_modules() to service_role;

do $$
declare
  _job_id bigint;
begin
  for _job_id in
    select jobid from cron.job where jobname = 'sync-learn-modules-weekly'
  loop
    perform cron.unschedule(_job_id);
  end loop;

  perform cron.schedule(
    'sync-learn-modules-weekly',
    '0 3 * * 0',
    'select public.trigger_sync_learn_modules()'
  );
end;
$$;

-- ============================================================================
-- Route matchmaking cron through the established live function slug
-- ============================================================================

create or replace function public.trigger_matchmake_circles()
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
    raise warning 'trigger_matchmake_circles: missing supabase_url or service_role_key in vault';
    return;
  end if;

  perform net.http_post(
    url := _supabase_url || '/functions/v1/matchmake-circles',
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    )::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

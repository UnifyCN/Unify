-- ============================================================================
-- Direct SQL lifecycle for circles: closes expired circles via pg_cron
-- without relying on the edge function HTTP roundtrip.
-- ============================================================================

-- 1. SQL function that closes expired circles directly in the database.
--    Runs every 3 minutes via pg_cron. Idempotent — safe to overlap with
--    the edge function if it also runs.
create or replace function public.close_expired_circles_cron()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _circle_ids uuid[];
  _closed_count integer := 0;
begin
  -- Collect active circles past their ends_at
  select array_agg(id) into _circle_ids
  from community_circles
  where status = 'active'
    and ends_at <= now();

  if _circle_ids is null or array_length(_circle_ids, 1) is null then
    return jsonb_build_object('closed', 0);
  end if;

  -- Mark circles as ended
  update community_circles
  set status = 'ended'
  where id = any(_circle_ids)
    and status = 'active';

  get diagnostics _closed_count = row_count;

  -- Insert closing system messages (dedupe_key prevents duplicates)
  insert into community_messages
    (circle_id, sender_user_id, content, message_type, metadata, dedupe_key)
  select
    cid,
    null,
    'This circle has wrapped up. Say thanks, follow one another, and keep the support going beyond Circles.',
    'system_notice',
    '{"kind": "circle_ended"}'::jsonb,
    'system:circle-ended'
  from unnest(_circle_ids) as cid
  on conflict (circle_id, dedupe_key) do nothing;

  -- Notify active members that their circle ended (skip duplicates)
  insert into community_notifications
    (user_id, type, title, body, data)
  select
    m.user_id,
    'circle_ended',
    'Your circle has wrapped up',
    'Say thanks, follow one another, and keep the support going.',
    jsonb_build_object('circle_id', m.circle_id)
  from community_circle_members m
  where m.circle_id = any(_circle_ids)
    and m.left_at is null
    and not exists (
      select 1 from community_notifications n
      where n.user_id = m.user_id
        and n.type = 'circle_ended'
        and n.data->>'circle_id' = m.circle_id::text
    );

  return jsonb_build_object('closed', _closed_count);
end;
$$;

revoke execute on function public.close_expired_circles_cron() from public, anon, authenticated;
grant execute on function public.close_expired_circles_cron() to postgres, service_role;

-- 2. Schedule the lifecycle cron (every 3 minutes, same cadence as matchmaking)
do $$
declare
  _job_id bigint;
begin
  -- Remove any existing job with this name
  for _job_id in
    select jobid from cron.job where jobname = 'close-expired-circles'
  loop
    perform cron.unschedule(_job_id);
  end loop;

  perform cron.schedule(
    'close-expired-circles',
    '*/3 * * * *',
    'select public.close_expired_circles_cron()'
  );
end;
$$;

-- 3. Add matchmake_api_key to vault so the existing cron trigger can
--    authenticate against the edge function for matchmaking.
--    Uses gen_random_uuid() as a simple shared secret.
do $$
begin
  -- Only insert if the secret doesn't already exist
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'matchmake_api_key'
  ) then
    perform vault.create_secret(
      gen_random_uuid()::text,
      'matchmake_api_key',
      'Shared secret for cron → matchmake-circles edge function auth'
    );
  end if;
end;
$$;

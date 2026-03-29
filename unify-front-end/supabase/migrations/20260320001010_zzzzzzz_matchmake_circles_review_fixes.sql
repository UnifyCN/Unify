-- ============================================================================
-- Matchmake circles review fixes: permissions, waitlist backfill, atomic delete
-- ============================================================================

create or replace function public.delete_expired_community_circles(
  _circle_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _deleted_count integer := 0;
  _circle_id_texts text[];
begin
  if coalesce(array_length(_circle_ids, 1), 0) = 0 then
    return 0;
  end if;

  _circle_id_texts := array(
    select circle_id::text
    from unnest(_circle_ids) as circle_id
  );

  delete from community_messages
  where circle_id = any(_circle_ids);

  delete from community_circle_members
  where circle_id = any(_circle_ids);

  delete from community_notifications
  where data ? 'circle_id'
    and data->>'circle_id' = any(_circle_id_texts);

  delete from community_circles
  where id = any(_circle_ids);

  get diagnostics _deleted_count = row_count;
  return _deleted_count;
end;
$$;

revoke execute on function public.delete_expired_community_circles(uuid[]) from public, anon, authenticated;
grant execute on function public.delete_expired_community_circles(uuid[]) to service_role;

update public.community_match_waitlist
set pool_key =
  regexp_replace(lower(trim(coalesce(nullif(persona, ''), 'mixed'))), '\s+', '_', 'g') ||
  '__' ||
  regexp_replace(lower(trim(coalesce(nullif(time_in_canada, ''), 'unknown'))), '\s+', '_', 'g')
where pool_key is distinct from (
  regexp_replace(lower(trim(coalesce(nullif(persona, ''), 'mixed'))), '\s+', '_', 'g') ||
  '__' ||
  regexp_replace(lower(trim(coalesce(nullif(time_in_canada, ''), 'unknown'))), '\s+', '_', 'g')
);

revoke execute on function public.trigger_matchmake_circles() from public, anon, authenticated;
grant execute on function public.trigger_matchmake_circles() to postgres, service_role;

-- These quota bookkeeping RPCs are internal server operations. Keeping EXECUTE
-- limited to service_role prevents clients from supplying another user's ID.
revoke execute
  on function public.check_and_increment_chatbot_usage(uuid, integer)
  from public, anon, authenticated;

revoke execute
  on function public.increment_chatbot_usage(uuid, bigint, double precision)
  from public, anon, authenticated;

revoke execute
  on function public.refund_chatbot_message(uuid)
  from public, anon, authenticated;

grant execute
  on function public.check_and_increment_chatbot_usage(uuid, integer)
  to service_role;

grant execute
  on function public.increment_chatbot_usage(uuid, bigint, double precision)
  to service_role;

grant execute
  on function public.refund_chatbot_message(uuid)
  to service_role;

-- Fail this migration immediately if any effective privilege is not as intended.
-- PUBLIC is a pseudo-role, so inspect the expanded ACL instead of passing it to
-- has_function_privilege.
do $$
declare
  target regprocedure;
begin
  foreach target in array array[
    'public.check_and_increment_chatbot_usage(uuid,integer)'::regprocedure,
    'public.increment_chatbot_usage(uuid,bigint,double precision)'::regprocedure,
    'public.refund_chatbot_message(uuid)'::regprocedure
  ]
  loop
    if exists (
      select 1
      from pg_catalog.pg_proc as p
      cross join lateral pg_catalog.aclexplode(
        coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
      ) as a
      where p.oid = target::oid
        and a.grantee = 0
        and a.privilege_type = 'EXECUTE'
    ) then
      raise exception 'PUBLIC still has EXECUTE on %', target;
    end if;

    if pg_catalog.has_function_privilege('anon', target::oid, 'execute') then
      raise exception 'anon still has EXECUTE on %', target;
    end if;

    if pg_catalog.has_function_privilege('authenticated', target::oid, 'execute') then
      raise exception 'authenticated still has EXECUTE on %', target;
    end if;

    if not pg_catalog.has_function_privilege('service_role', target::oid, 'execute') then
      raise exception 'service_role does not have EXECUTE on %', target;
    end if;
  end loop;
end
$$;

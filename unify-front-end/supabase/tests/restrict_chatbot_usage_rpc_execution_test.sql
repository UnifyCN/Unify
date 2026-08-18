begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(12);

with targets(name, signature) as (
  values
    (
      'check_and_increment_chatbot_usage',
      'public.check_and_increment_chatbot_usage(uuid,integer)'::regprocedure
    ),
    (
      'increment_chatbot_usage',
      'public.increment_chatbot_usage(uuid,bigint,double precision)'::regprocedure
    ),
    (
      'refund_chatbot_message',
      'public.refund_chatbot_message(uuid)'::regprocedure
    )
),
expected(role_name, can_execute) as (
  values
    ('public', false),
    ('anon', false),
    ('authenticated', false),
    ('service_role', true)
),
actual as (
  select
    targets.name,
    expected.role_name,
    expected.can_execute,
    case
      when expected.role_name = 'public' then exists (
        select 1
        from pg_catalog.pg_proc as p
        cross join lateral pg_catalog.aclexplode(
          coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
        ) as a
        where p.oid = targets.signature::oid
          and a.grantee = 0
          and a.privilege_type = 'EXECUTE'
      )
      else pg_catalog.has_function_privilege(
        expected.role_name::name,
        targets.signature::oid,
        'execute'
      )
    end as can_actually_execute
  from targets
  cross join expected
)
select ok(
  can_actually_execute is not distinct from can_execute,
  format(
    '%s EXECUTE on %s is %s',
    role_name,
    name,
    case when can_execute then 'granted' else 'revoked' end
  )
)
from actual
order by name, role_name;

select * from finish();

rollback;

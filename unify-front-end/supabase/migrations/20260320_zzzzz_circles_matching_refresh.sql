set check_function_bodies = off;

alter table public.community_match_waitlist
  alter column persona drop not null;

alter table public.community_match_waitlist
  add column if not exists goal text,
  add column if not exists topics text[] default '{}'::text[],
  add column if not exists placement_deadline_at timestamptz;

update public.community_match_waitlist
set
  topics = coalesce(topics, '{}'::text[]),
  placement_deadline_at = coalesce(
    placement_deadline_at,
    created_at + interval '3 days'
  );

alter table public.community_match_waitlist
  alter column topics set not null,
  alter column topics set default '{}'::text[],
  alter column placement_deadline_at set default timezone('utc', now()) + interval '3 days';

create index if not exists community_match_waitlist_deadline_idx
  on public.community_match_waitlist (status, placement_deadline_at);

alter table public.community_circles
  alter column persona drop not null;

alter table public.community_circles
  add column if not exists goal text,
  add column if not exists topics text[] default '{}'::text[],
  add column if not exists match_metadata jsonb default '{}'::jsonb;

update public.community_circles
set
  topics = coalesce(topics, '{}'::text[]),
  match_metadata = coalesce(match_metadata, '{}'::jsonb);

alter table public.community_circles
  alter column topics set not null,
  alter column topics set default '{}'::text[],
  alter column match_metadata set not null,
  alter column match_metadata set default '{}'::jsonb;

alter table public.community_messages
  add column if not exists message_type text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists dedupe_key text;

update public.community_messages
set
  message_type = case
    when sender_user_id is null then 'system_notice'
    else 'user'
  end,
  metadata = coalesce(metadata, '{}'::jsonb)
where message_type is null
   or metadata is null;

alter table public.community_messages
  alter column message_type set not null,
  alter column message_type set default 'user',
  alter column metadata set not null,
  alter column metadata set default '{}'::jsonb;

alter table public.community_messages
  drop constraint if exists community_messages_message_type_check;

alter table public.community_messages
  add constraint community_messages_message_type_check
  check (message_type in ('user', 'system_notice', 'daily_prompt'));

alter table public.community_messages
  drop constraint if exists community_messages_sender_type_check;

alter table public.community_messages
  add constraint community_messages_sender_type_check
  check (
    (message_type = 'user' and sender_user_id is not null) or
    (message_type in ('system_notice', 'daily_prompt') and sender_user_id is null)
  );

create unique index if not exists community_messages_circle_dedupe_idx
  on public.community_messages (circle_id, dedupe_key);

drop policy if exists community_messages_insert_members on public.community_messages;

create policy community_messages_insert_members
  on public.community_messages
  for insert
  with check (
    auth.uid() = sender_user_id
    and message_type = 'user'
    and exists (
      select 1
      from public.community_circle_members m
      where m.circle_id = community_messages.circle_id
        and m.user_id = auth.uid()
        and m.left_at is null
    )
  );

create table if not exists public.community_matching_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'error')),
  summary jsonb not null default '{}'::jsonb,
  error text
);

create index if not exists community_matching_runs_started_idx
  on public.community_matching_runs (started_at desc);

create or replace function public.join_community_waitlist(
  _persona text,
  _time_in_canada text,
  _pool_key text,
  _goal text default null,
  _topics text[] default '{}'::text[]
)
returns public.community_match_waitlist
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _row public.community_match_waitlist;
begin
  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  if _time_in_canada is null or btrim(_time_in_canada) = '' then
    raise exception 'time_in_canada is required';
  end if;

  insert into public.community_match_waitlist (
    user_id,
    persona,
    time_in_canada,
    pool_key,
    goal,
    topics,
    status,
    created_at,
    placement_deadline_at
  )
  values (
    _user_id,
    nullif(btrim(_persona), ''),
    _time_in_canada,
    _pool_key,
    nullif(btrim(_goal), ''),
    coalesce(_topics, '{}'::text[]),
    'waiting',
    timezone('utc', now()),
    timezone('utc', now()) + interval '3 days'
  )
  on conflict (user_id) do update
  set
    persona = excluded.persona,
    time_in_canada = excluded.time_in_canada,
    pool_key = excluded.pool_key,
    goal = excluded.goal,
    topics = excluded.topics,
    status = 'waiting',
    created_at = timezone('utc', now()),
    placement_deadline_at = timezone('utc', now()) + interval '3 days'
  returning * into _row;

  return _row;
end;
$$;

grant execute on function public.join_community_waitlist(text, text, text, text, text[]) to authenticated;

create or replace function public.create_circle_match(
  _pool_key text,
  _persona text,
  _time_in_canada text,
  _goal text,
  _topics text[],
  _member_ids uuid[],
  _match_metadata jsonb default '{}'::jsonb,
  _notification_title text default 'You''ve been matched!',
  _notification_body text default 'Your Unify Circle is ready. Tap to meet your group.',
  _welcome_message text default 'You have a new Unify Circle! Take a moment to introduce yourself and share what you hope to learn over the next 14 days.'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _circle_id uuid;
  _user_a uuid;
  _user_b uuid;
  _member_id uuid;
begin
  if cardinality(_member_ids) is null or cardinality(_member_ids) < 2 then
    raise exception 'At least two members are required to create a circle';
  end if;

  insert into public.community_circles (
    pool_key,
    persona,
    time_in_canada,
    goal,
    topics,
    status,
    ends_at,
    match_metadata
  )
  values (
    _pool_key,
    nullif(btrim(_persona), ''),
    _time_in_canada,
    nullif(btrim(_goal), ''),
    coalesce(_topics, '{}'::text[]),
    'active',
    timezone('utc', now()) + interval '14 days',
    coalesce(_match_metadata, '{}'::jsonb)
  )
  returning id into _circle_id;

  insert into public.community_circle_members (circle_id, user_id, joined_at, left_at)
  select _circle_id, member_id, null, null
  from unnest(_member_ids) as member_id;

  foreach _user_a in array _member_ids
  loop
    foreach _user_b in array _member_ids
    loop
      if _user_a < _user_b then
        insert into public.community_match_history (user_a, user_b)
        values (_user_a, _user_b)
        on conflict (user_a, user_b) do nothing;
      end if;
    end loop;
  end loop;

  update public.community_match_waitlist
  set status = 'matched'
  where user_id = any(_member_ids);

  insert into public.community_notifications (user_id, type, title, body, data)
  select
    member_id,
    'circle_matched',
    _notification_title,
    _notification_body,
    jsonb_build_object('circle_id', _circle_id)
  from unnest(_member_ids) as member_id;

  insert into public.community_messages (
    circle_id,
    sender_user_id,
    content,
    message_type,
    metadata,
    dedupe_key
  )
  values (
    _circle_id,
    null,
    _welcome_message,
    'system_notice',
    jsonb_build_object('kind', 'circle_created'),
    'system:circle-created'
  );

  return _circle_id;
end;
$$;

revoke execute on function public.create_circle_match(text, text, text, text, text[], uuid[], jsonb, text, text, text) from public, anon, authenticated;
grant execute on function public.create_circle_match(text, text, text, text, text[], uuid[], jsonb, text, text, text) to service_role;

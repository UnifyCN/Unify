-- In-lesson community discussions (per-module boards, PRD §6).
-- One thread per top-level question; replies are one level deep.

-- =============================================================================
-- Tables
-- =============================================================================

create table if not exists public.module_discussions (
  id uuid primary key default gen_random_uuid(),
  module_id text not null references public.learn_modules(sanity_id) on delete cascade,
  submodule_id text,
  lesson_id text,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  like_count integer not null default 0 check (like_count >= 0),
  reply_count integer not null default 0 check (reply_count >= 0),
  status text not null default 'visible'
    check (status in ('visible', 'reported', 'hidden')),
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.module_discussions is
  'Per-module community Q&A threads for in-lesson help. Tagged with submodule/lesson context for filtering.';

create table if not exists public.discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.module_discussions(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  like_count integer not null default 0 check (like_count >= 0),
  status text not null default 'visible'
    check (status in ('visible', 'reported', 'hidden')),
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.discussion_replies is
  'One-level replies to module_discussions questions.';

create table if not exists public.discussion_likes (
  user_id uuid not null references public.users(id) on delete cascade,
  discussion_id uuid not null references public.module_discussions(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, discussion_id)
);

create table if not exists public.discussion_reply_likes (
  user_id uuid not null references public.users(id) on delete cascade,
  reply_id uuid not null references public.discussion_replies(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, reply_id)
);

create table if not exists public.discussion_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete set null,
  discussion_id uuid references public.module_discussions(id) on delete cascade,
  reply_id uuid references public.discussion_replies(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 5 and 500),
  created_at timestamptz not null default timezone('utc', now()),
  constraint discussion_reports_target_check check (
    (discussion_id is not null and reply_id is null)
    or (discussion_id is null and reply_id is not null)
  )
);

comment on table public.discussion_reports is
  'User reports for module discussions and replies. Written via report-discussion edge function.';

-- =============================================================================
-- Indexes
-- =============================================================================

create index if not exists idx_module_discussions_module_created
  on public.module_discussions (module_id, created_at desc)
  where status = 'visible';

create index if not exists idx_module_discussions_module_submodule
  on public.module_discussions (module_id, submodule_id, created_at desc)
  where status = 'visible';

create index if not exists idx_module_discussions_module_likes
  on public.module_discussions (module_id, like_count desc, created_at desc)
  where status = 'visible';

create index if not exists idx_module_discussions_author
  on public.module_discussions (author_id);

create index if not exists idx_discussion_replies_discussion_created
  on public.discussion_replies (discussion_id, created_at asc)
  where status = 'visible';

create index if not exists idx_discussion_replies_author
  on public.discussion_replies (author_id);

create unique index if not exists discussion_reports_unique_discussion
  on public.discussion_reports (reporter_id, discussion_id)
  where discussion_id is not null;

create unique index if not exists discussion_reports_unique_reply
  on public.discussion_reports (reporter_id, reply_id)
  where reply_id is not null;

-- =============================================================================
-- Counter + content-safety triggers
-- =============================================================================

create or replace function public.update_discussion_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.module_discussions
    set like_count = like_count + 1
    where id = new.discussion_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.module_discussions
    set like_count = greatest(like_count - 1, 0)
    where id = old.discussion_id;
    return old;
  end if;
  return null;
end;
$$;

create or replace function public.update_discussion_reply_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.discussion_replies
    set like_count = like_count + 1
    where id = new.reply_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.discussion_replies
    set like_count = greatest(like_count - 1, 0)
    where id = old.reply_id;
    return old;
  end if;
  return null;
end;
$$;

create or replace function public.update_discussion_reply_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.module_discussions
    set reply_count = reply_count + 1
    where id = new.discussion_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.module_discussions
    set reply_count = greatest(reply_count - 1, 0)
    where id = old.discussion_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists on_discussion_like_change on public.discussion_likes;
create trigger on_discussion_like_change
  after insert or delete on public.discussion_likes
  for each row execute function public.update_discussion_like_count();

drop trigger if exists on_discussion_reply_like_change on public.discussion_reply_likes;
create trigger on_discussion_reply_like_change
  after insert or delete on public.discussion_reply_likes
  for each row execute function public.update_discussion_reply_like_count();

drop trigger if exists on_discussion_reply_count_change on public.discussion_replies;
create trigger on_discussion_reply_count_change
  after insert or delete on public.discussion_replies
  for each row execute function public.update_discussion_reply_count();

-- Shared banned-word filter (same list as posts).
create or replace function public.check_discussion_body_content()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized text;
  banned text[] := array[
    'nigger','nigga','chink','gook','spic','wetback','kike','beaner','coon',
    'darkie','raghead','towelhead','redskin','injun','jap','cracker','honky',
    'gringo','paki','faggot','fag','dyke','tranny','cunt','whore','slut',
    'kill yourself','kys','go die','heil hitler','white power',
    'white supremacy','death to'
  ];
  word text;
begin
  normalized := lower(new.body);
  normalized := regexp_replace(normalized, '[\u200B\u200C\u200D\u2060\uFEFF\u00AD]', '', 'g');
  normalized := translate(normalized, '013457@$', 'oieatsa');

  foreach word in array banned loop
    if normalized ~* ('\m' || word || '\M') then
      raise exception 'Content violates community guidelines'
        using errcode = 'check_violation';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_check_module_discussion_body on public.module_discussions;
create trigger trg_check_module_discussion_body
  before insert or update of body on public.module_discussions
  for each row execute function public.check_discussion_body_content();

drop trigger if exists trg_check_discussion_reply_body on public.discussion_replies;
create trigger trg_check_discussion_reply_body
  before insert or update of body on public.discussion_replies
  for each row execute function public.check_discussion_body_content();

-- =============================================================================
-- Batch metadata RPCs (mirror get_post_metadata_batch)
-- =============================================================================

create or replace function public.get_discussion_metadata_batch(discussion_ids uuid[])
returns table (
  discussion_id uuid,
  like_count integer,
  reply_count integer,
  is_liked boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with requested as (
    select distinct unnest(discussion_ids) as discussion_id
  ),
  discussion_rows as (
    select
      requested.discussion_id,
      coalesce(module_discussions.like_count, 0) as like_count,
      coalesce(module_discussions.reply_count, 0) as reply_count
    from requested
    left join public.module_discussions
      on module_discussions.id = requested.discussion_id
      and module_discussions.status = 'visible'
  ),
  liked as (
    select discussion_likes.discussion_id
    from public.discussion_likes
    join requested on requested.discussion_id = discussion_likes.discussion_id
    where discussion_likes.user_id = auth.uid()
  )
  select
    discussion_rows.discussion_id,
    discussion_rows.like_count,
    discussion_rows.reply_count,
    liked.discussion_id is not null as is_liked
  from discussion_rows
  left join liked using (discussion_id)
  order by discussion_rows.discussion_id;
$$;

create or replace function public.get_discussion_reply_metadata_batch(reply_ids uuid[])
returns table (
  reply_id uuid,
  like_count integer,
  is_liked boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with requested as (
    select distinct unnest(reply_ids) as reply_id
  ),
  reply_rows as (
    select
      requested.reply_id,
      coalesce(discussion_replies.like_count, 0) as like_count
    from requested
    left join public.discussion_replies
      on discussion_replies.id = requested.reply_id
      and discussion_replies.status = 'visible'
  ),
  liked as (
    select discussion_reply_likes.reply_id
    from public.discussion_reply_likes
    join requested on requested.reply_id = discussion_reply_likes.reply_id
    where discussion_reply_likes.user_id = auth.uid()
  )
  select
    reply_rows.reply_id,
    reply_rows.like_count,
    liked.reply_id is not null as is_liked
  from reply_rows
  left join liked using (reply_id)
  order by reply_rows.reply_id;
$$;

grant execute on function public.get_discussion_metadata_batch(uuid[]) to authenticated;
grant execute on function public.get_discussion_reply_metadata_batch(uuid[]) to authenticated;

-- Module-level stats for chooser badge ("128 discussions in this module").
create or replace function public.get_module_discussion_stats(p_module_id text)
returns table (
  discussion_count integer,
  participant_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  with visible_discussions as (
    select id, author_id
    from public.module_discussions
    where module_id = p_module_id
      and status = 'visible'
  ),
  reply_authors as (
    select distinct discussion_replies.author_id
    from public.discussion_replies
    join visible_discussions on visible_discussions.id = discussion_replies.discussion_id
    where discussion_replies.status = 'visible'
  ),
  all_participants as (
    select author_id as user_id from visible_discussions
    union
    select author_id as user_id from reply_authors
  )
  select
    (select count(*)::integer from visible_discussions) as discussion_count,
    (select count(distinct user_id)::integer from all_participants) as participant_count;
$$;

grant execute on function public.get_module_discussion_stats(text) to authenticated;

-- =============================================================================
-- Row level security
-- =============================================================================

alter table public.module_discussions enable row level security;
alter table public.discussion_replies enable row level security;
alter table public.discussion_likes enable row level security;
alter table public.discussion_reply_likes enable row level security;
alter table public.discussion_reports enable row level security;

-- module_discussions
create policy module_discussions_select_visible
  on public.module_discussions
  for select
  to authenticated
  using (
    status = 'visible'
    or author_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.permissions in ('admin', 'partner')
    )
  );

create policy module_discussions_insert_self
  on public.module_discussions
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and status = 'visible'
  );

create policy module_discussions_delete_self_or_admin
  on public.module_discussions
  for delete
  to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.permissions = 'admin'
    )
  );

-- discussion_replies
create policy discussion_replies_select_visible
  on public.discussion_replies
  for select
  to authenticated
  using (
    status = 'visible'
    or author_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.permissions in ('admin', 'partner')
    )
  );

create policy discussion_replies_insert_self
  on public.discussion_replies
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and status = 'visible'
    and exists (
      select 1
      from public.module_discussions d
      where d.id = discussion_id
        and d.status = 'visible'
    )
  );

create policy discussion_replies_delete_self_or_admin
  on public.discussion_replies
  for delete
  to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.permissions = 'admin'
    )
  );

-- discussion_likes
create policy discussion_likes_select_own
  on public.discussion_likes
  for select
  to authenticated
  using (user_id = auth.uid());

create policy discussion_likes_insert_own
  on public.discussion_likes
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.module_discussions d
      where d.id = discussion_id
        and d.status = 'visible'
    )
  );

create policy discussion_likes_delete_own
  on public.discussion_likes
  for delete
  to authenticated
  using (user_id = auth.uid());

-- discussion_reply_likes
create policy discussion_reply_likes_select_own
  on public.discussion_reply_likes
  for select
  to authenticated
  using (user_id = auth.uid());

create policy discussion_reply_likes_insert_own
  on public.discussion_reply_likes
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.discussion_replies r
      where r.id = reply_id
        and r.status = 'visible'
    )
  );

create policy discussion_reply_likes_delete_own
  on public.discussion_reply_likes
  for delete
  to authenticated
  using (user_id = auth.uid());

-- discussion_reports (insert via edge function with service role; read own reports)
create policy discussion_reports_select_own
  on public.discussion_reports
  for select
  to authenticated
  using (reporter_id = auth.uid());

-- Realtime-friendly row payloads for live board updates.
alter table public.module_discussions replica identity full;
alter table public.discussion_replies replica identity full;

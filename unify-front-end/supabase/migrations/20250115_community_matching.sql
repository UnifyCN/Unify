-- ============================================================================
-- Community Matching Schema
-- ============================================================================

set check_function_bodies = off;

create table if not exists public.community_match_waitlist (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    persona text not null,
    time_in_canada text not null,
    pool_key text not null,
    status text not null default 'waiting' check (status in ('waiting', 'matched', 'paused')),
    created_at timestamptz not null default timezone('utc', now()),
    unique (user_id)
);

create index if not exists community_match_waitlist_pool_idx
    on public.community_match_waitlist (pool_key);

create index if not exists community_match_waitlist_status_idx
    on public.community_match_waitlist (status);

create table if not exists public.community_circles (
    id uuid primary key default gen_random_uuid(),
    pool_key text not null,
    persona text not null,
    time_in_canada text not null,
    created_at timestamptz not null default timezone('utc', now()),
    ends_at timestamptz not null default timezone('utc', now()) + interval '14 days',
    status text not null default 'active' check (status in ('active', 'ended'))
);

create index if not exists community_circles_pool_idx
    on public.community_circles (pool_key);

create index if not exists community_circles_status_idx
    on public.community_circles (status);

create table if not exists public.community_circle_members (
    id uuid primary key default gen_random_uuid(),
    circle_id uuid not null references public.community_circles(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    joined_at timestamptz,
    left_at timestamptz,
    unique (circle_id, user_id)
);

create index if not exists community_circle_members_circle_idx
    on public.community_circle_members (circle_id);

create index if not exists community_circle_members_user_idx
    on public.community_circle_members (user_id);

create index if not exists community_circle_members_active_idx
    on public.community_circle_members (circle_id, left_at)
    where left_at is null;

create table if not exists public.community_match_history (
    id uuid primary key default gen_random_uuid(),
    user_a uuid not null references public.users(id) on delete cascade,
    user_b uuid not null references public.users(id) on delete cascade,
    matched_at timestamptz not null default timezone('utc', now()),
    constraint community_match_history_pair_check check (user_a < user_b),
    unique (user_a, user_b)
);

create index if not exists community_match_history_user_a_idx
    on public.community_match_history (user_a);

create index if not exists community_match_history_user_b_idx
    on public.community_match_history (user_b);

create table if not exists public.community_messages (
    id uuid primary key default gen_random_uuid(),
    circle_id uuid not null references public.community_circles(id) on delete cascade,
    sender_user_id uuid references public.users(id) on delete set null,
    content text not null,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_messages_circle_idx
    on public.community_messages (circle_id, created_at);

create table if not exists public.community_notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    type text not null,
    title text not null,
    body text not null,
    data jsonb,
    read_at timestamptz,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_notifications_user_idx
    on public.community_notifications (user_id, created_at desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.community_match_waitlist enable row level security;
alter table public.community_circles enable row level security;
alter table public.community_circle_members enable row level security;
alter table public.community_match_history enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_notifications enable row level security;
-- Waitlist policies
create policy community_waitlist_select_self
    on public.community_match_waitlist
    for select
    using (auth.uid() = user_id);

create policy community_waitlist_manage_self
    on public.community_match_waitlist
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Circles readable by members
create policy community_circles_select_members
    on public.community_circles
    for select
    using (
        exists (
            select 1
            from public.community_circle_members m
            where m.circle_id = community_circles.id
              and m.user_id = auth.uid()
        )
    );

-- Circle members policies
create policy community_circle_members_select_members
    on public.community_circle_members
    for select
    using (
        exists (
            select 1
            from public.community_circle_members m2
            where m2.circle_id = community_circle_members.circle_id
              and m2.user_id = auth.uid()
        )
    );

create policy community_circle_members_update_self
    on public.community_circle_members
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Match history hidden from clients except participants (for read purposes only)
create policy community_match_history_select_self
    on public.community_match_history
    for select
    using (auth.uid() = user_a or auth.uid() = user_b);

-- Community messages policies
create policy community_messages_select_members
    on public.community_messages
    for select
    using (
        exists (
            select 1
            from public.community_circle_members m
            where m.circle_id = community_messages.circle_id
              and m.user_id = auth.uid()
              and m.left_at is null
        )
    );

create policy community_messages_insert_members
    on public.community_messages
    for insert
    with check (
        auth.uid() = sender_user_id and
        exists (
            select 1
            from public.community_circle_members m
            where m.circle_id = community_messages.circle_id
              and m.user_id = auth.uid()
              and m.left_at is null
        )
    );

-- Notifications policies
create policy community_notifications_select_self
    on public.community_notifications
    for select
    using (auth.uid() = user_id);

create policy community_notifications_update_self
    on public.community_notifications
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Ensure realtime can stream full row changes for chat/member tables
alter table public.community_messages replica identity full;
alter table public.community_circle_members replica identity full;

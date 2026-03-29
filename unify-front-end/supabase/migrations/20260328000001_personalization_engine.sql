-- ============================================================================
-- Personalization engine: checklist extensions, learn modules, progress,
-- completions, recommendation events, social proof MV, pg_cron schedules.
-- Design: DOCS/designs/personalization-engine.md (schemas ~145–250).
-- Note: App uses public.user_onboarding_profiles (id = auth user), not
--       onboarding_profiles. Text column "priority" on personalized_checklist_tasks
--       is the task band; scoring tiebreaker is recommendation_priority (int).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extend user_onboarding_profiles (design doc: onboarding_profiles)
-- ---------------------------------------------------------------------------
alter table public.user_onboarding_profiles
  add column if not exists city text,
  add column if not exists province text;

-- ---------------------------------------------------------------------------
-- Extend personalized_checklist_tasks
-- ---------------------------------------------------------------------------
alter table public.personalized_checklist_tasks
  add column if not exists province text,
  add column if not exists goals text[],
  add column if not exists show_after_days int,
  add column if not exists show_before_days int,
  add column if not exists month_start int,
  add column if not exists month_end int;

-- Integer tiebreaker from design (priority / 10); distinct from text "priority"
alter table public.personalized_checklist_tasks
  add column if not exists recommendation_priority int default 0;

comment on column public.personalized_checklist_tasks.recommendation_priority is
  'Scoring tiebreaker per personalization-engine; design labels this priority.';

-- ---------------------------------------------------------------------------
-- learn_modules (Sanity sync)
-- ---------------------------------------------------------------------------
create table if not exists public.learn_modules (
  id uuid primary key default gen_random_uuid(),
  sanity_id text not null unique,
  title text not null,
  personas text[],
  interests text[],
  goals text[],
  province text,
  difficulty text,
  synced_at timestamptz default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- learn_progress (Sanity module id as text)
-- ---------------------------------------------------------------------------
create table if not exists public.learn_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id text not null,
  status text not null default 'not_started',
  completed_at timestamptz,
  unique (user_id, module_id)
);

-- ---------------------------------------------------------------------------
-- checklist_completions (FK to personalized_checklist_tasks.id — bigint)
-- ---------------------------------------------------------------------------
create table if not exists public.checklist_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checklist_item_id bigint not null references public.personalized_checklist_tasks (id) on delete cascade,
  completed_at timestamptz not null default timezone('utc', now()),
  unique (user_id, checklist_item_id)
);

-- ---------------------------------------------------------------------------
-- recommendation_events
-- ---------------------------------------------------------------------------
create table if not exists public.recommendation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surface text not null,
  item_id text not null,
  rank int not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Social proof materialized view (join profile on user id = profile.id)
-- ---------------------------------------------------------------------------
drop materialized view if exists public.social_proof_counts;

create materialized view public.social_proof_counts as
select
  p.persona,
  p.province,
  'checklist'::text as surface,
  cc.checklist_item_id::text as item_id,
  count(distinct cc.user_id) as user_count
from public.checklist_completions cc
join public.user_onboarding_profiles p on p.id = cc.user_id
group by p.persona, p.province, cc.checklist_item_id
having count(distinct cc.user_id) >= 5;

-- ---------------------------------------------------------------------------
-- Indexes (per design doc)
-- ---------------------------------------------------------------------------
create index if not exists idx_learn_progress_user
  on public.learn_progress (user_id);

create index if not exists idx_checklist_completions_user
  on public.checklist_completions (user_id);

create index if not exists idx_recommendation_events_user_date
  on public.recommendation_events (user_id, created_at);

create unique index if not exists idx_social_proof_unique
  on public.social_proof_counts (persona, province, surface, item_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.personalized_checklist_tasks enable row level security;

drop policy if exists "Authenticated users can read checklist items"
  on public.personalized_checklist_tasks;

create policy "Authenticated users can read checklist items"
  on public.personalized_checklist_tasks
  for select
  to authenticated
  using (true);

alter table public.learn_modules enable row level security;

drop policy if exists "Authenticated users can read learn modules"
  on public.learn_modules;

create policy "Authenticated users can read learn modules"
  on public.learn_modules
  for select
  to authenticated
  using (true);

alter table public.learn_progress enable row level security;

drop policy if exists "Users can manage their own learn progress"
  on public.learn_progress;

create policy "Users can manage their own learn progress"
  on public.learn_progress
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.checklist_completions enable row level security;

drop policy if exists "Users can manage their own completions"
  on public.checklist_completions;

create policy "Users can manage their own completions"
  on public.checklist_completions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.recommendation_events enable row level security;

drop policy if exists "Users can insert their own events"
  on public.recommendation_events;

create policy "Users can insert their own events"
  on public.recommendation_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Materialized views use grants (no RLS)
grant select on public.social_proof_counts to authenticated;

-- ---------------------------------------------------------------------------
-- pg_cron (after MV + unique index exist for CONCURRENTLY refresh)
-- ---------------------------------------------------------------------------
do $$
declare
  _job_id bigint;
begin
  for _job_id in
    select jobid from cron.job where jobname = 'refresh-social-proof'
  loop
    perform cron.unschedule(_job_id);
  end loop;

  perform cron.schedule(
    'refresh-social-proof',
    '0 * * * *',
    'refresh materialized view concurrently public.social_proof_counts'
  );
end;
$$;

do $$
declare
  _job_id bigint;
begin
  for _job_id in
    select jobid from cron.job where jobname = 'purge-old-recommendations'
  loop
    perform cron.unschedule(_job_id);
  end loop;

  perform cron.schedule(
    'purge-old-recommendations',
    '0 3 * * *',
    'delete from public.recommendation_events where created_at < (now() - interval ''90 days'')'
  );
end;
$$;

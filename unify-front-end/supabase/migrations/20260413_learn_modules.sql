-- learn_modules: Sanity CMS module metadata synced via webhook/CLI
-- Used by the personalize edge function to score modules without calling Sanity directly.
create table if not exists learn_modules (
  sanity_id   text primary key,
  title       text not null,
  personas    text[] not null default '{}',
  interests   text[] not null default '{}',
  goals       text[] not null default '{}',
  province    text,
  difficulty  text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  synced_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

comment on table learn_modules is
  'Mirror of Sanity module metadata used for personalized ranking. Updated by Sanity webhook or weekly CLI sync.';

-- Authenticated users can read; only service role may write.
alter table learn_modules enable row level security;

create policy "learn_modules: authenticated read"
  on learn_modules for select
  to authenticated
  using (true);

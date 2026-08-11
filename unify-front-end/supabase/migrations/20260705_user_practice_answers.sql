-- Persists per-user answers for Practice sections (typed inputs AND multiple-choice
-- selections) so they survive navigating between pages and exiting/re-entering.
-- Learn *lessons* already have user_activity_inputs + user_quiz_responses; Practice
-- had only user_practice_progress (page number), with no home for the answers.
-- One row per (user, practice, item). item_key = Sanity block _key. answer holds a
-- string (typed input) or string/string[] (selection), stored as jsonb.
create table if not exists public.user_practice_answers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  sanity_practice_id  text not null,
  sanity_submodule_id text not null,
  sanity_module_id    text not null,
  item_key            text not null,
  answer              jsonb,
  is_submitted        boolean not null default false,
  created_at          timestamptz not null default timezone('utc', now()),
  updated_at          timestamptz not null default timezone('utc', now()),
  unique (user_id, sanity_practice_id, item_key)
);

create index if not exists user_practice_answers_user_practice_idx
  on public.user_practice_answers (user_id, sanity_practice_id);

alter table public.user_practice_answers enable row level security;

-- Owner-only access (mirrors user_practice_progress / user_activity_inputs policies).
-- drop-then-create keeps the file replayable (already applied out-of-band in prod).
drop policy if exists "Users manage own practice answers" on public.user_practice_answers;
create policy "Users manage own practice answers"
  on public.user_practice_answers for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reuse the shared updated_at trigger fn created by the practice_progress migration.
drop trigger if exists user_practice_answers_updated_at on public.user_practice_answers;
create trigger user_practice_answers_updated_at
  before update on public.user_practice_answers
  for each row execute function public.set_updated_at();

-- learn_progress: per-user module-level progress (not_started → in_progress → completed)
-- Distinct from the granular user_module_progress / user_lesson_progress tables.
-- Written by the app when a user opens or completes a module.
create table if not exists learn_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  module_id    text not null references learn_modules(sanity_id) on delete cascade,
  status       text not null default 'not_started'
                 check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint learn_progress_user_module_unique unique (user_id, module_id)
);

comment on table learn_progress is
  'Module-level progress states (not_started / in_progress / completed) written by the client app.';

-- Trigger to keep updated_at current
create or replace function update_learn_progress_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger learn_progress_updated_at
  before update on learn_progress
  for each row execute function update_learn_progress_updated_at();

-- RLS
alter table learn_progress enable row level security;

create policy "learn_progress: users read own rows"
  on learn_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "learn_progress: users insert own rows"
  on learn_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "learn_progress: users update own rows"
  on learn_progress for update
  to authenticated
  using (auth.uid() = user_id);

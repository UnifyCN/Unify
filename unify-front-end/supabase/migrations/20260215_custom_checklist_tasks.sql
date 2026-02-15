create table if not exists public.custom_checklist_tasks (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  priority text not null check (priority in ('Do now', 'Do soon', 'Explore and connect', 'Optional / later')),
  title text not null,
  description text not null default '',
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists custom_checklist_tasks_user_id_idx
  on public.custom_checklist_tasks (user_id);

create index if not exists custom_checklist_tasks_user_id_priority_idx
  on public.custom_checklist_tasks (user_id, priority);

alter table public.custom_checklist_tasks enable row level security;

create policy "Users can read own custom checklist tasks"
  on public.custom_checklist_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own custom checklist tasks"
  on public.custom_checklist_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own custom checklist tasks"
  on public.custom_checklist_tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own custom checklist tasks"
  on public.custom_checklist_tasks for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at_custom_checklist_tasks()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Drop if exists so migration is idempotent; trigger is recreated immediately below.
drop trigger if exists custom_checklist_tasks_updated_at
  on public.custom_checklist_tasks;

create trigger custom_checklist_tasks_updated_at
  before update on public.custom_checklist_tasks
  for each row execute function public.set_updated_at_custom_checklist_tasks();

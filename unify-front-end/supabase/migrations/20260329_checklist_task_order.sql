-- Per-user custom ordering of checklist rows within each priority bucket (sanity + custom tasks).

create table if not exists public.checklist_task_order (
  user_id uuid not null references auth.users(id) on delete cascade,
  priority text not null check (
    priority in (
      'Do now',
      'Do soon',
      'Explore and connect',
      'Optional / later'
    )
  ),
  ordered_keys text[] not null default '{}',
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, priority)
);

create index if not exists checklist_task_order_user_id_idx
  on public.checklist_task_order (user_id);

alter table public.checklist_task_order enable row level security;

create policy "Users can read own checklist task order"
  on public.checklist_task_order for select
  using (auth.uid() = user_id);

create policy "Users can insert own checklist task order"
  on public.checklist_task_order for insert
  with check (auth.uid() = user_id);

create policy "Users can update own checklist task order"
  on public.checklist_task_order for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own checklist task order"
  on public.checklist_task_order for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at_checklist_task_order()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists checklist_task_order_updated_at
  on public.checklist_task_order;

create trigger checklist_task_order_updated_at
  before update on public.checklist_task_order
  for each row execute function public.set_updated_at_checklist_task_order();

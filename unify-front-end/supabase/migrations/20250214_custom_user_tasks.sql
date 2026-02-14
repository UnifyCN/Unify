-- Custom user-generated tasks for personalized checklist
-- Allows users to add their own tasks with predefined priority categories

create table if not exists public.custom_user_tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    task_name text not null,
    task_description text,
    priority text not null check (priority in (
        'Do now',
        'Do soon', 
        'Explore and connect',
        'Optional / later'
    )),
    completed boolean not null default false,
    completed_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- Index for fetching user's custom tasks
create index if not exists custom_user_tasks_user_id_idx
    on public.custom_user_tasks (user_id);

-- Index for grouping by priority
create index if not exists custom_user_tasks_priority_idx
    on public.custom_user_tasks (priority);

-- RLS: users can only read/write their own rows
alter table public.custom_user_tasks enable row level security;

create policy "Users can read own custom tasks"
    on public.custom_user_tasks for select
    using (auth.uid() = user_id);

create policy "Users can insert own custom tasks"
    on public.custom_user_tasks for insert
    with check (auth.uid() = user_id);

create policy "Users can update own custom tasks"
    on public.custom_user_tasks for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own custom tasks"
    on public.custom_user_tasks for delete
    using (auth.uid() = user_id);

-- Trigger to set updated_at on update
create or replace function public.set_updated_at_custom_task()
returns trigger as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$ language plpgsql;

create trigger custom_user_tasks_updated_at
    before update on public.custom_user_tasks
    for each row execute function public.set_updated_at_custom_task();

comment on table public.custom_user_tasks is 'User-generated custom tasks for personalized checklist';
comment on column public.custom_user_tasks.priority is 'Pre-defined priority bucket (Do now, Do soon, Explore and connect, Optional / later)';

-- ============================================================================
-- Task progress: one row per (user, task)
-- Tasks are single-page content (like one lesson page); track completed / in progress.
-- ============================================================================

create table if not exists public.user_task_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    sanity_task_id text not null,
    sanity_submodule_id text not null,
    sanity_module_id text not null,
    is_completed boolean not null default false,
    is_in_progress boolean not null default true,
    last_accessed_at timestamptz not null default timezone('utc', now()),
    completed_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, sanity_task_id)
);

create index if not exists user_task_progress_user_id_idx
    on public.user_task_progress (user_id);

create index if not exists user_task_progress_submodule_idx
    on public.user_task_progress (sanity_submodule_id);

-- RLS: users can only read/write their own rows
alter table public.user_task_progress enable row level security;

create policy "Users can read own task progress"
    on public.user_task_progress for select
    using (auth.uid() = user_id);

create policy "Users can insert own task progress"
    on public.user_task_progress for insert
    with check (auth.uid() = user_id);

create policy "Users can update own task progress"
    on public.user_task_progress for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own task progress"
    on public.user_task_progress for delete
    using (auth.uid() = user_id);

-- Trigger to set updated_at on update
create or replace function public.set_updated_at_task()
returns trigger as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$ language plpgsql;

create trigger user_task_progress_updated_at
    before update on public.user_task_progress
    for each row execute function public.set_updated_at_task();

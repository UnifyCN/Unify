-- ============================================================================
-- Practice progress: one row per (user, practice)
-- Keeps existing Learn tables (user_lesson_progress, user_submodule_progress, etc.)
-- ============================================================================

create table if not exists public.user_practice_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    sanity_practice_id text not null,
    sanity_submodule_id text not null,
    sanity_module_id text not null,
    practice_type text not null check (practice_type in ('quiz', 'activity')),
    current_page_number int not null default 1 check (current_page_number >= 1),
    is_completed boolean not null default false,
    is_in_progress boolean not null default true,
    last_accessed_at timestamptz not null default timezone('utc', now()),
    completed_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, sanity_practice_id),
    -- Completion state: when completed, must have completed_at and not in progress
    check (not is_completed or (completed_at is not null and not is_in_progress)),
    -- In-progress state: when in progress, must not be completed and no completed_at
    check (not is_in_progress or (not is_completed and completed_at is null)),
    -- completed_at must be on or after created_at when set
    check (completed_at is null or completed_at >= created_at)
);

create index if not exists user_practice_progress_user_id_idx
    on public.user_practice_progress (user_id);

create index if not exists user_practice_progress_submodule_idx
    on public.user_practice_progress (sanity_submodule_id);

-- RLS: users can only read/write their own rows
alter table public.user_practice_progress enable row level security;

create policy "Users can read own practice progress"
    on public.user_practice_progress for select
    using (auth.uid() = user_id);

create policy "Users can insert own practice progress"
    on public.user_practice_progress for insert
    with check (auth.uid() = user_id);

create policy "Users can update own practice progress"
    on public.user_practice_progress for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own practice progress"
    on public.user_practice_progress for delete
    using (auth.uid() = user_id);

-- Trigger to set updated_at on update
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$ language plpgsql;

create trigger user_practice_progress_updated_at
    before update on public.user_practice_progress
    for each row execute function public.set_updated_at();

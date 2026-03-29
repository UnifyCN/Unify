-- Saved lesson pages (content pages only): mirrors post_saves pattern for user bookmarks.

create table if not exists public.lesson_page_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  page_number int not null check (page_number >= 1),
  module_id text not null,
  submodule_id text not null,
  lesson_title_snapshot text,
  page_title_snapshot text,
  created_at timestamptz not null default now(),
  constraint lesson_page_saves_user_lesson_page_unique unique (user_id, lesson_id, page_number)
);

create index if not exists lesson_page_saves_user_created_idx
  on public.lesson_page_saves (user_id, created_at desc);

alter table public.lesson_page_saves enable row level security;

create policy "lesson_page_saves_select_own"
  on public.lesson_page_saves
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "lesson_page_saves_insert_own"
  on public.lesson_page_saves
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "lesson_page_saves_delete_own"
  on public.lesson_page_saves
  for delete
  to authenticated
  using (auth.uid() = user_id);

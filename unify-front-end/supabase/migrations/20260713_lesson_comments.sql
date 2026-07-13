-- Lesson comments: one flat comment section per lesson/page, no reply threads.
create table if not exists public.lesson_comments (
  id bigserial primary key,
  lesson_id text not null,
  module_id text not null,
  submodule_id text not null,
  page_num integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists lesson_comments_lookup_idx
  on public.lesson_comments (lesson_id, page_num, created_at desc);

alter table public.lesson_comments enable row level security;

create policy "lesson_comments_select_own_and_public"
  on public.lesson_comments
  for select
  using (true);

create policy "lesson_comments_insert_own"
  on public.lesson_comments
  for insert
  with check (auth.uid() = user_id);

create policy "lesson_comments_delete_own"
  on public.lesson_comments
  for delete
  using (auth.uid() = user_id);
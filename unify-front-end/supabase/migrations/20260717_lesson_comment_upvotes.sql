-- Lesson comment upvotes: one vote per user per comment.
create table if not exists public.lesson_comment_upvotes (
  id bigserial primary key,
  comment_id bigint not null references public.lesson_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists lesson_comment_upvotes_lookup_idx
  on public.lesson_comment_upvotes (comment_id, created_at desc);

alter table public.lesson_comment_upvotes enable row level security;

create policy "lesson_comment_upvotes_select_public"
  on public.lesson_comment_upvotes
  for select
  using (true);

create policy "lesson_comment_upvotes_insert_own"
  on public.lesson_comment_upvotes
  for insert
  with check (auth.uid() = user_id);

create policy "lesson_comment_upvotes_delete_own"
  on public.lesson_comment_upvotes
  for delete
  using (auth.uid() = user_id);
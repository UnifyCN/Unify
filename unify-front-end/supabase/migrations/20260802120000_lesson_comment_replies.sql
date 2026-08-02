alter table public.lesson_comments
  add column if not exists parent_id bigint references public.lesson_comments(id) on delete cascade;

create index if not exists lesson_comments_parent_idx
  on public.lesson_comments (parent_id, created_at desc);

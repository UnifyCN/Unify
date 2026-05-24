-- post_saves currently has no unique constraint on (user_id, post_id), so a
-- rapid double-tap of the bookmark button (or a stale optimistic UI retry)
-- could insert duplicate rows. Add the missing unique index. The existing
-- 14 rows have no duplicates; this is safe to apply directly.
create unique index if not exists post_saves_user_post_key
    on public.post_saves (user_id, post_id);

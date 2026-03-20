create or replace function public.get_post_metadata_batch(post_ids bigint[])
returns table (
  post_id bigint,
  like_count integer,
  comment_count integer,
  is_liked boolean,
  is_saved boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with requested_posts as (
    select distinct unnest(post_ids) as post_id
  ),
  post_rows as (
    select
      requested_posts.post_id,
      coalesce(posts.like_count, 0) as like_count
    from requested_posts
    left join public.posts on posts.id = requested_posts.post_id
  ),
  comment_counts as (
    select
      post_comments.post_id,
      count(*)::integer as comment_count
    from public.post_comments
    join requested_posts on requested_posts.post_id = post_comments.post_id
    group by post_comments.post_id
  ),
  liked_posts as (
    select post_likes.post_id
    from public.post_likes
    join requested_posts on requested_posts.post_id = post_likes.post_id
    where post_likes.user_id = auth.uid()
  ),
  saved_posts as (
    select post_saves.post_id
    from public.post_saves
    join requested_posts on requested_posts.post_id = post_saves.post_id
    where post_saves.user_id = auth.uid()
  )
  select
    post_rows.post_id,
    post_rows.like_count,
    coalesce(comment_counts.comment_count, 0) as comment_count,
    liked_posts.post_id is not null as is_liked,
    saved_posts.post_id is not null as is_saved
  from post_rows
  left join comment_counts using (post_id)
  left join liked_posts using (post_id)
  left join saved_posts using (post_id)
  order by post_rows.post_id;
$$;

grant execute on function public.get_post_metadata_batch(bigint[]) to authenticated;

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
  comment_counts as (
    select
      post_comments.post_id,
      count(*)::integer as comment_count
    from public.post_comments
    join requested_posts on requested_posts.post_id = post_comments.post_id
    group by post_comments.post_id
  ),
  post_rows as (
    select
      requested_posts.post_id,
      coalesce(posts.like_count, 0) as like_count,
      coalesce(comment_counts.comment_count, 0) as comment_count
    from requested_posts
    left join public.posts on posts.id = requested_posts.post_id
    left join comment_counts on comment_counts.post_id = requested_posts.post_id
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
    post_rows.comment_count,
    liked_posts.post_id is not null as is_liked,
    saved_posts.post_id is not null as is_saved
  from post_rows
  left join liked_posts using (post_id)
  left join saved_posts using (post_id)
  order by post_rows.post_id;
$$;

grant execute on function public.get_post_metadata_batch(bigint[]) to authenticated;

create or replace function public.match_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5
)
returns table (
  id bigint,
  document_id bigint,
  chunk_index int,
  chunk_text text,
  similarity float,
  knowledge_documents jsonb
)
language plpgsql
as $$
begin
  return query
  select
    kc.id,
    kc.document_id,
    kc.chunk_index,
    kc.chunk_text,
    1 - (kc.embedding <=> query_embedding) as similarity,
    jsonb_build_object(
      'id', kd.id,
      'title', kd.title,
      'storage_path', kd.storage_path,
      'subject', kd.subject,
      'section', kd.section
    ) as knowledge_documents
  from public.knowledge_chunks kc
  join public.knowledge_documents kd on kc.document_id = kd.id
  where kc.embedding is not null
    and (
      match_threshold <= 0
      or 1 - (kc.embedding <=> query_embedding) > match_threshold
    )
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;

revoke execute on function public.match_chunks(vector, double precision, integer) from public;
revoke execute on function public.match_chunks(vector, double precision, integer) from anon;
revoke execute on function public.match_chunks(vector, double precision, integer) from authenticated;
grant execute on function public.match_chunks(vector, double precision, integer) to service_role;

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  -- Tune ivfflat lists against the live row count. A good rule of thumb is
  -- lists ~= sqrt(rows), once the table has representative production data.
  with (lists = 100);

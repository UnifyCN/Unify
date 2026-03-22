-- ============================================================================
-- RAG Ingestion Pipeline: schema changes, crawl infrastructure, recency boost
-- ============================================================================

-- 1. Add updated_at, content_hash, source_url to knowledge_documents
alter table public.knowledge_documents
  add column if not exists updated_at timestamptz,
  add column if not exists content_hash text,
  add column if not exists source_url text;

-- Backfill updated_at from created_at for existing rows
update public.knowledge_documents
  set updated_at = created_at
  where updated_at is null;

-- 2. Add updated_at to knowledge_chunks
alter table public.knowledge_chunks
  add column if not exists updated_at timestamptz;

update public.knowledge_chunks
  set updated_at = created_at
  where updated_at is null;

alter table public.knowledge_documents
  alter column updated_at set default now();

alter table public.knowledge_chunks
  alter column updated_at set default now();

-- 3. Create crawl_sources table (URL allowlist)
create table if not exists public.crawl_sources (
  id bigserial primary key,
  url text not null unique,
  label text,                        -- human-readable name, e.g. "PGWP overview"
  subject text,                      -- topic tag for matching, e.g. "immigration"
  enabled boolean not null default true,
  crawl_frequency_hours int not null default 24,
  last_crawled_at timestamptz,
  created_at timestamptz default now()
);

-- Only service_role should manage crawl sources
revoke all on public.crawl_sources from public, anon, authenticated;
grant all on public.crawl_sources to service_role;

-- 4. Create crawl_logs table (observability)
create table if not exists public.crawl_logs (
  id bigserial primary key,
  crawl_source_id bigint references public.crawl_sources(id) on delete set null,
  url text not null,
  status text not null check (status in ('success', 'skipped', 'error')),
  content_changed boolean default false,
  chunks_created int default 0,
  error_message text,
  duration_ms int,
  crawled_at timestamptz default now()
);

revoke all on public.crawl_logs from public, anon, authenticated;
grant all on public.crawl_logs to service_role;

-- Index for querying recent crawl status per source
create index if not exists crawl_logs_source_crawled_idx
  on public.crawl_logs (crawl_source_id, crawled_at desc);

-- 4b. Unique partial index on source_url to prevent duplicate documents for the same URL
create unique index if not exists knowledge_documents_source_url_uniq
  on public.knowledge_documents (source_url)
  where source_url is not null;

-- 5. Update match_chunks() with recency boost + source_url
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
  with candidate_chunks as (
    select
      kc.id,
      kc.document_id,
      kc.chunk_index,
      kc.chunk_text,
      kc.embedding <=> query_embedding as embedding_distance,
      greatest(
        0,
        1.0 - extract(epoch from (now() - coalesce(kc.updated_at, kc.created_at))) / (180.0 * 86400)
      ) as recency_factor,
      jsonb_build_object(
        'id', kd.id,
        'title', kd.title,
        'storage_path', kd.storage_path,
        'subject', kd.subject,
        'section', kd.section,
        'source_url', kd.source_url,
        'updated_at', kd.updated_at
      ) as knowledge_documents
    from public.knowledge_chunks kc
    join public.knowledge_documents kd on kc.document_id = kd.id
    where kc.embedding is not null
    order by kc.embedding <=> query_embedding
    limit greatest(match_count * 8, 50)
  )
  select
    id,
    document_id,
    chunk_index,
    chunk_text,
    ((1 - embedding_distance) * 0.85 + recency_factor * 0.15)::float as similarity,
    knowledge_documents
  from candidate_chunks
  where match_threshold <= 0
    or 1 - embedding_distance > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- Maintain existing permissions
revoke execute on function public.match_chunks(vector, double precision, integer) from public;
revoke execute on function public.match_chunks(vector, double precision, integer) from anon;
revoke execute on function public.match_chunks(vector, double precision, integer) from authenticated;
grant execute on function public.match_chunks(vector, double precision, integer) to service_role;

-- 6. pg_cron, pg_net, and vault are already enabled on this Supabase instance.
--    pg_cron (pg_catalog), pg_net (public), supabase_vault (vault).

-- 7. Driver function: pg_cron calls this to trigger crawls
--    Reads enabled sources from crawl_sources, invokes ingest-documents
--    edge function for each URL via pg_net.
--    The service role key must be stored in vault as 'service_role_key'.
create or replace function public.trigger_crawl_all()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _source record;
  _supabase_url text;
  _service_key text;
  _batch_size int := greatest(
    coalesce(
      nullif(current_setting('app.settings.rag_crawl_batch_size', true), '')::int,
      12
    ),
    1
  );
begin
  -- Read config from environment / vault
  _supabase_url := current_setting('app.settings.supabase_url', true);
  if _supabase_url is null then
    _supabase_url := (
      select decrypted_secret from vault.decrypted_secrets
      where name = 'supabase_url' limit 1
    );
  end if;

  _service_key := (
    select decrypted_secret from vault.decrypted_secrets
    where name = 'service_role_key' limit 1
  );

  if _supabase_url is null or _service_key is null then
    raise warning 'trigger_crawl_all: missing supabase_url or service_role_key in vault';
    return;
  end if;

  -- Process a bounded batch each run so crawl throughput can keep pace with the
  -- default 24-hour source cadence as the source count grows.
  for _source in
    select id, url
    from public.crawl_sources
    where enabled = true
      and (
        last_crawled_at is null
        or last_crawled_at < now() - (crawl_frequency_hours || ' hours')::interval
    )
    order by last_crawled_at nulls first, id
    limit _batch_size
  loop
    perform net.http_post(
      url := _supabase_url || '/functions/v1/ingest-documents',
      body := json_build_object(
        'url', _source.url,
        'crawl_source_id', _source.id
      )::jsonb,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_key
      )::jsonb,
      timeout_milliseconds := 120000
    );
  end loop;
end;
$$;

revoke execute on function public.trigger_crawl_all() from public, anon, authenticated;
grant execute on function public.trigger_crawl_all() to service_role;

-- 8. Schedule crawl every 5 minutes and process a bounded batch per run.
do $$
declare
  _job_id bigint;
begin
  for _job_id in
    select jobid from cron.job where jobname = 'rag-crawl-batch'
  loop
    perform cron.unschedule(_job_id);
  end loop;

  perform cron.schedule(
    'rag-crawl-batch',
    '*/5 * * * *',
    'select public.trigger_crawl_all()'
  );
end;
$$;

-- 9. Seed trusted Government of Canada / IRCC URLs
INSERT INTO public.crawl_sources (url, label, subject, enabled, crawl_frequency_hours) VALUES

-- General / Hub Pages
('https://www.canada.ca/en/services/immigration-citizenship.html',
 'Immigration and Citizenship Hub', 'general', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship.html',
 'IRCC Department Home', 'general', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html',
 'Check IRCC Processing Times', 'general', true, 168),

-- Permanent Residence / Immigration Programs
('https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada.html',
 'Live in Canada Permanently – All Programs', 'pr', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html',
 'Express Entry – Overview', 'pr', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply.html',
 'Express Entry – Who Can Apply', 'pr', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html',
 'Express Entry – Rounds of Invitations', 'pr', true, 168),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html',
 'Provincial Nominee Program (PNP)', 'pr', true, 504),

-- Family Sponsorship
('https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/family-sponsorship.html',
 'Family Sponsorship – Overview', 'immigration', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/family-sponsorship/spouse-partner-children.html',
 'Sponsor Spouse, Partner or Child', 'immigration', true, 504),

-- Work Permits
('https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada.html',
 'Work in Canada – Overview', 'work_permit', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/work-permit.html',
 'Work Permit – Types and Eligibility', 'work_permit', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/work-permit/apply.html',
 'Work Permit – How to Apply', 'work_permit', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation.html',
 'Post-Graduation Work Permit (PGWP)', 'work_permit', true, 504),

-- Study Permits
('https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html',
 'Study Permit – Overview', 'study_permit', true, 504),

-- Citizenship
('https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship.html',
 'Canadian Citizenship – Overview', 'citizenship', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/adult-minor.html',
 'Apply for Citizenship – Adults and Children', 'citizenship', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/test.html',
 'Citizenship Test', 'citizenship', true, 504),

-- Refugees and Asylum
('https://www.canada.ca/en/immigration-refugees-citizenship/services/refugees.html',
 'Refugees and Asylum – Overview', 'refugee', true, 504),

-- Settlement Services
('https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada.html',
 'Settling in Canada – Overview', 'settlement', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/health-care.html',
 'Health Care for Newcomers', 'settlement', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/human-rights/rights-freedoms.html',
 'Your Rights and Freedoms in Canada', 'settlement', true, 504),
('https://www.canada.ca/en/immigration-refugees-citizenship/campaigns/newcomers.html',
 'Newcomer Services Portal', 'settlement', true, 504),
('https://ircc.canada.ca/english/newcomers/services/',
 'Find Free Newcomer Services Near You', 'settlement', true, 504),

-- Temporary Foreign Workers
('https://www.canada.ca/en/employment-social-development/services/foreign-workers/protected-rights.html',
 'Temporary Foreign Workers – Your Rights', 'work_permit', true, 504)

ON CONFLICT (url) DO NOTHING;

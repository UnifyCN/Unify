-- Create a function to find similar chunks using vector similarity
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  document_id bigint,
  chunk_index int,
  chunk_text text,
  similarity float,
  knowledge_documents jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
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
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kc.document_id = kd.id
  WHERE kc.embedding IS NOT NULL
    AND (match_threshold < 0 OR 1 - (kc.embedding <=> query_embedding) > match_threshold)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


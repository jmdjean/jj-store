CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

ALTER TABLE IF EXISTS rag_documents
  ALTER COLUMN entity_type TYPE TEXT USING entity_type::text;

ALTER TABLE IF EXISTS rag_documents
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_rag_documents_entity
  ON rag_documents (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_rag_documents_metadata
  ON rag_documents USING gin (metadata_json);

CREATE INDEX IF NOT EXISTS idx_rag_documents_embedding
  ON rag_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 64);

CREATE OR REPLACE FUNCTION rag_search(
  query_embedding vector,
  top_k integer DEFAULT 10,
  entity_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  entity_type text,
  entity_id uuid,
  content_markdown text,
  metadata_json jsonb,
  score double precision
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    rag_documents.id,
    rag_documents.entity_type,
    rag_documents.entity_id,
    rag_documents.content_markdown,
    rag_documents.metadata_json,
    1 - (rag_documents.embedding <=> query_embedding) AS score
  FROM rag_documents
  WHERE
    entity_types IS NULL
    OR array_length(entity_types, 1) = 0
    OR rag_documents.entity_type = ANY(entity_types)
  ORDER BY rag_documents.embedding <=> query_embedding
  LIMIT top_k;
$$;

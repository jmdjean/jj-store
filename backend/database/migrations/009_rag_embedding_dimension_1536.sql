-- Aligns rag_documents.embedding with 1536-dimensional embeddings (e.g. OpenAI).
-- Drops the ivfflat index, truncates existing rows (wrong dimension), alters column, recreates index.
-- After deploy, run RAG backfill to repopulate the vector index.

DROP INDEX IF EXISTS idx_rag_documents_embedding;

TRUNCATE TABLE rag_documents;

ALTER TABLE rag_documents
  ALTER COLUMN embedding TYPE vector(1536);

CREATE INDEX IF NOT EXISTS idx_rag_documents_embedding
  ON rag_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 64);

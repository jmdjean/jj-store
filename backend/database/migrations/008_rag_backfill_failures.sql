CREATE TABLE IF NOT EXISTS rag_backfill_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(40) NOT NULL,
  entity_id UUID NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL,
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rag_backfill_failures_entity_unique UNIQUE (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_rag_backfill_failures_entity
  ON rag_backfill_failures (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_rag_backfill_failures_permanent
  ON rag_backfill_failures (is_permanent, updated_at DESC);

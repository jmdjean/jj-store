CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(80) NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user_id
  ON audit_log (actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON audit_log (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON audit_log (created_at DESC);

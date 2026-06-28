-- Atlas append-only, hash-chained audit log.
-- previous_event_hash + event_hash form a tamper-evident chain over the whole
-- log. Audit append is a platform-service operation: runtime/application roles
-- may INSERT only; they must never be granted UPDATE or DELETE on this table.

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  sequence BIGINT NOT NULL,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'deny', 'not_applicable')),
  before_hash TEXT,
  after_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_event_hash TEXT,
  event_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (sequence)
);

CREATE INDEX IF NOT EXISTS idx_audit_events_workspace_id
  ON audit_events(workspace_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_event_type
  ON audit_events(event_type);

CREATE INDEX IF NOT EXISTS idx_audit_events_resource
  ON audit_events(resource_type, resource_id);

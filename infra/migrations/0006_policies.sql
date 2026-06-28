-- Atlas local policy records.
-- Policies are stored and validated before they are enforced by PermissionCheck.

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
  rules_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id)
);

CREATE INDEX IF NOT EXISTS idx_policies_workspace_id
  ON policies(workspace_id);

CREATE INDEX IF NOT EXISTS idx_policies_status
  ON policies(status);

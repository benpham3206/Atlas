-- Atlas permission check records.
-- These are decision records before policy enforcement is wired into ActionRun.

CREATE TABLE IF NOT EXISTS permission_checks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  principal_type TEXT NOT NULL CHECK (principal_type IN ('user', 'agent', 'service_account', 'system')),
  principal_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'deny')),
  policy_id TEXT,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id),
  CONSTRAINT permission_checks_policy_fk
    FOREIGN KEY (workspace_id, policy_id)
    REFERENCES policies(workspace_id, id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_permission_checks_workspace_id
  ON permission_checks(workspace_id);

CREATE INDEX IF NOT EXISTS idx_permission_checks_principal
  ON permission_checks(principal_type, principal_id);

CREATE INDEX IF NOT EXISTS idx_permission_checks_resource
  ON permission_checks(resource_type, resource_id);

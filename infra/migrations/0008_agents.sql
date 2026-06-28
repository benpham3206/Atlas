-- Atlas agent identities and scoped delegations.
-- A delegation is the local equivalent of a short-lived signed JWT: it binds an
-- agent to a workspace with a role, scopes, an allowed-tool list, and an expiry.
-- In the target architecture the Identity/Policy plane mints these; agents can
-- never self-issue or self-extend them.

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_delegations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_tools JSONB NOT NULL DEFAULT '["*"]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id)
);

CREATE INDEX IF NOT EXISTS idx_agent_delegations_workspace_id
  ON agent_delegations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_delegations_agent_id
  ON agent_delegations(agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_delegations_expires_at
  ON agent_delegations(expires_at);

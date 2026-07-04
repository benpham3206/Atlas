-- GoalContracts constrain agent/tool work before execution.
-- PullRequestArtifact and ReviewPacket records capture the review-ready PR loop:
-- agents may open reviewable PRs and produce evidence packets, but merge remains
-- outside the tool surface.

CREATE TABLE IF NOT EXISTS goal_contracts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  acceptance_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_boundaries JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_class TEXT NOT NULL CHECK (risk_class IN ('low', 'medium', 'high', 'unacceptable')),
  budget_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  done_definition TEXT NOT NULL,
  next_action_json JSONB,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS pull_request_artifacts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  goal_contract_id TEXT REFERENCES goal_contracts(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  repository TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  head_branch TEXT NOT NULL,
  base_branch TEXT NOT NULL,
  external_id TEXT,
  external_url TEXT NOT NULL,
  state TEXT NOT NULL,
  merge_capability TEXT NOT NULL CHECK (merge_capability = 'absent'),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS review_packets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  goal_contract_id TEXT REFERENCES goal_contracts(id) ON DELETE SET NULL,
  pull_request_artifact_id TEXT REFERENCES pull_request_artifacts(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  changed_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_commands JSONB NOT NULL DEFAULT '[]'::jsonb,
  critic_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  safety_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  audit_event_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  pending_human_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('draft', 'review_ready', 'superseded')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id)
);

CREATE INDEX IF NOT EXISTS idx_goal_contracts_workspace_id
  ON goal_contracts(workspace_id);

CREATE INDEX IF NOT EXISTS idx_pull_request_artifacts_workspace_id
  ON pull_request_artifacts(workspace_id);

CREATE INDEX IF NOT EXISTS idx_review_packets_workspace_id
  ON review_packets(workspace_id);

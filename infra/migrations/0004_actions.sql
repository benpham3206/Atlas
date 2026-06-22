-- Atlas action types and action runs.
-- Actions define typed mutations over object instances within a workspace.

CREATE TABLE IF NOT EXISTS action_types (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_object_type_id TEXT NOT NULL,
  input_schema_json JSONB NOT NULL,
  effect_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id),
  CONSTRAINT action_types_target_object_type_fk
    FOREIGN KEY (workspace_id, target_object_type_id)
    REFERENCES object_types(workspace_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_action_types_workspace_id
  ON action_types(workspace_id);

CREATE INDEX IF NOT EXISTS idx_action_types_target_object_type_id
  ON action_types(target_object_type_id);

CREATE TABLE IF NOT EXISTS action_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action_type_id TEXT NOT NULL,
  target_object_id TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'local_user',
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  before_properties_json JSONB NOT NULL,
  after_properties_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id),
  CONSTRAINT action_runs_action_type_fk
    FOREIGN KEY (workspace_id, action_type_id)
    REFERENCES action_types(workspace_id, id)
    ON DELETE CASCADE,
  CONSTRAINT action_runs_target_object_fk
    FOREIGN KEY (workspace_id, target_object_id)
    REFERENCES object_instances(workspace_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_action_runs_workspace_id
  ON action_runs(workspace_id);

CREATE INDEX IF NOT EXISTS idx_action_runs_action_type_id
  ON action_runs(action_type_id);

CREATE INDEX IF NOT EXISTS idx_action_runs_target_object_id
  ON action_runs(target_object_id);

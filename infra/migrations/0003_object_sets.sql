-- Atlas dynamic object sets.
-- Object sets are saved filters over object instances scoped to one workspace.

CREATE TABLE IF NOT EXISTS object_sets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  object_type_id TEXT NOT NULL,
  filter_expression JSONB NOT NULL DEFAULT '{"property_equals":{}}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id),
  CONSTRAINT object_sets_object_type_fk
    FOREIGN KEY (workspace_id, object_type_id)
    REFERENCES object_types(workspace_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_object_sets_workspace_id
  ON object_sets(workspace_id);

CREATE INDEX IF NOT EXISTS idx_object_sets_object_type_id
  ON object_sets(object_type_id);

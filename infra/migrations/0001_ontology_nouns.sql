-- Atlas ontology nouns: Workspace, ObjectType, ObjectInstance.
-- This migration is a schema artifact for the future Postgres runtime.

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS object_types (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  schema_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id)
);

CREATE INDEX IF NOT EXISTS idx_object_types_workspace_id
  ON object_types(workspace_id);

CREATE TABLE IF NOT EXISTS object_instances (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  object_type_id TEXT NOT NULL REFERENCES object_types(id) ON DELETE RESTRICT,
  external_id TEXT,
  properties_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id),
  CONSTRAINT object_instances_workspace_object_type_fk
    FOREIGN KEY (workspace_id, object_type_id)
    REFERENCES object_types(workspace_id, id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_object_instances_workspace_id
  ON object_instances(workspace_id);

CREATE INDEX IF NOT EXISTS idx_object_instances_object_type_id
  ON object_instances(object_type_id);

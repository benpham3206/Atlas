-- Atlas ontology links: LinkType and LinkInstance.
-- Application code validates endpoint object types against LinkType definitions.

CREATE TABLE IF NOT EXISTS link_types (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  from_object_type_id TEXT NOT NULL,
  to_object_type_id TEXT NOT NULL,
  cardinality TEXT NOT NULL DEFAULT 'many_to_many',
  properties_schema JSONB NOT NULL DEFAULT '{"type":"object","properties":{}}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, id),
  CONSTRAINT link_types_from_object_type_fk
    FOREIGN KEY (workspace_id, from_object_type_id)
    REFERENCES object_types(workspace_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT link_types_to_object_type_fk
    FOREIGN KEY (workspace_id, to_object_type_id)
    REFERENCES object_types(workspace_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT link_types_cardinality_check
    CHECK (cardinality IN ('one_to_one', 'one_to_many', 'many_to_one', 'many_to_many'))
);

CREATE INDEX IF NOT EXISTS idx_link_types_workspace_id
  ON link_types(workspace_id);

CREATE TABLE IF NOT EXISTS link_instances (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  link_type_id TEXT NOT NULL,
  from_object_id TEXT NOT NULL,
  to_object_id TEXT NOT NULL,
  properties_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT link_instances_no_self_link
    CHECK (from_object_id <> to_object_id),
  CONSTRAINT link_instances_link_type_fk
    FOREIGN KEY (workspace_id, link_type_id)
    REFERENCES link_types(workspace_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT link_instances_from_object_fk
    FOREIGN KEY (workspace_id, from_object_id)
    REFERENCES object_instances(workspace_id, id)
    ON DELETE CASCADE,
  CONSTRAINT link_instances_to_object_fk
    FOREIGN KEY (workspace_id, to_object_id)
    REFERENCES object_instances(workspace_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_link_instances_workspace_id
  ON link_instances(workspace_id);

CREATE INDEX IF NOT EXISTS idx_link_instances_link_type_id
  ON link_instances(link_type_id);

CREATE INDEX IF NOT EXISTS idx_link_instances_from_object_id
  ON link_instances(from_object_id);

CREATE INDEX IF NOT EXISTS idx_link_instances_to_object_id
  ON link_instances(to_object_id);

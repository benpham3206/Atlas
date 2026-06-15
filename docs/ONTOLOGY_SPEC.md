# Atlas Ontology Specification

Status: Initial ontology nouns, links, object sets, and BaseRecord validation
Last updated: 2026-06-14

## Implemented Records

### Workspace

A workspace scopes ontology records.

Fields:

- `id`
- `name`
- `visibility`
- `created_at`
- `updated_at`

### ObjectType

An object type defines the schema for object instances inside one workspace.

Fields:

- `id`
- `workspace_id`
- `name`
- `description`
- `schema_json`
- `created_at`
- `updated_at`

`schema_json` currently supports a small JSON Schema subset:

- `type: "object"`
- `properties`
- `required`
- `enum`
- `items`
- `additionalProperties: false`

### ObjectInstance

An object instance is a typed record in one workspace.

Fields:

- `id`
- `workspace_id`
- `object_type_id`
- `external_id`
- `properties_json`
- `created_at`
- `updated_at`

Object instance properties must validate against the owning object type schema.

### LinkType

A link type defines a typed relation between two object types inside one workspace.

Fields:

- `id`
- `workspace_id`
- `name`
- `from_object_type_id`
- `to_object_type_id`
- `cardinality`
- `properties_schema`
- `created_at`
- `updated_at`

`from_object_type_id` and `to_object_type_id` must both exist in the same workspace as the link type.

### LinkInstance

A link instance connects two object instances through a link type.

Fields:

- `id`
- `workspace_id`
- `link_type_id`
- `from_object_id`
- `to_object_id`
- `properties_json`
- `created_at`
- `updated_at`

Link instance rules:

- `link_type_id` must exist in the same workspace.
- `from_object_id` and `to_object_id` must exist in the same workspace.
- Endpoint object types must match the link type definition.
- Self-links are rejected for now.
- Link properties must validate against the link type `properties_schema`.

### ObjectSet

An object set is a saved dynamic filter over object instances in one workspace.

Fields:

- `id`
- `workspace_id`
- `name`
- `object_type_id`
- `filter_expression`
- `created_at`
- `updated_at`

Current filter support is intentionally narrow:

```json
{
  "property_equals": {
    "status": "open"
  }
}
```

Object sets only return objects in their own workspace and object type.

## Capability Graph Records

### BaseRecord

`BaseRecord` is the shared envelope for future capability graph records such as `Domain`, `Node`, `Edge`, `Statement`, `Task`, and `Project`.

Required fields:

- `id`
- `record_type`
- `workspace_id`
- `lifecycle`
- `review_state`
- `visibility`
- `source_refs`
- `created_at`
- `updated_at`

Optional shared fields:

- `title`
- `created_by`
- `reviewed_at`
- `reviewed_by`
- `supersedes_record_id`
- `superseded_by_record_id`

Lifecycle values:

- `candidate`: captured or generated record; visible but not authoritative.
- `operational`: approved record that may drive action selection or state updates.
- `superseded`: replaced record retained for audit/history.
- `archived`: inactive record retained for history.

Review states:

- `unreviewed`
- `in_review`
- `approved`
- `rejected`

Visibility values:

- `private`
- `workspace`
- `public`

Base validation rules:

- `id`, `record_type`, and `workspace_id` must be non-empty strings.
- Timestamps must be parseable ISO timestamps.
- `updated_at` must be at or after `created_at`.
- `source_refs` must be present, must contain only non-empty strings, and cannot contain duplicates.
- `operational` records must have `review_state: "approved"`.
- `operational` records must have at least one `source_ref`.
- `approved` records must include `reviewed_by` and `reviewed_at`.

The important authority boundary is `lifecycle`: candidate records may be shown for review, but only operational records are allowed to drive future recommendations or state-changing actions.

### Record Type Registry

Phase 2 record types are defined through a declarative registry instead of bespoke validators per type.

Implemented registry entries:

- `domain`
- `node`
- `edge`
- `statement`
- `source`
- `evidence`
- `context`
- `skill`
- `task`
- `assessment`
- `project`
- `artifact`
- `decision`
- `risk`
- `carbon_copy`
- `permission`
- `agent`
- `action`
- `overlay`
- `version`

Shared validation behavior:

- Each record validates the BaseRecord envelope.
- Each registered type adds required fields beyond BaseRecord.
- Registry validation rejects unknown `record_type` values.
- `validateRecordSet` checks duplicate record ids and configured references.
- `npm run validate:records` validates the AAA-wedge fixture set.

Current authority-boundary rules:

- `task.actionable` can be true only for approved operational task records.
- `task.acceptance_criteria` must be measurable.
- `statement` records require `evidence_refs` or `evidence_exception`.
- private overlays cannot have public visibility.

## API Contracts

- `GET /workspaces`
- `POST /workspaces`
- `GET /workspaces/:workspace_id`
- `GET /workspaces/:workspace_id/object-types`
- `POST /workspaces/:workspace_id/object-types`
- `GET /workspaces/:workspace_id/object-types/:object_type_id`
- `GET /workspaces/:workspace_id/objects`
- `POST /workspaces/:workspace_id/objects`
- `GET /workspaces/:workspace_id/objects/:object_id`
- `GET /workspaces/:workspace_id/link-types`
- `POST /workspaces/:workspace_id/link-types`
- `GET /workspaces/:workspace_id/link-types/:link_type_id`
- `GET /workspaces/:workspace_id/links`
- `POST /workspaces/:workspace_id/links`
- `GET /workspaces/:workspace_id/links/:link_id`
- `GET /workspaces/:workspace_id/objects/:object_id/links`
- `GET /workspaces/:workspace_id/object-sets`
- `POST /workspaces/:workspace_id/object-sets`
- `GET /workspaces/:workspace_id/object-sets/:object_set_id`
- `GET /workspaces/:workspace_id/object-sets/:object_set_id/objects`

## Current Limitations

- Storage is in-memory.
- There is no auth.
- Workspace isolation is route-level only.
- There are no actions, policies, audit events, or agent tools yet.
- Link traversal is one-hop only.
- Object set filters support property equality only.

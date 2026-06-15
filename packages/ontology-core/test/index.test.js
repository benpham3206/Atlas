import test from "node:test";
import assert from "node:assert/strict";
import {
  BASE_RECORD_LIFECYCLES,
  BASE_RECORD_REVIEW_STATES,
  BASE_RECORD_VISIBILITIES,
  atlasPackage,
  createHealthStatus,
  validateBaseRecord,
  validateObjectProperties
} from "../src/index.js";

test("exports package metadata", () => {
  assert.equal(atlasPackage.name, "ontology-core");
  assert.equal(atlasPackage.version, "0.0.0");
});

test("creates health status without timestamp", () => {
  assert.deepEqual(createHealthStatus("atlas-api"), {
    status: "ok",
    service: "atlas-api"
  });
});

test("creates health status with timestamp", () => {
  assert.deepEqual(createHealthStatus("atlas-web", "2026-06-14T00:00:00.000Z"), {
    status: "ok",
    service: "atlas-web",
    timestamp: "2026-06-14T00:00:00.000Z"
  });
});

test("exports BaseRecord enum values", () => {
  assert.deepEqual(BASE_RECORD_LIFECYCLES, [
    "candidate",
    "operational",
    "superseded",
    "archived"
  ]);
  assert.deepEqual(BASE_RECORD_REVIEW_STATES, [
    "unreviewed",
    "in_review",
    "approved",
    "rejected"
  ]);
  assert.deepEqual(BASE_RECORD_VISIBILITIES, [
    "private",
    "workspace",
    "public"
  ]);
});

test("validates candidate BaseRecords without promotion", () => {
  const result = validateBaseRecord({
    id: "task_capture_first_bug",
    record_type: "task",
    workspace_id: "workspace_game_studio",
    title: "Capture first camera clipping bug",
    lifecycle: "candidate",
    review_state: "unreviewed",
    visibility: "workspace",
    source_refs: [],
    created_at: "2026-06-14T12:00:00.000Z",
    updated_at: "2026-06-14T12:00:00.000Z"
  });

  assert.deepEqual(result, {
    valid: true,
    errors: []
  });
});

test("validates operational BaseRecords only when approved and sourced", () => {
  assert.deepEqual(validateBaseRecord({
    id: "task_fix_camera_clip",
    record_type: "task",
    workspace_id: "workspace_game_studio",
    title: "Fix camera clipping in build v001",
    lifecycle: "operational",
    review_state: "approved",
    visibility: "workspace",
    source_refs: ["source_prd_atlas"],
    created_at: "2026-06-14T12:00:00.000Z",
    updated_at: "2026-06-14T12:05:00.000Z",
    reviewed_by: "user_ben",
    reviewed_at: "2026-06-14T12:05:00.000Z"
  }), {
    valid: true,
    errors: []
  });

  const result = validateBaseRecord({
    id: "task_unsafely_promoted",
    record_type: "task",
    workspace_id: "workspace_game_studio",
    lifecycle: "operational",
    review_state: "unreviewed",
    visibility: "workspace",
    source_refs: [],
    created_at: "2026-06-14T12:00:00.000Z",
    updated_at: "2026-06-14T12:00:00.000Z"
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    "operational records must have review_state approved",
    "operational records must have at least one source_ref"
  ]);
});

test("requires reviewer metadata for approved BaseRecords", () => {
  const result = validateBaseRecord({
    id: "decision_use_dependency_free_validation",
    record_type: "decision",
    workspace_id: "workspace_game_studio",
    lifecycle: "candidate",
    review_state: "approved",
    visibility: "workspace",
    source_refs: ["source_architecture"],
    created_at: "2026-06-14T12:00:00.000Z",
    updated_at: "2026-06-14T12:00:00.000Z"
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    "record.reviewed_by is required when review_state is approved",
    "record.reviewed_at is required when review_state is approved"
  ]);
});

test("reports invalid BaseRecord metadata", () => {
  const result = validateBaseRecord({
    id: " ",
    record_type: "",
    workspace_id: "workspace_game_studio",
    lifecycle: "published",
    review_state: "approved",
    visibility: "shared",
    source_refs: ["source_prd", "", "source_prd"],
    created_at: "not a timestamp",
    updated_at: "2026-06-14T12:00:00.000Z",
    reviewed_at: "also not a timestamp"
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    "properties.lifecycle must be one of: candidate, operational, superseded, archived",
    "properties.visibility must be one of: private, workspace, public",
    "record.id must be a non-empty string",
    "record.record_type must be a non-empty string",
    "record.created_at must be an ISO timestamp",
    "record.source_refs[1] must be a non-empty string",
    "record.source_refs[2] duplicates source_prd",
    "record.reviewed_by is required when review_state is approved",
    "record.reviewed_at must be an ISO timestamp"
  ]);
});

test("rejects BaseRecords updated before creation", () => {
  const result = validateBaseRecord({
    id: "risk_out_of_order_timestamp",
    record_type: "risk",
    workspace_id: "workspace_game_studio",
    lifecycle: "candidate",
    review_state: "unreviewed",
    visibility: "private",
    source_refs: [],
    created_at: "2026-06-14T12:10:00.000Z",
    updated_at: "2026-06-14T12:00:00.000Z"
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    "record.updated_at must be at or after created_at"
  ]);
});

test("rejects non-object BaseRecords", () => {
  assert.deepEqual(validateBaseRecord(null), {
    valid: false,
    errors: ["record must be an object"]
  });
});

test("validates object properties against schema", () => {
  const schema = {
    type: "object",
    required: ["title", "status"],
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      severity: { type: "integer" },
      status: { type: "string", enum: ["open", "resolved"] }
    }
  };

  assert.deepEqual(validateObjectProperties(schema, {
    title: "Camera clips through wall",
    severity: 2,
    status: "open"
  }), {
    valid: true,
    errors: []
  });
});

test("reports schema validation errors", () => {
  const schema = {
    type: "object",
    required: ["title", "status"],
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      status: { type: "string", enum: ["open", "resolved"] }
    }
  };

  const result = validateObjectProperties(schema, {
    title: 42,
    extra: true
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    "properties.status is required",
    "properties.extra is not allowed",
    "properties.title must be string"
  ]);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  RECORD_TYPE_SPECS,
  validateRecord,
  validateRecordSet
} from "../src/index.js";

const PHASE_2_RECORD_TYPES = [
  "domain",
  "node",
  "edge",
  "statement",
  "source",
  "evidence",
  "context",
  "skill",
  "task",
  "assessment",
  "project",
  "artifact",
  "decision",
  "risk",
  "carbon_copy",
  "permission",
  "agent",
  "action",
  "overlay",
  "version"
];

test("registry exports all Phase 2 record type specs", () => {
  assert.deepEqual(Object.keys(RECORD_TYPE_SPECS).sort(), PHASE_2_RECORD_TYPES.sort());

  for (const recordType of PHASE_2_RECORD_TYPES) {
    assert.equal(RECORD_TYPE_SPECS[recordType].record_type, recordType);
    assert.ok(RECORD_TYPE_SPECS[recordType].schema.required.length > 0);
  }
});

test("record validator rejects unknown record types", () => {
  const result = validateRecord({
    id: "unknown_thing",
    record_type: "unknown",
    workspace_id: "workspace_game_studio",
    lifecycle: "candidate",
    review_state: "unreviewed",
    visibility: "workspace",
    source_refs: [],
    created_at: "2026-06-14T12:00:00.000Z",
    updated_at: "2026-06-14T12:00:00.000Z"
  });

  assert.deepEqual(result, {
    valid: false,
    errors: ["record.record_type unknown is not registered"]
  });
});

test("validates a complete AAA capability record set", () => {
  const records = createValidRecordSet();
  const result = validateRecordSet(records);

  assert.deepEqual(result, {
    valid: true,
    errors: []
  });
});

test("rejects invalid capability graph records with grounded errors", () => {
  const records = createValidRecordSet();
  records.push({
    ...records.find((record) => record.id === "task_build_movement_prototype"),
    id: "task_vague_without_acceptance",
    acceptance_criteria: ["make it good"]
  });
  records.push({
    ...records.find((record) => record.id === "statement_authority_boundary"),
    id: "statement_unsupported_claim",
    evidence_refs: [],
    evidence_exception: ""
  });
  records.push({
    ...records.find((record) => record.id === "overlay_private_notes"),
    id: "overlay_public_private_leak",
    visibility: "public",
    overlay_visibility: "private"
  });

  const result = validateRecordSet(records);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("task_vague_without_acceptance: task.acceptance_criteria[0] must be measurable"));
  assert.ok(result.errors.includes("statement_unsupported_claim: statement records require evidence_refs or evidence_exception"));
  assert.ok(result.errors.includes("overlay_public_private_leak: private overlays cannot have public visibility"));
});

test("candidate records are visible but not actionable", () => {
  const candidate = {
    ...createValidRecordSet().find((record) => record.id === "task_build_movement_prototype"),
    id: "task_candidate_next_action",
    lifecycle: "candidate",
    review_state: "unreviewed",
    actionable: true
  };
  delete candidate.reviewed_by;
  delete candidate.reviewed_at;

  const result = validateRecord({
    ...candidate
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    "task records can be actionable only when lifecycle is operational and review_state is approved"
  ]);
});

function createValidRecordSet() {
  const timestamp = "2026-06-14T12:00:00.000Z";
  const base = (id, recordType, extra = {}) => ({
    id,
    record_type: recordType,
    workspace_id: "workspace_game_studio",
    lifecycle: "operational",
    review_state: "approved",
    visibility: "workspace",
    source_refs: ["source_atlas_prd"],
    created_at: timestamp,
    updated_at: timestamp,
    reviewed_by: "user_ben",
    reviewed_at: timestamp,
    ...extra
  });

  return [
    base("domain_game_development", "domain", {
      name: "AAA game development",
      description: "Operational domain for building a finite vertical slice.",
      focus_area: "third person action prototype"
    }),
    base("node_movement_prototype", "node", {
      node_kind: "capability",
      label: "Movement prototype"
    }),
    base("edge_domain_to_node", "edge", {
      from_record_id: "domain_game_development",
      to_record_id: "node_movement_prototype",
      relation_type: "contains"
    }),
    base("source_atlas_prd", "source", {
      source_type: "document",
      citation: "ChatGPT Lean Access.md"
    }),
    base("statement_authority_boundary", "statement", {
      statement_text: "Candidate records cannot drive next action.",
      evidence_refs: ["evidence_lifecycle_rule"]
    }),
    base("evidence_lifecycle_rule", "evidence", {
      statement_id: "statement_authority_boundary",
      source_id: "source_atlas_prd",
      evidence_kind: "requirement"
    }),
    base("context_vertical_slice", "context", {
      scope: "AAA sci-fi action game vertical slice",
      assumptions: ["single local workspace", "no external integrations"]
    }),
    base("skill_movement_controller", "skill", {
      name: "Movement controller implementation",
      prerequisites: ["node_movement_prototype"],
      assessment_criteria: ["prototype supports walk, run, and jump"]
    }),
    base("task_build_movement_prototype", "task", {
      objective: "Build a greybox movement prototype",
      status: "todo",
      acceptance_criteria: ["player moves at 6 m/s", "jump apex reaches 1.5 m"],
      blocked_by: [],
      actionable: true
    }),
    base("assessment_movement_feel", "assessment", {
      rubric: ["input latency under 100 ms", "jump apex reaches 1.5 m"],
      pass_condition: "all criteria pass"
    }),
    base("project_atlas_aaa_wedge", "project", {
      goal: "Produce a playable AAA vertical slice prototype",
      constraints: ["local-first", "no auth yet"],
      milestone_ids: ["task_build_movement_prototype"]
    }),
    base("artifact_movement_demo", "artifact", {
      artifact_type: "file",
      uri: "artifacts/movement-demo.md",
      status: "draft"
    }),
    base("decision_registry_specs", "decision", {
      decision: "Use declarative record specs",
      rationale: "Collapse Phase 2 schema work without losing test coverage.",
      tradeoffs: ["less bespoke behavior", "faster broad validation"]
    }),
    base("risk_schema_sprawl", "risk", {
      severity: "medium",
      mitigation: "Keep one registry and table-driven tests.",
      owner: "atlas"
    }),
    base("carbon_copy_user_ben", "carbon_copy", {
      subject_ref: "user_ben",
      consent_state: "granted",
      default_visibility: "private"
    }),
    base("permission_editor_tasks", "permission", {
      subject: "role:editor",
      action: "task:update",
      resource: "task",
      scope: "workspace"
    }),
    base("agent_local_builder", "agent", {
      allowed_tools: ["query_object", "run_action"],
      scope: "workspace_game_studio"
    }),
    base("action_mark_task_done", "action", {
      target_record_type: "task",
      input_schema: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["done"] }
        }
      }
    }),
    base("overlay_private_notes", "overlay", {
      base_record_id: "task_build_movement_prototype",
      overlay_workspace_id: "workspace_game_studio",
      overlay_visibility: "private",
      visibility: "private"
    }),
    base("version_task_v2", "version", {
      previous_record_id: "task_build_movement_prototype",
      current_record_id: "task_build_movement_prototype_v2",
      change_summary: "Split movement prototype acceptance criteria."
    })
  ];
}

import test from "node:test";
import assert from "node:assert/strict";
import { validateRecord } from "../../packages/atlas-ontology/src/index.js";

/**
 * Mirrors server/src/atlas/knowledge-service.ts patchRecord lifecycle gate.
 * Ontology validateRecord does not encode promotion rules; the server enforces
 * them when lifecycle is patched to operational.
 */
function operationalPromotionGate(merged) {
  if (merged.lifecycle !== "operational") {
    return { blocked: false, reasons: [] };
  }

  const reasons = [];

  if (merged.review_state !== "approved") {
    reasons.push("operational lifecycle requires review_state approved");
  }

  if (!Array.isArray(merged.source_refs) || merged.source_refs.length === 0) {
    reasons.push("operational lifecycle requires at least one source_ref");
  }

  return { blocked: reasons.length > 0, reasons };
}

const TIMESTAMP = "2026-06-30T12:00:00.000Z";

function minimalStatement(overrides = {}) {
  return {
    id: "statement_lifecycle_gate_001",
    record_type: "statement",
    workspace_id: "workspace_test",
    lifecycle: "candidate",
    review_state: "unreviewed",
    visibility: "workspace",
    source_refs: [],
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    statement_text: "Lifecycle gate test statement.",
    evidence_refs: ["evidence_lifecycle_gate_001"],
    ...overrides
  };
}

test("candidate cannot publish: validateRecord passes but operational promotion requires approved + source_refs", () => {
  const candidate = minimalStatement({
    lifecycle: "candidate",
    review_state: "unreviewed",
    source_refs: []
  });

  const validation = validateRecord(candidate);
  assert.equal(validation.valid, true, validation.errors.join("; "));

  const asOperational = { ...candidate, lifecycle: "operational" };
  const gate = operationalPromotionGate(asOperational);

  assert.equal(gate.blocked, true);
  assert.ok(gate.reasons.includes("operational lifecycle requires review_state approved"));
  assert.ok(gate.reasons.includes("operational lifecycle requires at least one source_ref"));
});

test("operational blocked without review: gate rejects operational + unreviewed", () => {
  const record = minimalStatement({
    lifecycle: "operational",
    review_state: "unreviewed",
    source_refs: ["source_lifecycle_gate_001"]
  });

  const gate = operationalPromotionGate(record);

  assert.equal(gate.blocked, true);
  assert.deepEqual(gate.reasons, ["operational lifecycle requires review_state approved"]);
});

test("operational blocked without source_refs: gate rejects operational + approved + empty source_refs", () => {
  const record = minimalStatement({
    lifecycle: "operational",
    review_state: "approved",
    source_refs: []
  });

  const gate = operationalPromotionGate(record);

  assert.equal(gate.blocked, true);
  assert.deepEqual(gate.reasons, ["operational lifecycle requires at least one source_ref"]);
});

test("happy path: operational + approved + non-empty source_refs passes validateRecord", () => {
  const operational = minimalStatement({
    lifecycle: "operational",
    review_state: "approved",
    source_refs: ["source_lifecycle_gate_001"],
    reviewed_by: "user_reviewer",
    reviewed_at: TIMESTAMP
  });

  const gate = operationalPromotionGate(operational);
  assert.equal(gate.blocked, false, gate.reasons.join("; "));

  const validation = validateRecord(operational);
  assert.equal(validation.valid, true, validation.errors.join("; "));
});

/** Mirrors knowledge-service patchRecord candidate merge (properties bag + flatten). */
function buildPatchCandidate(existing, patchProperties, nowIso = TIMESTAMP) {
  const existingProps = existing.properties ?? {};
  const properties = { ...existingProps, ...patchProperties };
  const candidate = {
    id: existing.id,
    workspace_id: existing.workspace_id,
    record_type: existing.record_type,
    lifecycle: existing.lifecycle,
    review_state: existing.review_state,
    visibility: existing.visibility,
    title: existing.title,
    source_refs: existing.source_refs,
    created_at: existing.created_at,
    updated_at: nowIso,
    properties,
    ...properties,
  };
  delete candidate.created_at;
  delete candidate.updated_at;
  candidate.created_at = existing.created_at;
  candidate.updated_at = nowIso;
  return candidate;
}

test("patchRecord merge: properties-only patch keeps timestamps and statement_text valid", () => {
  const existing = {
    id: "atlas_record_0d3e4efb1d04",
    workspace_id: "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9",
    record_type: "statement",
    lifecycle: "candidate",
    review_state: "unreviewed",
    visibility: "workspace",
    title: "Audit verify gate",
    source_refs: [],
    created_at: "2026-07-02T22:19:57.566Z",
    updated_at: "2026-07-02T22:19:57.566Z",
    properties: {
      statement_text: "Public Atlas treats hash-chained audit verify as a hard gate.",
      evidence_exception: "ATL-7 seed: evidence record follows in same transaction.",
    },
  };
  const candidate = buildPatchCandidate(
    existing,
    {
      statement_text: existing.properties.statement_text,
      evidence_refs: ["atlas_record_325284160888"],
    },
    "2026-07-02T22:40:00.000Z",
  );
  delete candidate.evidence_exception;

  const validation = validateRecord(candidate);
  assert.equal(validation.valid, true, validation.errors.join("; "));
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  auditEventHash,
  canonicalJson,
  sha256Hex,
  verifyAuditEventChain
} from "../src/index.js";

function buildEvent(partial, previousHash) {
  const event = {
    id: partial.id,
    sequence: partial.sequence,
    payload: partial.payload ?? {},
    previous_event_hash: previousHash
  };
  event.event_hash = auditEventHash(event);
  return event;
}

test("canonicalJson is stable regardless of key order", () => {
  assert.equal(
    canonicalJson({ b: 1, a: { d: 4, c: 3 } }),
    canonicalJson({ a: { c: 3, d: 4 }, b: 1 })
  );
});

test("sha256Hex is deterministic", () => {
  assert.equal(sha256Hex("atlas"), sha256Hex("atlas"));
  assert.notEqual(sha256Hex("atlas"), sha256Hex("Atlas"));
});

test("auditEventHash ignores the event_hash field itself", () => {
  const base = { id: "audit_event_001", sequence: 1, previous_event_hash: null, payload: { x: 1 } };
  const withHash = { ...base, event_hash: "ignored" };
  assert.equal(auditEventHash(base), auditEventHash(withHash));
});

test("verifyAuditEventChain accepts a well-formed chain", () => {
  const first = buildEvent({ id: "audit_event_001", sequence: 1, payload: { a: 1 } }, null);
  const second = buildEvent({ id: "audit_event_002", sequence: 2, payload: { a: 2 } }, first.event_hash);
  const third = buildEvent({ id: "audit_event_003", sequence: 3, payload: { a: 3 } }, second.event_hash);

  const result = verifyAuditEventChain([first, second, third]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("verifyAuditEventChain detects content tampering", () => {
  const first = buildEvent({ id: "audit_event_001", sequence: 1, payload: { a: 1 } }, null);
  const second = buildEvent({ id: "audit_event_002", sequence: 2, payload: { a: 2 } }, first.event_hash);

  const tampered = [first, { ...second, sequence: 999 }];
  const result = verifyAuditEventChain(tampered);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("tampered")));
});

test("verifyAuditEventChain detects a broken link", () => {
  const first = buildEvent({ id: "audit_event_001", sequence: 1, payload: { a: 1 } }, null);
  const second = buildEvent({ id: "audit_event_002", sequence: 2, payload: { a: 2 } }, first.event_hash);
  const orphan = buildEvent({ id: "audit_event_003", sequence: 3, payload: { a: 3 } }, "not-the-previous-hash");

  const result = verifyAuditEventChain([first, second, orphan]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("breaks the chain")));
});

test("verifyAuditEventChain accepts append-shaped knowledge audit events", () => {
  const companyId = "company_test_001";
  const afterHash = auditEventHash({ id: "atlas_record_001", record_type: "source" });
  const body = {
    id: "audit_event_knowledge_001",
    company_id: companyId,
    sequence: 1,
    actor: "local-board",
    event_type: "knowledge.record.created",
    resource_type: "atlas_knowledge_record",
    resource_id: "atlas_record_001",
    decision: "not_applicable",
    before_hash: null,
    after_hash: afterHash,
    metadata: { record_type: "source" },
    previous_event_hash: null,
    created_at: "2026-07-02T21:57:25.413Z",
  };
  const stored = { ...body, event_hash: auditEventHash(body) };
  const verifyPayload = {
    id: stored.id,
    company_id: companyId,
    sequence: stored.sequence,
    actor: stored.actor,
    event_type: stored.event_type,
    resource_type: stored.resource_type ?? null,
    resource_id: stored.resource_id ?? null,
    decision: stored.decision,
    before_hash: stored.before_hash ?? null,
    after_hash: stored.after_hash ?? null,
    metadata: stored.metadata ?? {},
    previous_event_hash: stored.previous_event_hash ?? null,
    event_hash: stored.event_hash,
    created_at: stored.created_at,
  };
  const result = verifyAuditEventChain([verifyPayload]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

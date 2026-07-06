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
    actor: "test",
    event_type: "test.event",
    decision: "not_applicable",
    before_hash: null,
    after_hash: null,
    metadata: partial.metadata ?? { step: partial.sequence },
    previous_event_hash: previousHash,
    created_at: "2026-01-01T00:00:00.000Z",
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
  const base = buildEvent({ id: "audit_event_001", sequence: 1 }, null);
  const withHash = { ...base, event_hash: "ignored" };
  assert.equal(auditEventHash(base), auditEventHash(withHash));
});

test("verifyAuditEventChain accepts a well-formed chain", () => {
  const first = buildEvent({ id: "audit_event_001", sequence: 1 }, null);
  const second = buildEvent({ id: "audit_event_002", sequence: 2 }, first.event_hash);
  const third = buildEvent({ id: "audit_event_003", sequence: 3 }, second.event_hash);

  const result = verifyAuditEventChain([first, second, third]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("verifyAuditEventChain detects content tampering", () => {
  const first = buildEvent({ id: "audit_event_001", sequence: 1 }, null);
  const second = buildEvent({ id: "audit_event_002", sequence: 2 }, first.event_hash);

  const tampered = [first, { ...second, metadata: { step: 999 } }];
  const result = verifyAuditEventChain(tampered);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("tampered")));
});

test("verifyAuditEventChain detects a broken link", () => {
  const first = buildEvent({ id: "audit_event_001", sequence: 1 }, null);
  const second = buildEvent({ id: "audit_event_002", sequence: 2 }, first.event_hash);
  const orphan = buildEvent({ id: "audit_event_003", sequence: 3 }, "not-the-previous-hash");

  const result = verifyAuditEventChain([first, second, orphan]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("breaks the chain")));
});

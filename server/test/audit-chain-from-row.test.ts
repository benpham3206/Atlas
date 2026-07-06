import assert from "node:assert/strict";
import test from "node:test";
import { auditEventHash, verifyAuditEventChain } from "@atlas/atlas-ontology";
import {
  auditChainEventFromRow,
  auditEventHashBodyFromRow,
} from "../src/atlas/knowledge-service.ts";

test("auditChainEventFromRow matches append hash preimage", () => {
  const createdAtIso = "2026-07-02T21:58:53.035Z";
  const recordId = "atlas_record_abc123";
  const afterHash = auditEventHash({ id: recordId, record_type: "source" });
  const companyId = "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9";
  const metadataForHash = { record_type: "source" };
  const eventHash = auditEventHash({
    id: "2435599d-cd73-4178-b49e-8495340972e6",
    company_id: companyId,
    sequence: 1,
    actor: "local-board",
    event_type: "knowledge.record.created",
    resource_type: "atlas_knowledge_record",
    resource_id: recordId,
    decision: "not_applicable",
    before_hash: null,
    after_hash: afterHash,
    metadata: metadataForHash,
    previous_event_hash: null,
    created_at: createdAtIso,
  });

  const row = {
    id: "2435599d-cd73-4178-b49e-8495340972e6",
    companyId,
    sequence: 1,
    actor: "local-board",
    eventType: "knowledge.record.created",
    resourceType: "atlas_knowledge_record",
    resourceId: recordId,
    decision: "not_applicable",
    beforeHash: null,
    afterHash: afterHash,
    metadata: { ...metadataForHash, _atlas_audit_created_at: createdAtIso },
    previousEventHash: null,
    eventHash,
    activityLogId: null,
    runId: null,
    createdAt: new Date(createdAtIso),
  };

  const chainEvent = auditChainEventFromRow(row);
  assert.equal(auditEventHash(auditEventHashBodyFromRow(row, null)), eventHash);
  const result = verifyAuditEventChain([chainEvent]);
  assert.equal(result.valid, true, result.errors.join("; "));
});
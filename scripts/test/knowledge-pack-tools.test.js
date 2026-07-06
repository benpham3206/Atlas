import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  attachEvidence,
  loadEncyclopediaFixture,
  searchRecords,
  verifyAuditChain,
} from "./lib/knowledge-pack-harness.js";

const ROOT = join(import.meta.dirname, "..", "..");
const COMPANY_ID = "company_fixture_encyclopedia";

test("search_records finds candidate statements in seeded encyclopedia pack", () => {
  const records = loadEncyclopediaFixture();

  const authorityHits = searchRecords(records, COMPANY_ID, "authority", "statement");
  assert.ok(authorityHits.length >= 1);
  assert.ok(authorityHits.some((record) => record.id === "statement_moo_zero_trust"));
  assert.equal(authorityHits[0].lifecycle, "candidate");
  assert.ok(Array.isArray(authorityHits[0].source_refs) && authorityHits[0].source_refs.length > 0);

  const auditHits = searchRecords(records, COMPANY_ID, "hash-chained", "statement");
  assert.ok(auditHits.some((record) => record.id === "statement_audit_immutable"));
});

test("search_records is scoped to company workspace", () => {
  const records = loadEncyclopediaFixture();
  records.push({
    id: "statement_other_company",
    record_type: "statement",
    workspace_id: "company_other",
    lifecycle: "candidate",
    review_state: "unreviewed",
    visibility: "workspace",
    source_refs: [],
    created_at: "2026-06-30T12:00:00.000Z",
    updated_at: "2026-06-30T12:00:00.000Z",
    statement_text: "authority leak probe",
  });

  const hits = searchRecords(records, COMPANY_ID, "authority", "statement");
  assert.ok(hits.every((record) => record.workspace_id === COMPANY_ID));
  assert.ok(!hits.some((record) => record.id === "statement_other_company"));
});

test("attach_evidence creates evidence record and hash-chained audit events", () => {
  const records = loadEncyclopediaFixture();
  const auditEvents = [];
  const targetId = "statement_moo_zero_trust";

  const { evidence, link } = attachEvidence(
    records,
    auditEvents,
    COMPANY_ID,
    {
      target_object_id: targetId,
      title: "Citation attachment for MoO authority boundary",
      uri: "source_moo_prd",
      summary: "Requirement excerpt from MoO PRD",
    },
    "agent_fixture_citation",
  );

  assert.equal(evidence.record_type, "evidence");
  assert.equal(evidence.lifecycle, "candidate");
  assert.equal(link.link_type, "evidence_for");
  assert.equal(link.to_record_id, targetId);

  const createdEvents = auditEvents.filter((event) => event.event_type === "knowledge.record.created");
  const linkEvents = auditEvents.filter((event) => event.event_type === "knowledge.link.created");
  assert.equal(createdEvents.length, 1);
  assert.equal(linkEvents.length, 1);

  const verify = verifyAuditChain(auditEvents, COMPANY_ID);
  assert.equal(verify.audit_valid, true, verify.errors.join("; "));
});

test("Paperclip tool surface exposes search_records and attach_evidence", () => {
  const tools = readFileSync(join(ROOT, "server/src/atlas/tools.ts"), "utf8");
  const routes = readFileSync(join(ROOT, "server/src/routes/atlas.ts"), "utf8");

  assert.match(tools, /name: "search_records"/);
  assert.match(tools, /name: "attach_evidence"/);
  assert.match(routes, /case "search_records"/);
  assert.match(routes, /case "attach_evidence"/);
});

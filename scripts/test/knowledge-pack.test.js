/**
 * PA-P3g end-to-end knowledge pack dogfood loop (in-memory harness).
 *
 * Staff roles (tests/fixtures/public-atlas-staff.json):
 * - researcher (agent_fixture_researcher): drafts candidate statements; atlas.read search
 * - citation (agent_fixture_citation): attach_evidence; evidence:write
 * - editor (agent_fixture_editor): review_state transitions; cannot promote alone
 * - verifier (agent_fixture_verifier): promotes to operational when approved + evidence
 * - curator (agent_fixture_curator): renders entity pages from graph
 * - librarian (agent_fixture_librarian): ontology/domain ownership
 * - owner/board: full authority; approves irreversible publish
 */
import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import {
  appendAuditEvent,
  attachEvidence,
  loadEncyclopediaFixture,
  loadStaffFixture,
  operationalPromotionGate,
  searchRecords,
  verifyAuditChain,
} from "./lib/knowledge-pack-harness.js";
import { renderEntityPage } from "./lib/entity-page-harness.js";

const ROOT = join(import.meta.dirname, "..", "..");
const COMPANY_ID = "company_fixture_encyclopedia";

test("staff fixture documents seven encyclopedia roles with scopes", () => {
  const staff = loadStaffFixture();
  assert.equal(staff.staff.length, 7);
  const roleKeys = staff.staff.map((member) => member.role_key).sort();
  assert.deepEqual(roleKeys, ["citation", "curator", "editor", "librarian", "owner", "researcher", "verifier"]);
});

test("knowledge pack E2E: search → attach evidence → gate blocks promotion → audit verify → entity page", () => {
  const records = loadEncyclopediaFixture();
  const auditEvents = [];

  // Researcher discovers candidate statements via search_records.
  const searchResults = searchRecords(records, COMPANY_ID, "MoO", "statement");
  assert.ok(searchResults.length >= 1);
  const candidate = searchResults.find((record) => record.id === "statement_moo_zero_trust");
  assert.ok(candidate);
  assert.equal(candidate.lifecycle, "candidate");
  assert.ok(candidate.source_refs.includes("source_moo_prd"));

  // Lifecycle gate blocks premature operational promotion.
  const premature = operationalPromotionGate({ ...candidate, lifecycle: "operational" });
  assert.equal(premature.blocked, true);

  // Citation attaches governed evidence (creates record + link + audit).
  attachEvidence(
    records,
    auditEvents,
    COMPANY_ID,
    {
      target_object_id: candidate.id,
      title: "MoO authority requirement excerpt",
      uri: "source_moo_prd",
      summary: "Scoped delegation only",
    },
    "agent_fixture_citation",
  );

  // Editor moves review forward but still cannot publish without approved + evidence path.
  const edited = {
    ...candidate,
    review_state: "in_review",
    lifecycle: "operational",
    source_refs: candidate.source_refs,
  };
  assert.equal(operationalPromotionGate(edited).blocked, true);

  // Verifier path: approved + source_refs satisfies gate (simulated promotion).
  const promoted = {
    ...candidate,
    lifecycle: "operational",
    review_state: "approved",
    source_refs: candidate.source_refs,
    reviewed_by: "agent_fixture_verifier",
  };
  assert.equal(operationalPromotionGate(promoted).blocked, false);

  appendAuditEvent(auditEvents, COMPANY_ID, "agent_fixture_verifier", "knowledge.record.updated", {
    resourceType: "atlas_knowledge_record",
    resourceId: promoted.id,
    metadata: { lifecycle: "operational", review_state: "approved" },
  });

  const verify = verifyAuditChain(auditEvents, COMPANY_ID);
  assert.equal(verify.audit_valid, true, verify.errors.join("; "));
  assert.ok(verify.event_count >= 3);

  // Curator renders human-readable entity page with source refs.
  const entity = records.find((record) => record.id === "node_entity_moo");
  assert.ok(entity);
  const page = renderEntityPage(entity, records);
  assert.ok(page.page.statements.some((statement) => statement.source_refs.includes("source_moo_prd")));
  assert.ok(page.page.sources.some((source) => source.id === "source_moo_prd"));
});

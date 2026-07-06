import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEncyclopediaFixture } from "./lib/knowledge-pack-harness.js";
import { renderEntityPage } from "./lib/entity-page-harness.js";

const ROOT = join(import.meta.dirname, "..", "..");

test("entity page route is registered on atlas router", () => {
  const routes = readFileSync(join(ROOT, "server/src/routes/atlas.ts"), "utf8");
  assert.match(routes, /\/companies\/:companyId\/atlas\/entities\/:recordId\/page/);
  assert.match(routes, /renderEntityPage/);
});

test("seeded node entity renders operational sources and related statements", () => {
  const records = loadEncyclopediaFixture();
  const entity = records.find((record) => record.id === "node_entity_moo");
  assert.ok(entity);

  const rendered = renderEntityPage(entity, records, "json");
  assert.equal(rendered.page.entity_id, "node_entity_moo");
  assert.equal(rendered.page.lifecycle, "operational");
  assert.ok(rendered.page.sources.some((source) => source.id === "source_moo_prd"));
  assert.match(rendered.page.sources[0].citation, /UNIFIED_ATLAS_MOO_MASTER_PRD/);

  const statement = rendered.page.statements.find((row) => row.id === "statement_moo_zero_trust");
  assert.ok(statement);
  assert.equal(statement.lifecycle, "candidate");
  assert.ok(statement.source_refs.includes("source_moo_prd"));
  assert.ok(statement.sources.some((source) => source.id === "source_moo_prd"));
  assert.ok(statement.evidence_refs.includes("evidence_moo_zero_trust"));
  assert.ok(statement.evidences.some((row) => row.id === "evidence_moo_zero_trust"));
});

test("entity page includes audit verify path when company id is passed", () => {
  const records = loadEncyclopediaFixture();
  const entity = records.find((record) => record.id === "node_entity_moo");
  const rendered = renderEntityPage(entity, records, "json", {
    companyId: "company_fixture_encyclopedia",
  });
  assert.equal(
    rendered.page.audit_verify_path,
    "/api/companies/company_fixture_encyclopedia/atlas/audit/verify",
  );
});

test("markdown entity page includes source citations", () => {
  const records = loadEncyclopediaFixture();
  const entity = records.find((record) => record.id === "node_entity_audit_chain");
  assert.ok(entity);

  const rendered = renderEntityPage(entity, records, "markdown");
  assert.equal(rendered.format, "markdown");
  assert.match(rendered.content, /Hash-chained audit/);
  assert.match(rendered.content, /source_audit_spec/);
  assert.match(rendered.content, /audit-activity-integration/);
  assert.match(rendered.content, /evidence_audit_immutable/);
});

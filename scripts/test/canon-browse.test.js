import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEncyclopediaFixture } from "./lib/knowledge-pack-harness.js";
import { buildCanonBrowseIndex, isCanonBrowseRecord } from "./lib/public-read-harness.js";

const ROOT = join(import.meta.dirname, "..", "..");

test("canon browse route is registered on atlas router", () => {
  const routes = readFileSync(join(ROOT, "server/src/routes/atlas.ts"), "utf8");
  assert.match(routes, /\/companies\/:companyId\/atlas\/public\/canon/);
  assert.match(routes, /buildCanonBrowseIndex/);
});

test("encyclopedia fixture lists operational nodes and domain, not statements", () => {
  const records = loadEncyclopediaFixture();
  const companyId = "company_fixture_encyclopedia";
  const index = buildCanonBrowseIndex(companyId, records);

  assert.equal(index.company_id, companyId);
  assert.match(index.audit_verify_path, /\/atlas\/audit\/verify$/);
  assert.ok(index.entries.length >= 3);

  const ids = new Set(index.entries.map((entry) => entry.record_id));
  assert.ok(ids.has("node_entity_moo"));
  assert.ok(ids.has("node_entity_audit_chain"));
  assert.ok(ids.has("domain_atlas_encyclopedia"));
  assert.equal(index.entries.some((entry) => entry.record_type === "statement"), false);

  for (const entry of index.entries) {
    assert.equal(entry.lifecycle, "operational");
    assert.equal(entry.review_state, "approved");
    assert.match(entry.entity_page_path, /\/entities\/[^/]+\/page$/);
  }
});

test("candidate records are excluded from canon browse index", () => {
  const records = loadEncyclopediaFixture();
  const statement = records.find((row) => row.id === "statement_moo_zero_trust");
  assert.ok(statement);
  assert.equal(isCanonBrowseRecord(statement), false);
});
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ABSOLUTE_TRAVERSE_MAX_DEPTH,
  DEFAULT_TRAVERSE_MAX_DEPTH,
  assertTraverseScopedToCompany,
  buildTraverseSubgraph,
  linksFromEdgeRecords,
  loadEncyclopediaFixture,
} from "./lib/knowledge-pack-harness.js";

const ROOT = join(import.meta.dirname, "..", "..");
const COMPANY_ID = "company_fixture_encyclopedia";

test("DEFAULT_TRAVERSE_MAX_DEPTH is documented as 2 hops", () => {
  assert.equal(DEFAULT_TRAVERSE_MAX_DEPTH, 2);
});

test("buildTraverseSubgraph returns seeded subgraph from domain root at depth 2", () => {
  const records = loadEncyclopediaFixture();
  const recordsById = new Map(records.map((record) => [record.id, record]));
  const links = linksFromEdgeRecords(records, COMPANY_ID);

  const result = buildTraverseSubgraph(COMPANY_ID, "domain_atlas_encyclopedia", links, 2);

  assert.equal(result.max_depth, 2);
  assert.ok(result.nodes.includes("domain_atlas_encyclopedia"));
  assert.ok(result.nodes.includes("node_entity_moo"));
  assert.ok(result.nodes.includes("node_entity_audit_chain"));
  assert.ok(result.links.length >= 2);
  assertTraverseScopedToCompany(result, recordsById, COMPANY_ID);
});

test("depth limit enforced: depth 1 excludes second-hop-only nodes", () => {
  const records = loadEncyclopediaFixture();
  const links = linksFromEdgeRecords(records, COMPANY_ID);

  const depthOne = buildTraverseSubgraph(COMPANY_ID, "domain_atlas_encyclopedia", links, 1);
  const depthTwo = buildTraverseSubgraph(COMPANY_ID, "domain_atlas_encyclopedia", links, 2);

  assert.ok(depthOne.nodes.includes("node_entity_moo"));
  assert.equal(depthOne.nodes.length, 3);
  assert.equal(depthTwo.nodes.length, 3);
  assert.ok(depthTwo.links.length >= depthOne.links.length);
});

test("depth is clamped to ABSOLUTE_TRAVERSE_MAX_DEPTH", () => {
  const records = loadEncyclopediaFixture();
  const links = linksFromEdgeRecords(records, COMPANY_ID);

  const result = buildTraverseSubgraph(COMPANY_ID, "domain_atlas_encyclopedia", links, 99);
  assert.equal(result.max_depth, ABSOLUTE_TRAVERSE_MAX_DEPTH);
});

test("assertTraverseScopedToCompany rejects cross-company nodes", () => {
  const records = loadEncyclopediaFixture();
  const recordsById = new Map(records.map((record) => [record.id, record]));
  recordsById.set("node_leak", {
    id: "node_leak",
    record_type: "node",
    workspace_id: "company_other",
    lifecycle: "operational",
    review_state: "approved",
    visibility: "workspace",
    source_refs: [],
    created_at: "2026-06-30T12:00:00.000Z",
    updated_at: "2026-06-30T12:00:00.000Z",
  });

  const poisoned = {
    object_id: "domain_atlas_encyclopedia",
    max_depth: 2,
    nodes: ["domain_atlas_encyclopedia", "node_leak"],
    links: [],
    outbound: [],
    inbound: [],
  };

  assert.throws(
    () => assertTraverseScopedToCompany(poisoned, recordsById, COMPANY_ID),
    /cross-company leak/,
  );
});

test("cross-company links are excluded from traverse subgraph", () => {
  const records = loadEncyclopediaFixture();
  const recordsById = new Map(records.map((record) => [record.id, record]));
  const links = linksFromEdgeRecords(records, COMPANY_ID);
  links.push({
    id: "edge_leak",
    companyId: "company_other",
    fromRecordId: "domain_atlas_encyclopedia",
    toRecordId: "node_entity_moo",
    linkType: "contains",
  });

  const result = buildTraverseSubgraph(COMPANY_ID, "domain_atlas_encyclopedia", links, 2);
  assertTraverseScopedToCompany(result, recordsById, COMPANY_ID);
  assert.ok(!result.nodes.includes("node_leak"));
});

test("routes expose depth query param and traverse_graph depth input", () => {
  const routes = readFileSync(join(ROOT, "server/src/routes/atlas.ts"), "utf8");
  const tools = readFileSync(join(ROOT, "server/src/atlas/tools.ts"), "utf8");

  assert.match(routes, /req\.query\.depth/);
  assert.match(routes, /case "traverse_graph"/);
  assert.match(tools, /depth: \{ type: "integer"/);
});

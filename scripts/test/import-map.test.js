import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const MAP_PATH = join(ROOT, "docs/bricks/2026-06-30-atlas-moo-import-map.md");
const API_SRC = join(ROOT, "apps/api/src");

const AGENT_TOOLS = [
  "get_workspace_overview",
  "query_object",
  "list_objects",
  "search_records",
  "traverse_graph",
  "get_available_actions",
  "get_next_action",
  "run_action",
  "github.open_pr",
  "submit_artifact",
  "attach_evidence",
  "generate_review_packet",
  "slack.get_channel_info",
  "verify_audit_chain",
  "list_goal_contracts",
  "list_delegations"
];

test("import map doc exists and declares PA-P2M0", () => {
  const map = readFileSync(MAP_PATH, "utf8");
  assert.match(map, /PA-P2M0/);
  assert.match(map, /apps\/api\/src/);
});

test("every apps/api/src module appears in import map", () => {
  const map = readFileSync(MAP_PATH, "utf8");
  const modules = readdirSync(API_SRC).filter((name) => name.endsWith(".js"));
  assert.ok(modules.length >= 8, "expected at least 8 legacy API modules");
  for (const file of modules) {
    assert.match(
      map,
      new RegExp(file.replace(".", "\\.")),
      `${file} must appear in ${MAP_PATH}`
    );
  }
});

test("every agent-gateway tool appears in import map", () => {
  const map = readFileSync(MAP_PATH, "utf8");
  for (const tool of AGENT_TOOLS) {
    assert.match(map, new RegExp(tool.replace(".", "\\.")), `tool ${tool} must appear in import map`);
  }
});

test("ontology-core audit exports mapped in import map", () => {
  const map = readFileSync(MAP_PATH, "utf8");
  for (const symbol of ["verifyAuditEventChain", "auditEventHash", "canonicalJson"]) {
    assert.match(map, new RegExp(symbol), `${symbol} must appear in import map`);
  }
});

test("SPEC.md links import map", () => {
  const spec = readFileSync(join(ROOT, "docs/SPEC.md"), "utf8");
  assert.match(spec, /2026-06-30-atlas-moo-import-map/);
});

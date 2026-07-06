import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isPaperclipBackend,
  resolvePaperclipApiUrl,
  resolvePaperclipCompanyId,
  paperclipApiPrefix,
} from "../atlas-mcp-lib.js";

const ROOT = join(import.meta.dirname, "..", "..");

test("PA-P2d ADR documents 1:1 company workspace mapping", () => {
  const adr = readFileSync(join(ROOT, "docs/bricks/2026-06-30-company-workspace-mapping.md"), "utf8");
  assert.match(adr, /workspace_id = companyId/);
});

test("workspace.ts exports identity mapping", () => {
  const workspace = readFileSync(join(ROOT, "server/src/atlas/workspace.ts"), "utf8");
  assert.match(workspace, /resolveWorkspaceId\(companyId\)/);
  assert.match(workspace, /return companyId/);
});

test("0126 atlas layer migration exists", () => {
  const sql = readFileSync(join(ROOT, "packages/db/src/migrations/0126_atlas_layer.sql"), "utf8");
  assert.match(sql, /atlas_knowledge_records/);
  assert.match(sql, /atlas_audit_events/);
  assert.match(sql, /atlas_company_config/);
});

test("atlas routes module registers company-scoped endpoints", () => {
  const routes = readFileSync(join(ROOT, "server/src/routes/atlas.ts"), "utf8");
  for (const path of [
    "/companies/:companyId/atlas/manifest",
    "/companies/:companyId/atlas/tools/:tool",
    "/companies/:companyId/atlas/audit/verify",
    "/companies/:companyId/atlas/goal-contracts",
    "/companies/:companyId/atlas/bootstrap",
  ]) {
    assert.match(routes, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("app.ts mounts atlas routes", () => {
  const app = readFileSync(join(ROOT, "server/src/app.ts"), "utf8");
  assert.match(app, /atlasRoutes\(db\)/);
});

test("MCP paperclip backend detection", () => {
  assert.equal(isPaperclipBackend({ ATLAS_BACKEND: "paperclip" }), true);
  assert.equal(isPaperclipBackend({ PAPERCLIP_COMPANY_ID: "abc" }), true);
  assert.equal(isPaperclipBackend({}, { apiUrl: "http://127.0.0.1:3100" }), true);
  assert.equal(isPaperclipBackend({}, { apiUrl: "http://127.0.0.1:4000" }), false);
});

test("MCP resolves paperclip company id from env and envelope", () => {
  assert.equal(resolvePaperclipCompanyId({ PAPERCLIP_COMPANY_ID: "co-1" }), "co-1");
  assert.equal(
    resolvePaperclipCompanyId({}, { envelope: { company_id: "co-2" } }),
    "co-2",
  );
  assert.equal(
    resolvePaperclipCompanyId({}, { envelope: { workspace_id: "co-3" } }),
    "co-3",
  );
});

test("paperclip api prefix helper", () => {
  assert.equal(paperclipApiPrefix("http://127.0.0.1:3100"), "/api");
  assert.equal(paperclipApiPrefix("http://127.0.0.1:3100/api"), "");
});

test("paperclip operational bootstrap script exists", () => {
  assert.ok(existsSync(join(ROOT, "scripts/paperclip-operational-bootstrap.js")));
});

test("GitHub and Slack adapters ported under server/src/atlas/external", () => {
  assert.ok(existsSync(join(ROOT, "server/src/atlas/external/github.ts")));
  assert.ok(existsSync(join(ROOT, "server/src/atlas/external/slack.ts")));
});

test("skills-on-paperclip doc exists", () => {
  assert.ok(existsSync(join(ROOT, "docs/atlas-moo-skills-on-paperclip.md")));
});

test("resolvePaperclipApiUrl defaults to :3100", () => {
  assert.equal(resolvePaperclipApiUrl({}), "http://127.0.0.1:3100");
});

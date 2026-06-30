import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");

const REQUIRED_SPEC_HEADINGS = [
  "Paperclip base",
  "Atlas differentiators",
  "Migration reference",
  "Ontology registry",
  "Hash-chained audit",
  "validate:records",
];

const REQUIRED_LAYOUT = [
  "server",
  "ui",
  "cli",
  "packages/adapters",
  "packages/ontology-core",
  "apps/api",
  "doc/SPEC.md",
];

test("docs/SPEC.md indexes Paperclip base and Atlas differentiators", () => {
  const specPath = join(ROOT, "docs/SPEC.md");
  assert.ok(existsSync(specPath), "docs/SPEC.md must exist");
  const content = readFileSync(specPath, "utf8");
  for (const heading of REQUIRED_SPEC_HEADINGS) {
    assert.match(content, new RegExp(heading, "i"), `SPEC.md must mention ${heading}`);
  }
});

test("root-trunk layout includes Paperclip and Atlas reference paths", () => {
  for (const relativePath of REQUIRED_LAYOUT) {
    assert.ok(existsSync(join(ROOT, relativePath)), `missing ${relativePath}`);
  }
});

test("git upstream remote points at paperclipai/paperclip", async () => {
  const { execFileSync } = await import("node:child_process");
  const remotes = execFileSync("git", ["remote", "-v"], { cwd: ROOT, encoding: "utf8" });
  assert.match(remotes, /upstream\s+https:\/\/github\.com\/paperclipai\/paperclip\.git/);
});

test("Paperclip API health and OpenAPI when live smoke enabled", async (t) => {
  if (process.env.PAPERCLIP_LIVE_SMOKE !== "1") {
    t.skip("set PAPERCLIP_LIVE_SMOKE=1 with server on :3100 to run live boot smoke");
    return;
  }
  const base = process.env.PAPERCLIP_API_URL ?? "http://127.0.0.1:3100";
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  const body = await health.json();
  assert.equal(body.status, "ok");

  const openapi = await fetch(`${base}/api/openapi.json`);
  assert.equal(openapi.status, 200);
  const spec = await openapi.json();
  assert.ok(spec && typeof spec === "object");
});

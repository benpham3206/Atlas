import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const ADR = join(ROOT, "docs/bricks/2026-06-30-audit-activity-integration.md");

test("audit activity integration ADR exists and selects sidecar table", () => {
  assert.ok(existsSync(ADR));
  const doc = readFileSync(ADR, "utf8");
  assert.match(doc, /Sidecar table/i);
  assert.match(doc, /atlas_audit_events/);
  assert.match(doc, /verifyAuditEventChain/);
  assert.match(doc, /activity_log/);
});

test("import map references audit integration ADR", () => {
  const map = readFileSync(join(ROOT, "docs/bricks/2026-06-30-atlas-moo-import-map.md"), "utf8");
  assert.match(map, /2026-06-30-audit-activity-integration/);
});

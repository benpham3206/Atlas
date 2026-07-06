import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

test("outputs/site/index.html exists and carries encyclopedia hero framing", () => {
  const indexPath = join(ROOT, "outputs/site/index.html");
  assert.equal(existsSync(indexPath), true, "outputs/site/index.html must exist");
  const html = readFileSync(indexPath, "utf8");
  assert.match(html, /GoalContract/i);
  assert.match(html, /RUN_PATH/i);
  assert.match(html, /knowledge/i);
  assert.match(html, /evidence/i);
  assert.match(html, /audit/i);
  assert.match(html, /01 — Knowledge tier/i);
  assert.match(html, /04 — Fork/i);
  assert.match(html, /docs\/SPEC\.md/);
  assert.match(html, /public-atlas-staff\.json/);
  assert.match(html, /encyclopedia-knowledge-pack\.json/);
  assert.match(html, /05 — Public read slice/i);
  assert.match(html, /public\/canon/);
  assert.match(html, /browse\.html/);
  assert.match(html, /entities\/:recordId\/page/);
  assert.match(html, /audit\/verify/);
});

test("outputs/site/browse.html exists and wires canon index to entity pages", () => {
  const browsePath = join(ROOT, "outputs/site/browse.html");
  assert.equal(existsSync(browsePath), true);
  const html = readFileSync(browsePath, "utf8");
  assert.match(html, /atlas\/public\/canon/);
  assert.match(html, /entities\/\$\{recordId\}\/page/);
  assert.match(html, /audit_verify_path|audit\/verify/);
});

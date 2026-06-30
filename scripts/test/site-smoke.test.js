import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

test("outputs/site/index.html exists and mentions GoalContract", () => {
  const indexPath = join(ROOT, "outputs/site/index.html");
  assert.equal(existsSync(indexPath), true, "outputs/site/index.html must exist");
  const html = readFileSync(indexPath, "utf8");
  assert.match(html, /GoalContract/i);
  assert.match(html, /RUN_PATH/i);
  assert.match(html, /01 — Workspace brain/i);
  assert.match(html, /04 — Try locally/i);
});
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("record validation command accepts valid fixtures", () => {
  const result = spawnSync(process.execPath, [
    "scripts/validate-records.js",
    "tests/fixtures/capability-records.valid.json"
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 20 records/);
});

test("record validation command rejects invalid fixtures", () => {
  const result = spawnSync(process.execPath, [
    "scripts/validate-records.js",
    "tests/fixtures/capability-records.invalid.json"
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /task_vague_without_acceptance/);
  assert.match(result.stderr, /statement_unsupported_claim/);
  assert.match(result.stderr, /overlay_public_private_leak/);
});

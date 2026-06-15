import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const TASK_ID = "TASK-2026-06-15-api-version-endpoint";

function runLoop(args) {
  return spawnSync(process.execPath, ["scripts/100x-loop.js", ...args], {
    encoding: "utf8"
  });
}

test("100x status reports existing handoff files", () => {
  const result = runLoop(["status", TASK_ID]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ok\ttask\t100X\/tasks\/TASK-2026-06-15-api-version-endpoint\.md/);
  assert.match(result.stdout, /ok\tstate\t100X\/state\/TASK-2026-06-15-api-version-endpoint\.md/);
  assert.match(result.stdout, /ok\tlog\t100X\/logs\/TASK-2026-06-15-api-version-endpoint\.md/);
  assert.match(result.stdout, /ok\tpokeSummary\t100X\/POKE_SUMMARY\.md/);
});

test("100x review packet dry run creates local Codex instructions", () => {
  const result = runLoop(["review-packet", TASK_ID, "--pr", "5", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`# ${TASK_ID} Local Codex Review Packet`));
  assert.match(result.stdout, /Review this branch against `origin\/main`/);
  assert.match(result.stdout, /Return only P0\/P1\/P2 findings/);
  assert.match(result.stdout, /Cursor Fix Follow-up Template/);
});

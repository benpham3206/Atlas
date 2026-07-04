import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GATES, runGateLedger } from "../run-gate-ledger.js";

test("GATES includes personal smoke gate", () => {
  assert.deepEqual(GATES.personal, {
    gate: "personal smoke",
    command: "npm run smoke:personal"
  });
});

test("GATES maps gate:test slug to unit ledger row", () => {
  assert.equal(GATES.test.gate, "unit");
  assert.equal(GATES.test.command, "npm test");
  assert.equal(GATES["outputs-shelf"].gate, "outputs shelf");
});

test("runGateLedger rejects unknown gate key", () => {
  assert.throws(() => runGateLedger("not-a-gate", { dryRun: true }), /Unknown gate key/);
});

test("runGateLedger dryRun does not write ledger", () => {
  const dir = mkdtempSync(join(tmpdir(), "atlas-gate-"));
  const ledgerPath = join(dir, "VERIFICATION_LEDGER.md");
  writeFileSync(
    ledgerPath,
    `| Gate | Command | Last run | Result | Git SHA |
| --- | --- | --- | --- | --- |
| personal smoke | \`npm run smoke:personal\` | — | — | — |
`,
    "utf8"
  );

  try {
    const dry = runGateLedger("personal", { dryRun: true });
    assert.equal(dry.gate, "personal smoke");
    const text = readFileSync(ledgerPath, "utf8");
    assert.match(text, /— \| — \| —/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runGateLedger records pass when exitCode is 0", () => {
  const dir = mkdtempSync(join(tmpdir(), "atlas-gate-"));
  const ledgerPath = join(dir, "VERIFICATION_LEDGER.md");
  writeFileSync(
    ledgerPath,
    `| Gate | Command | Last run | Result | Git SHA |
| --- | --- | --- | --- | --- |
| personal smoke | \`npm run smoke:personal\` | — | — | — |
`,
    "utf8"
  );

  try {
    const outcome = runGateLedger("personal", { ledgerPath, exitCode: 0 });
    assert.equal(outcome.result, "pass");
    const text = readFileSync(ledgerPath, "utf8");
    assert.match(text, /personal smoke \| `npm run smoke:personal` \|/);
    assert.match(text, / \| pass \| /);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runGateLedger records fail when exitCode is non-zero", () => {
  const dir = mkdtempSync(join(tmpdir(), "atlas-gate-"));
  const ledgerPath = join(dir, "VERIFICATION_LEDGER.md");
  writeFileSync(
    ledgerPath,
    `| Gate | Command | Last run | Result | Git SHA |
| --- | --- | --- | --- | --- |
| lint | \`npm run lint\` | — | — | — |
`,
    "utf8"
  );

  try {
    const outcome = runGateLedger("lint", { ledgerPath, exitCode: 1 });
    assert.equal(outcome.result, "fail");
    const text = readFileSync(ledgerPath, "utf8");
    assert.match(text, /lint \| `npm run lint` \|/);
    assert.match(text, / \| fail \| /);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
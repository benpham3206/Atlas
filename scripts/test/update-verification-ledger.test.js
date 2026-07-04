import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { updateVerificationLedger } from "../update-verification-ledger.js";

test("updateVerificationLedger updates gate row", () => {
  const dir = mkdtempSync(join(tmpdir(), "atlas-ledger-"));
  const ledgerPath = join(dir, "VERIFICATION_LEDGER.md");
  writeFileSync(
    ledgerPath,
    `| Gate | Command | Last run | Result | Git SHA |
| --- | --- | --- | --- | --- |
| polish quickstart | \`npm run smoke:polish\` | — | — | — |
`,
    "utf8"
  );

  try {
    updateVerificationLedger("polish quickstart", {
      ledgerPath,
      command: "npm run smoke:polish",
      result: "pass"
    });
    const text = readFileSync(ledgerPath, "utf8");
    assert.match(text, /polish quickstart \| `npm run smoke:polish` \|/);
    assert.match(text, / \| pass \| /);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("updateVerificationLedger updates personal smoke gate row", () => {
  const dir = mkdtempSync(join(tmpdir(), "atlas-ledger-"));
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
    updateVerificationLedger("personal smoke", {
      ledgerPath,
      command: "npm run smoke:personal",
      result: "pass"
    });
    const text = readFileSync(ledgerPath, "utf8");
    assert.match(text, /personal smoke \| `npm run smoke:personal` \|/);
    assert.match(text, / \| pass \| /);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

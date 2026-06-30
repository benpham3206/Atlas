/**
 * Run a named verification gate, record pass/fail in VERIFICATION_LEDGER.md.
 * Usage: node scripts/run-gate-ledger.js <gateKey>
 * Keys: test | lint | operational | mcp | personal | outputs-shelf
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { updateVerificationLedger } from "./update-verification-ledger.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const GATES = {
  test: { gate: "unit", command: "npm test" },
  lint: { gate: "lint", command: "npm run lint" },
  operational: { gate: "operational", command: "npm run smoke:operational" },
  mcp: { gate: "mcp", command: "npm run smoke:mcp" },
  personal: { gate: "personal smoke", command: "npm run smoke:personal" },
  "outputs-shelf": {
    gate: "outputs shelf",
    command: "node --test scripts/test/outputs-shelf.test.js"
  }
};

function runCommand(command) {
  const result = spawnSync(command, {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    env: process.env
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

export function runGateLedger(gateKey, options = {}) {
  const spec = GATES[gateKey];
  if (!spec) {
    throw new Error(`Unknown gate key: ${gateKey}. Known: ${Object.keys(GATES).join(", ")}`);
  }

  let run = { status: 0, stderr: "" };
  if (options.exitCode !== undefined) {
    run = { status: options.exitCode, stderr: "" };
  } else if (!options.dryRun) {
    run = runCommand(spec.command);
  }

  const result = run.status === 0 ? "pass" : "fail";

  if (!options.dryRun) {
    updateVerificationLedger(spec.gate, {
      command: spec.command,
      result,
      ledgerPath: options.ledgerPath
    });
  }

  return { gateKey, ...spec, result, exitCode: run.status, stderr: run.stderr?.trim() };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const gateKey = process.argv[2];
  if (!gateKey) {
    console.error("Usage: node scripts/run-gate-ledger.js <gateKey>");
    process.exit(1);
  }

  try {
    const summary = runGateLedger(gateKey);
    console.log(JSON.stringify(summary, null, 2));
    process.exit(summary.exitCode === 0 ? 0 : 1);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
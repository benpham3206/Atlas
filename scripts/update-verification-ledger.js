import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LEDGER_PATH = join(ROOT, "outputs/proofs/VERIFICATION_LEDGER.md");

function gitSha() {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function updateRow(text, gate, { result, command }) {
  const stamp = new Date().toISOString().slice(0, 10);
  const sha = gitSha();
  const linePattern = new RegExp(`\\| ${gate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\|[^\n]*`);

  if (!linePattern.test(text)) {
    throw new Error(`Gate row not found in ledger: ${gate}`);
  }

  return text.replace(
    linePattern,
    `| ${gate} | \`${command}\` | ${stamp} | ${result} | ${sha} |`
  );
}

export function updateVerificationLedger(gate, options = {}) {
  const command = options.command ?? gate;
  const result = options.result ?? "pass";
  const ledgerPath = options.ledgerPath ?? LEDGER_PATH;
  const text = readFileSync(ledgerPath, "utf8");
  const updated = updateRow(text, gate, { result, command });
  writeFileSync(ledgerPath, updated, "utf8");
  return ledgerPath;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const gate = process.argv[2];
  const command = process.argv[3] ?? gate;

  if (!gate) {
    console.error("Usage: node scripts/update-verification-ledger.js <gate> [command]");
    process.exit(1);
  }

  const path = updateVerificationLedger(gate, { command });
  console.log(`Updated ${path} row: ${gate}`);
}

import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_SRC = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO_ROOT = join(WEB_SRC, "..", "..", "..");

export function resolveRepoRoot(env = process.env) {
  return env.ATLAS_REPO_ROOT ?? DEFAULT_REPO_ROOT;
}

export function readLocalMcpSession(env = process.env) {
  const repoRoot = resolveRepoRoot(env);
  const sessionFile =
    env.ATLAS_SESSION_FILE ?? join(repoRoot, ".atlas", "local-session.json");

  try {
    const raw = readFileSync(sessionFile, "utf8");
    const envelope = JSON.parse(raw);
    const expiresAt = envelope.expires_at ? Date.parse(envelope.expires_at) : NaN;
    const expired = Number.isFinite(expiresAt) && expiresAt <= Date.now();

    return {
      session_file: sessionFile,
      envelope,
      missing: false,
      expired
    };
  } catch {
    return { session_file: sessionFile, missing: true };
  }
}

export function readGateStatusHint(repoRoot) {
  const ledger = join(repoRoot, "outputs", "proofs", "VERIFICATION_LEDGER.md");

  try {
    const st = statSync(ledger);
    return {
      ledger_path: "outputs/proofs/VERIFICATION_LEDGER.md",
      mtime_iso: st.mtime.toISOString()
    };
  } catch {
    return {
      ledger_path: "outputs/proofs/VERIFICATION_LEDGER.md",
      missing: true,
      hint: "Run npm run gate:* before polish wrap"
    };
  }
}
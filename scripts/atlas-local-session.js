import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SESSION_VERSION = 1;
export const DEFAULT_SESSION_RELATIVE_PATH = ".atlas/local-session.json";

const SCRIPTS_DIR = fileURLToPath(new URL(".", import.meta.url));
export const REPO_ROOT = resolve(SCRIPTS_DIR, "..");

export function resolveSessionFilePath(env = process.env, repoRoot = REPO_ROOT) {
  const configured = env.ATLAS_SESSION_FILE;

  if (typeof configured === "string" && configured.trim() !== "") {
    const trimmed = configured.trim();

    if (trimmed.startsWith("/")) {
      return trimmed;
    }

    return resolve(repoRoot, trimmed);
  }

  return join(repoRoot, DEFAULT_SESSION_RELATIVE_PATH);
}

export function buildSessionEnvelope(session, baseUrl) {
  return {
    version: SESSION_VERSION,
    api_url: baseUrl.replace(/\/$/, ""),
    delegation_id: session.delegation.id,
    workspace_id: session.workspace.id,
    goal_contract_id: session.goalContract.id,
    agent_id: session.agent.id,
    expires_at: session.delegation.expires_at,
    written_at: new Date().toISOString()
  };
}

export function writeLocalSession(session, baseUrl, options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const sessionFile = options.sessionFile ?? resolveSessionFilePath(options.env ?? process.env, repoRoot);
  const envelope = buildSessionEnvelope(session, baseUrl);

  mkdirSync(dirname(sessionFile), { recursive: true });

  const tempFile = `${sessionFile}.tmp`;
  writeFileSync(tempFile, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");
  renameSync(tempFile, sessionFile);

  return sessionFile;
}

export function readLocalSessionEnvelope(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const sessionFile = options.sessionFile ?? resolveSessionFilePath(options.env ?? process.env, repoRoot);

  let raw;

  try {
    raw = readFileSync(sessionFile, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        sessionFile,
        envelope: null,
        missing: true
      };
    }

    throw error;
  }

  const envelope = JSON.parse(raw);

  if (envelope.version !== SESSION_VERSION) {
    throw new Error(`Unsupported local session version: ${envelope.version}`);
  }

  return {
    sessionFile,
    envelope,
    missing: false,
    expired: isSessionExpired(envelope.expires_at)
  };
}

export function isSessionExpired(expiresAt, now = Date.now()) {
  if (typeof expiresAt !== "string" || expiresAt.trim() === "") {
    return true;
  }

  const parsed = Date.parse(expiresAt);
  return Number.isNaN(parsed) || parsed <= now;
}

export function resolveMcpConnection(env = process.env, options = {}) {
  const apiUrlOverride = optionalString(env.ATLAS_API_URL);
  const delegationOverride = optionalString(env.ATLAS_DELEGATION_ID);
  const session = readLocalSessionEnvelope({ env, ...options });
  const apiUrl = (apiUrlOverride ?? session.envelope?.api_url ?? "http://127.0.0.1:4000").replace(/\/$/, "");
  const delegationId = delegationOverride ?? session.envelope?.delegation_id ?? null;
  const usingSessionFile = !delegationOverride && Boolean(session.envelope?.delegation_id);
  const sessionExpired = usingSessionFile && session.expired === true;

  return {
    apiUrl,
    delegationId,
    sessionFile: session.sessionFile,
    sessionMissing: !delegationOverride && session.missing,
    sessionExpired,
    envelope: session.envelope
  };
}

function optionalString(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

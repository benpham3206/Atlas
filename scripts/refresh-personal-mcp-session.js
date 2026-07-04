/**
 * Refresh .atlas/local-session.json against a live Personal Atlas API (:4000).
 * Safe to call after ephemeral demo/smoke scripts that use temp session files.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { bootstrapOperationalSession, publishOperationalSession } from "./operational-support.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_URL = process.env.ATLAS_API_URL ?? "http://127.0.0.1:4000";

async function probeHealth(url) {
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(2500)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function refreshPersonalMcpSession(options = {}) {
  const apiUrl = options.apiUrl ?? API_URL;
  if (!(await probeHealth(apiUrl))) {
    return { refreshed: false, reason: "api_unreachable", apiUrl };
  }

  const session = await bootstrapOperationalSession(apiUrl);
  const { sessionFile } = publishOperationalSession(session, apiUrl, { repoRoot: root });
  return {
    refreshed: true,
    apiUrl,
    sessionFile,
    delegationId: session.delegation.id,
    expiresAt: session.delegation.expires_at
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = await refreshPersonalMcpSession();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.refreshed ? 0 : 0);
}
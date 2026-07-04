/**
 * Long-running Personal Atlas supervisor for macOS launchd.
 * - Keeps API (:4000) up (restarts on crash)
 * - Optionally keeps web (:3000) when ATLAS_DAEMON_WEB=1
 * - Refreshes .atlas/local-session.json before delegation expiry
 *
 * Hermes MCP (atlas-mcp-stdio.js) is spawned on demand; this daemon only
 * ensures the API + session file stay valid while the Mac is awake.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  bootstrapOperationalSession,
  publishOperationalSession
} from "./operational-support.js";
import { readLocalSessionEnvelope } from "./atlas-local-session.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_URL = process.env.ATLAS_API_URL ?? "http://127.0.0.1:4000";
const WEB_URL = process.env.ATLAS_WEB_URL ?? "http://127.0.0.1:3000";
const RUN_WEB = process.env.ATLAS_DAEMON_WEB === "1" || process.env.ATLAS_DAEMON_WEB === "true";
const REFRESH_BUFFER_MS =
  Number.parseInt(process.env.ATLAS_SESSION_REFRESH_BUFFER_SEC ?? "600", 10) * 1000;
const TICK_MS = Number.parseInt(process.env.ATLAS_DAEMON_TICK_MS ?? "60000", 10);

const children = new Map();
let shuttingDown = false;
let notedExternalApi = false;
let notedExternalWeb = false;

function log(message) {
  const stamp = new Date().toISOString();
  console.log(`[atlas-daemon ${stamp}] ${message}`);
}

async function probe(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function waitForApi(timeoutMs = 60000) {
  const healthUrl = `${API_URL.replace(/\/$/, "")}/health`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await probe(healthUrl)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`API did not become ready at ${API_URL}`);
}

function supervise(label, script) {
  if (children.has(label)) {
    return;
  }

  const child = spawn(process.execPath, [script], {
    cwd: root,
    stdio: "inherit",
    env: process.env
  });

  children.set(label, child);
  log(`started ${label} (pid ${child.pid})`);

  child.on("exit", (code, signal) => {
    children.delete(label);
    if (shuttingDown) {
      return;
    }
    log(`${label} exited (code=${code ?? "null"} signal=${signal ?? "null"}); restarting in 3s`);
    setTimeout(() => ensureServices(), 3000);
  });
}

async function ensureServices() {
  const apiHealth = `${API_URL.replace(/\/$/, "")}/health`;
  const webHome = `${WEB_URL.replace(/\/$/, "")}/`;

  if (await probe(apiHealth)) {
    if (!children.has("api") && !notedExternalApi) {
      notedExternalApi = true;
      log(`api already listening at ${API_URL} (not started by this daemon)`);
    }
  } else if (!children.has("api")) {
    notedExternalApi = false;
    supervise("api", "apps/api/src/server.js");
  }

  if (RUN_WEB) {
    if (await probe(webHome)) {
      if (!children.has("web") && !notedExternalWeb) {
        notedExternalWeb = true;
        log(`web already listening at ${WEB_URL} (not started by this daemon)`);
      }
    } else if (!children.has("web")) {
      notedExternalWeb = false;
      supervise("web", "apps/web/src/server.js");
    }
  }
}

async function ensurePersonalBootstrap() {
  const bootstrapUrl = `${API_URL.replace(/\/$/, "")}/personal/bootstrap`;
  const response = await fetch(bootstrapUrl, { method: "POST" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.message ?? JSON.stringify(payload);
    throw new Error(`personal/bootstrap failed (${response.status}): ${message}`);
  }

  const data = payload.data ?? {};
  log(
    `personal workspace ready (already_existed=${Boolean(data.already_existed)}, open_tasks=${data.open_task_count ?? "?"})`
  );
}

async function refreshSessionIfNeeded(force = false) {
  const healthUrl = `${API_URL.replace(/\/$/, "")}/health`;
  if (!(await probe(healthUrl))) {
    log("session refresh skipped — API not healthy");
    return;
  }

  const { envelope, sessionFile } = readLocalSessionEnvelope({ repoRoot: root });

  if (!force && envelope?.expires_at) {
    const expiresMs = Date.parse(envelope.expires_at);
    if (Number.isFinite(expiresMs) && expiresMs - Date.now() > REFRESH_BUFFER_MS) {
      return;
    }
  }

  log(`refreshing MCP session file (${sessionFile})`);
  const session = await bootstrapOperationalSession(API_URL);
  const { kit } = publishOperationalSession(session, API_URL, { repoRoot: root });
  log(`delegation ${kit.ATLAS_DELEGATION_ID} expires ${kit.expires_at}`);
}

async function tick() {
  try {
    await ensureServices();
    await refreshSessionIfNeeded(false);
  } catch (error) {
    log(`tick error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function shutdown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  log("shutting down");
  for (const [, child] of children) {
    child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(0), 500);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

log(`Personal Atlas daemon (API ${API_URL}${RUN_WEB ? `, web ${WEB_URL}` : ""})`);

await ensureServices();

try {
  await waitForApi();
  await ensurePersonalBootstrap();
  await refreshSessionIfNeeded(true);
} catch (error) {
  log(`bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

setInterval(() => {
  tick().catch(() => {});
}, TICK_MS);

log("supervisor running (launchd + caffeinate keeps Mac awake during idle)");
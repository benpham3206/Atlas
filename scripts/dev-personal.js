/**
 * Run API (:4000) and web (:3000) together for Personal Atlas dogfood.
 * Skips a service if its port already responds (avoids EADDRINUSE).
 * Writes a default local MCP session file once the API is reachable.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  bootstrapOperationalSession,
  publishOperationalSession
} from "./operational-support.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_URL = process.env.ATLAS_API_URL ?? "http://127.0.0.1:4000";
const WEB_URL = process.env.ATLAS_WEB_URL ?? "http://127.0.0.1:3000";

async function probe(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function waitForApi(url, timeoutMs = 15000) {
  const healthUrl = `${url.replace(/\/$/, "")}/health`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await probe(healthUrl)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`API did not become ready at ${url}`);
}

function run(label, script) {
  const child = spawn(process.execPath, [script], {
    cwd: root,
    stdio: "inherit",
    env: process.env
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`[${label}] exited (${signal})`);
    } else if (code !== 0) {
      console.error(`[${label}] exited ${code}`);
    }
    shutdown(code ?? 1);
  });
  return child;
}

const children = [];
let exiting = false;

function shutdown(code = 0) {
  if (exiting) {
    return;
  }
  exiting = true;
  for (const child of children) {
    child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 200);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const apiHealth = `${API_URL.replace(/\/$/, "")}/health`;
const webHome = `${WEB_URL.replace(/\/$/, "")}/`;

const [apiUp, webUp] = await Promise.all([probe(apiHealth), probe(webHome)]);

if (apiUp) {
  console.log(`[api] already up at ${API_URL}`);
} else {
  children.push(run("api", "apps/api/src/server.js"));
}

if (webUp) {
  console.log(`[web] already up at ${WEB_URL}`);
} else {
  children.push(run("web", "apps/web/src/server.js"));
}

await waitForApi(API_URL);

const session = await bootstrapOperationalSession(API_URL);
const { sessionFile, kit } = publishOperationalSession(session, API_URL);

console.log("Personal Atlas:");
console.log(`  API  ${API_URL}`);
console.log(`  Web  ${WEB_URL}`);
console.log(`  MCP session ${sessionFile}`);
console.log(`  Delegation ${kit.ATLAS_DELEGATION_ID} (expires ${kit.expires_at})`);
console.log("Cursor MCP can point at scripts/atlas-mcp-stdio.js with ATLAS_SESSION_FILE from cursor_mcp_config.");

if (children.length === 0) {
  console.log("API and web were already running; refreshed the local MCP session file.");
  process.exit(0);
}

console.log("Ctrl+C stops processes started by this command (not pre-existing servers).");

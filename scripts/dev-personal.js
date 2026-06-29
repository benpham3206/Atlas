/**
 * Run API (:4000) and web (:3000) together for Personal Atlas dogfood.
 * Skips a service if its port already responds (avoids EADDRINUSE).
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

if (children.length === 0) {
  console.log("Personal Atlas: API and web are already running.");
  console.log(`  API  ${API_URL}`);
  console.log(`  Web  ${WEB_URL}`);
  process.exit(0);
}

console.log("Personal Atlas:");
console.log(`  API  ${API_URL}`);
console.log(`  Web  ${WEB_URL}`);
console.log("Ctrl+C stops processes started by this command (not pre-existing servers).");
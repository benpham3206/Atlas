#!/usr/bin/env node
/**
 * Bootstrap Atlas governance on a Paperclip company (PA-P2M5).
 * Requires Paperclip server on PAPERCLIP_API_URL (default :3100).
 */
const API_URL = (process.env.PAPERCLIP_API_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;
const AGENT_API_KEY = process.env.PAPERCLIP_AGENT_API_KEY;

function printUsage() {
  console.log(`Paperclip operational Atlas bootstrap

Requires a running Paperclip server:
  pnpm --filter @paperclipai/plugin-sdk build
  pnpm run dev:server

Environment:
  PAPERCLIP_API_URL=http://127.0.0.1:3100
  PAPERCLIP_COMPANY_ID=<uuid>     (required unless --list-companies)
  PAPERCLIP_AGENT_API_KEY=<key>   (optional for bootstrap POST; board cookie auth not supported here)
`);
}

async function api(method, path, body, headers = {}) {
  const response = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.message ?? payload.error ?? `HTTP ${response.status}`;
    throw new Error(`${method} ${path} failed: ${message}`);
  }
  return payload;
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    return;
  }

  const health = await fetch(`${API_URL}/api/health`);
  if (!health.ok) {
    throw new Error(`Paperclip API not reachable at ${API_URL}/api/health`);
  }

  if (process.argv.includes("--list-companies")) {
    const companies = await api("GET", "/companies");
    console.log(JSON.stringify(companies, null, 2));
    return;
  }

  if (!COMPANY_ID) {
    throw new Error("PAPERCLIP_COMPANY_ID is required (or pass --list-companies)");
  }

  const authHeaders = AGENT_API_KEY ? { authorization: `Bearer ${AGENT_API_KEY}` } : {};

  const boot = await api("POST", `/companies/${COMPANY_ID}/atlas/bootstrap`, {}, authHeaders);
  const verify = await api("GET", `/companies/${COMPANY_ID}/atlas/audit/verify`, undefined, authHeaders);
  const manifest = await api("GET", `/companies/${COMPANY_ID}/atlas/manifest`, undefined, authHeaders);

  const kit = {
    api_url: API_URL,
    company_id: COMPANY_ID,
    workspace_id: COMPANY_ID,
    backend: "paperclip",
    atlas_bootstrapped: boot.bootstrapped === true,
    audit_valid: verify.audit_valid === true,
    tool_count: Array.isArray(manifest.tools) ? manifest.tools.length : 0,
    mcp_env: {
      ATLAS_BACKEND: "paperclip",
      PAPERCLIP_API_URL: API_URL,
      PAPERCLIP_COMPANY_ID: COMPANY_ID,
      ...(AGENT_API_KEY ? { PAPERCLIP_AGENT_API_KEY: "<set in env>" } : {}),
    },
  };

  console.log(JSON.stringify(kit, null, 2));
}

main().catch((error) => {
  console.error("Paperclip operational bootstrap failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

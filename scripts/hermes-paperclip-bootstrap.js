#!/usr/bin/env node
/**
 * One-shot: verify Paperclip :3100, Atlas-on-Paperclip bootstrap, print Hermes MCP checklist.
 * Does not write secrets; point Hermes at ~/.hermes/config.yaml mcp_servers.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_URL = (process.env.PAPERCLIP_API_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;

async function health() {
  const response = await fetch(`${API_URL}/api/health`);
  return response.ok;
}

async function main() {
  const ok = await health();
  if (!ok) {
    console.error(`Paperclip API not reachable at ${API_URL}/api/health`);
    console.error("Start: cd ~/Documents/Atlas && pnpm run dev:server");
    console.error("Or durable: pnpm run paperclipai run");
    process.exit(1);
  }

  if (!COMPANY_ID) {
    console.error("Set PAPERCLIP_COMPANY_ID (Hermes config paperclip mcp env has it).");
    process.exit(1);
  }

  const bootstrap = spawnSync(
    process.execPath,
    ["scripts/paperclip-operational-bootstrap.js"],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, PAPERCLIP_API_URL: API_URL, PAPERCLIP_COMPANY_ID: COMPANY_ID },
      encoding: "utf8",
    }
  );

  if (bootstrap.status !== 0) {
    process.stderr.write(bootstrap.stderr || bootstrap.stdout);
    process.exit(bootstrap.status ?? 1);
  }

  const raw = bootstrap.stdout.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) {
    console.error("Bootstrap did not return JSON kit");
    process.stderr.write(bootstrap.stdout);
    process.exit(1);
  }
  const kit = JSON.parse(raw.slice(start, end + 1));
  console.log(JSON.stringify({ bootstrap: kit }, null, 2));
  console.log(`
Hermes + Paperclip + Atlas (build/fix code)

1) Keep Paperclip up (:3100) — dev:server or \`pnpm run paperclipai run\`
2) ~/.hermes/config.yaml — enable mcp_servers.paperclip + atlas-paperclip (see docs/bricks/2026-06-30-hermes-paperclip-build-atlas.md)
3) Hermes desktop: Settings → MCP → Reload
4) Work: Paperclip MCP (issues/checkout) + terminal/file in ~/Documents/Atlas; Atlas MCP paperclip backend for audit/knowledge tools
5) Legacy personal spine (:4000): npm run dev:personal + mcp_servers.atlas unchanged

CLI: pnpm run paperclipai issue … | agent … | run
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
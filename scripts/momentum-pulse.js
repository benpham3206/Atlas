#!/usr/bin/env node
/**
 * Live dogfood pulse — Paperclip heartbeat on shoulders of Hermes + Atlas.
 * Requires persistent :4000 (launchd / npm run dev:personal). Silent exit 0 if API down (watchdog pattern).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.ATLAS_API_URL ?? "http://127.0.0.1:4000";
const REPO = process.cwd();

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function readDoLine() {
  try {
    const md = readFileSync(join(REPO, "outputs/internal/NEXT_ACTION.md"), "utf8");
    const m = md.match(/\*\*Do:\*\*\s*\*\*(.+?)\*\*/);
    return m?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const health = await get("/health");
  if (!health.ok) {
    process.exit(0);
  }

  const next = await get("/personal/next-action");
  const audit = await get("/audit/verify");
  const taskTitle =
    next.body?.data?.task?.properties_json?.title ??
    next.body?.data?.next_action?.task?.properties_json?.title ??
    next.body?.task?.properties_json?.title ??
    "unknown";
  const auditOk = audit.body?.data?.valid === true || audit.body?.valid === true;
  const docDo = readDoLine();

  const lines = [
    "Atlas momentum (giants shoulders)",
    `API: ok · audit: ${auditOk ? "valid" : "CHECK"}`,
    `Spine: ${taskTitle}`,
    docDo ? `Doc Do: ${docDo}` : null,
    "Reply go to run one company turn this session."
  ].filter(Boolean);

  console.log(lines.join("\n"));
}

main().catch(() => process.exit(0));
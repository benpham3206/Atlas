#!/usr/bin/env node
/**
 * Live dogfood pulse — Paperclip heartbeat on shoulders of Hermes + Atlas.
 * Requires persistent :4000 (launchd / npm run dev:personal). Silent exit 0 if API down (watchdog pattern).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.ATLAS_API_URL ?? "http://127.0.0.1:4000";
const REPO = process.cwd();

export function parseNextActionMarkdown(md) {
  const doMatch = md.match(/\*\*Do:\*\*\s*\*\*(.+?)\*\*/);
  const becauseMatch = md.match(/\*\*Because:\*\*\s*(.+)/);
  const publicSprint = /Public Atlas|PA-P\d/i.test(md);
  const paTask = doMatch?.[1]?.match(/PA-P\d[a-z]?/i)?.[0] ?? null;
  return {
    docDo: doMatch?.[1]?.trim() ?? null,
    because: becauseMatch?.[1]?.trim() ?? null,
    publicSprint,
    paTask
  };
}

export function readNextAction(repo = REPO) {
  try {
    const md = readFileSync(join(repo, "outputs/internal/NEXT_ACTION.md"), "utf8");
    return parseNextActionMarkdown(md);
  } catch {
    return { docDo: null, because: null, publicSprint: false, paTask: null };
  }
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
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
  const na = readNextAction();
  const paperclipRoot = existsSync(join(REPO, "server")) && existsSync(join(REPO, "cli"));

  const lines = ["Atlas momentum (giants shoulders · 110%)"];
  lines.push(`API: ok · audit: ${auditOk ? "valid" : "CHECK"} · trunk: ${paperclipRoot ? "paperclip@root" : "legacy"}`);

  if (na.publicSprint && na.docDo) {
    lines.push(`Now: ${na.docDo}`);
    lines.push(`Ontology spine (deferred): ${taskTitle}`);
    lines.push("Ben: one ≤20m inch on Now in Cursor · Hermes: skill/gate/cron fix this pulse.");
  } else {
    lines.push(`Spine: ${taskTitle}`);
    if (na.docDo) lines.push(`Doc Do: ${na.docDo}`);
    lines.push("Reply go for one company turn on live spine.");
  }

  if (na.paTask) {
    lines.push(`Sprint: Public Atlas · epic ${na.paTask}`);
  }

  console.log(lines.join("\n"));
}

main().catch(() => process.exit(0));
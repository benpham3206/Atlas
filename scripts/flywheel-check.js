#!/usr/bin/env node
/**
 * Static + optional live checks for internal momentum flywheel (target 110–120%).
 * Exit 0 when harness is wired; prints gaps. API checks are best-effort (skip if down).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = process.cwd();
const HERMES = process.env.HERMES_HOME ?? join(process.env.HOME ?? "", ".hermes");

const requiredFiles = [
  "outputs/internal/NEXT_ACTION.md",
  "outputs/internal/GIANTS_DOGFOOD_MOMENTUM.md",
  "outputs/docs/FLYWHEEL_STATUS.md",
  "scripts/momentum-pulse.js",
  "scripts/flywheel-check.js"
];

const hermesScripts = [
  "scripts/atlas-momentum-watchdog.sh",
  "scripts/atlas-personal-heartbeat.sh",
  "scripts/capability-compound-prep.sh"
];

function check(name, ok, detail = "") {
  return { name, ok, detail };
}

async function apiLine() {
  const base = process.env.ATLAS_API_URL ?? "http://127.0.0.1:4000";
  try {
    const h = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) });
    if (!h.ok) return check("api:health", false, String(h.status));
    const a = await fetch(`${base}/audit/verify`, { signal: AbortSignal.timeout(3000) });
    const body = await a.json().catch(() => ({}));
    const valid = body?.data?.valid === true || body?.valid === true;
    return check("api:audit", valid, valid ? "valid" : "CHECK");
  } catch (e) {
    return check("api:live", false, "down (ok for CI static check)");
  }
}

async function main() {
  const results = [];

  for (const rel of requiredFiles) {
    results.push(check(`file:${rel}`, existsSync(join(REPO, rel))));
  }

  for (const rel of hermesScripts) {
    results.push(check(`hermes:${rel}`, existsSync(join(HERMES, rel))));
  }

  try {
    const na = readFileSync(join(REPO, "outputs/internal/NEXT_ACTION.md"), "utf8");
    results.push(check("next_action:do", /\*\*Do:\*\*/.test(na)));
    results.push(check("next_action:giants", /GIANTS_DOGFOOD_MOMENTUM/.test(na)));
    results.push(
      check("next_action:sprint", /\*\*Do:\*\*.*(PS-P|PA-P|H1)/.test(na))
    );
  } catch {
    results.push(check("next_action:do", false));
  }

  results.push(await apiLine());

  const failed = results.filter((r) => !r.ok);
  const staticOnly = failed.filter((r) => !r.name.startsWith("api:"));

  console.log("Flywheel check (110% harness)");
  for (const r of results) {
    console.log(`${r.ok ? "ok" : "GAP"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }

  if (staticOnly.length > 0) {
    console.error(`\n${staticOnly.length} static gap(s) — flywheel below 110%.`);
    process.exit(1);
  }

  console.log("\nStatic harness: 110%+. Live API optional.");
  process.exit(0);
}

main();
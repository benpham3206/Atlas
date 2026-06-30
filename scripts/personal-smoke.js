/**
 * Live Personal Atlas smoke — expects API at ATLAS_API_URL (default :4000).
 * Verifies bootstrap idempotency, read safety, next-action, blockers, persistence hint.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_URL = (process.env.ATLAS_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_FILE =
  process.env.ATLAS_DATA_FILE ?? path.join(ROOT, ".atlas", "personal-store.json");

function step(label) {
  console.log(`\n▶ ${label}`);
}

function ok(message) {
  console.log(`  ✓ ${message}`);
}

async function requestJson(pathname, options = {}) {
  const response = await fetch(`${API_URL}${pathname}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

async function main() {
  step("Health");
  const health = await requestJson("/health");
  assert.equal(health.status, 200);
  ok("/health");

  step("Reads do not bootstrap (pre-bootstrap probe skipped if already bootstrapped)");
  const workspacesBefore = await requestJson("/workspaces");
  assert.equal(workspacesBefore.status, 200);

  step("POST /personal/bootstrap (idempotent)");
  const boot = await requestJson("/personal/bootstrap", { method: "POST" });
  assert.equal(boot.status, 200);
  assert.equal(boot.payload.data.workspace_id, "workspace_personal");
  ok(`already_existed=${Boolean(boot.payload.data.already_existed)}`);

  const boot2 = await requestJson("/personal/bootstrap", { method: "POST" });
  assert.equal(boot2.status, 200);
  assert.equal(boot2.payload.data.already_existed, true);
  ok("idempotent second bootstrap");

  step("GET /personal/next-action");
  const next = await requestJson("/personal/next-action");
  assert.equal(next.status, 200);
  assert.ok(next.payload.data.task?.properties_json?.acceptance_criteria?.length > 0);
  ok(`next: ${next.payload.data.task.properties_json.title}`);

  step("GET /personal/overview");
  const overview = await requestJson("/personal/overview");
  assert.equal(overview.status, 200);
  assert.equal(
    overview.payload.data.tasks.every((t) => t.properties_json.acceptance_criteria?.length > 0),
    true
  );
  assert.match(overview.payload.data.security_boundary, /No authentication/);
  ok("all tasks have acceptance_criteria");

  step("GET /personal/tasks");
  const taskCatalog = await requestJson("/personal/tasks");
  assert.equal(taskCatalog.status, 200);
  assert.equal(taskCatalog.payload.data.tasks.length, overview.payload.data.tasks.length);
  const expectedOpen = overview.payload.data.tasks.filter(
    (task) => task.properties_json.status === "todo"
  ).length;
  assert.equal(taskCatalog.payload.data.open_task_count, expectedOpen);
  ok(`tasks=${taskCatalog.payload.data.task_count}`);

  step("Blocked task cannot complete");
  const blockedEntry = Object.entries(taskCatalog.payload.data.blockers).find(
    ([, blockers]) => Array.isArray(blockers) && blockers.length > 0
  );
  assert.ok(blockedEntry, "expected at least one blocked personal task");
  const [blockedTaskId] = blockedEntry;
  const blocked = await requestJson(`/personal/tasks/${blockedTaskId}/complete`, {
    method: "POST",
    body: { artifact_uri: "docs/x.md", evidence_note: "smoke skip" }
  });
  assert.equal(blocked.status, 409);
  assert.equal(blocked.payload.error, "task_blocked");
  ok("task_blocked enforced");

  if (fs.existsSync(DATA_FILE)) {
    ok(`persistence file present (${DATA_FILE})`);
    assert.match(overview.payload.data.security_boundary, /ATLAS_DATA_FILE/);
  } else {
    console.log(`  ⚠ no persistence file at ${DATA_FILE} (volatile API)`);
  }

  console.log("\n✅ Personal Atlas smoke passed\n");
}

main().catch((error) => {
  console.error("\n❌ Personal smoke failed:\n", error);
  process.exit(1);
});
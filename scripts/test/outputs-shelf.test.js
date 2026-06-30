import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  bootstrapOperationalSession,
  publishOperationalSession,
  startEphemeralApi
} from "../operational-support.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

const REQUIRED_PATHS = [
  "outputs/README.md",
  "outputs/site/README.md",
  "outputs/app/README.md",
  "outputs/docs/LONG_RUNNING_WORK.md",
  "outputs/docs/USAGE_GUIDE.md",
  "outputs/docs/ROLES.md",
  "outputs/codebase/README.md",
  "outputs/demos/README.md",
  "outputs/proofs/README.md",
  "outputs/proofs/VERIFICATION_LEDGER.md",
  "outputs/internal/NEXT_ACTION.md"
];

test("outputs shelf includes required product paths", () => {
  const missing = REQUIRED_PATHS.filter((relativePath) => !existsSync(join(ROOT, relativePath)));
  assert.deepEqual(missing, [], `missing outputs shelf paths: ${missing.join(", ")}`);
});

test("LONG_RUNNING_WORK maps Matrix and Paperclip control-plane concepts", () => {
  const text = readFileSync(join(ROOT, "outputs/docs/LONG_RUNNING_WORK.md"), "utf8");
  assert.match(text, /Matrix/);
  assert.match(text, /Paperclip/);
  assert.match(text, /review inbox/i);
  assert.match(text, /heartbeat/i);
  assert.match(text, /cron/i);
});

test("publishOperationalSession refreshes outputs/internal/STATE.md idempotently", async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-outputs-state-"));
  const runtime = await startEphemeralApi({ dataFilePrefix: "atlas-outputs-state" });

  try {
    const session = await bootstrapOperationalSession(runtime.baseUrl, {
      workspaceId: "workspace_outputs_state",
      workspaceName: "Outputs State Test"
    });
    publishOperationalSession(session, runtime.baseUrl, { repoRoot });
    const statePath = join(repoRoot, "outputs/internal/STATE.md");
    const first = readFileSync(statePath, "utf8");
    assert.match(first, /workspace_id \| workspace_outputs_state/);

    publishOperationalSession(session, runtime.baseUrl, { repoRoot });
    const second = readFileSync(statePath, "utf8");
    assert.match(second, /workspace_id \| workspace_outputs_state/);
    assert.match(second, /refreshed_at \|/);
  } finally {
    await runtime.close();
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

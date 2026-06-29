import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  isSessionExpired,
  readLocalSessionEnvelope,
  resolveMcpConnection,
  resolveSessionFilePath,
  writeLocalSession
} from "../atlas-local-session.js";
import { bootstrapOperationalSession, startEphemeralApi } from "../operational-support.js";

test("writeLocalSession writes a gitignored-style envelope owned by platform runtime", async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-session-"));
  const runtime = await startEphemeralApi({ dataFilePrefix: "atlas-session-test" });

  try {
    const session = await bootstrapOperationalSession(runtime.baseUrl, {
      workspaceId: "workspace_session_test",
      workspaceName: "Session Test"
    });
    const sessionFile = writeLocalSession(session, runtime.baseUrl, { repoRoot });
    const envelope = JSON.parse(readFileSync(sessionFile, "utf8"));

    assert.equal(envelope.version, 1);
    assert.equal(envelope.api_url, runtime.baseUrl);
    assert.equal(envelope.delegation_id, session.delegation.id);
    assert.equal(envelope.workspace_id, session.workspace.id);
    assert.equal(envelope.goal_contract_id, session.goalContract.id);
    assert.equal(envelope.agent_id, session.agent.id);
    assert.equal(envelope.expires_at, session.delegation.expires_at);
    assert.ok(envelope.written_at);
  } finally {
    await runtime.close();
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("resolveMcpConnection reads session file by default and honors env overrides", async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-session-"));
  const sessionFile = join(repoRoot, ".atlas", "local-session.json");
  const envelope = {
    version: 1,
    api_url: "http://127.0.0.1:4010",
    delegation_id: "delegation_test",
    workspace_id: "workspace_test",
    goal_contract_id: "goal_contract_test",
    agent_id: "agent_test",
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    written_at: new Date().toISOString()
  };

  writeLocalSession(
    {
      workspace: { id: envelope.workspace_id },
      goalContract: { id: envelope.goal_contract_id },
      agent: { id: envelope.agent_id },
      delegation: { id: envelope.delegation_id, expires_at: envelope.expires_at }
    },
    envelope.api_url,
    { repoRoot, sessionFile }
  );

  const fromFile = resolveMcpConnection({}, { repoRoot, sessionFile });
  assert.equal(fromFile.apiUrl, envelope.api_url);
  assert.equal(fromFile.delegationId, envelope.delegation_id);
  assert.equal(fromFile.sessionMissing, false);
  assert.equal(fromFile.sessionExpired, false);

  const overridden = resolveMcpConnection(
    {
      ATLAS_API_URL: "http://127.0.0.1:4999",
      ATLAS_DELEGATION_ID: "delegation_override"
    },
    { repoRoot, sessionFile }
  );
  assert.equal(overridden.apiUrl, "http://127.0.0.1:4999");
  assert.equal(overridden.delegationId, "delegation_override");

  rmSync(repoRoot, { recursive: true, force: true });
});

test("readLocalSessionEnvelope marks missing and expired sessions", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-session-"));
  const sessionFile = resolveSessionFilePath({ ATLAS_SESSION_FILE: ".atlas/local-session.json" }, repoRoot);

  const missing = readLocalSessionEnvelope({ repoRoot, sessionFile });
  assert.equal(missing.missing, true);
  assert.equal(missing.envelope, null);

  writeLocalSession(
    {
      workspace: { id: "workspace_test" },
      goalContract: { id: "goal_contract_test" },
      agent: { id: "agent_test" },
      delegation: {
        id: "delegation_expired",
        expires_at: new Date(Date.now() - 60_000).toISOString()
      }
    },
    "http://127.0.0.1:4000",
    { repoRoot, sessionFile }
  );

  const expired = readLocalSessionEnvelope({ repoRoot, sessionFile });
  assert.equal(expired.missing, false);
  assert.equal(expired.expired, true);
  assert.equal(isSessionExpired(expired.envelope.expires_at), true);

  rmSync(repoRoot, { recursive: true, force: true });
});

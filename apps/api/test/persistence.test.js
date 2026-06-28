import test from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createOntologyStore } from "../src/ontology-store.js";
import { createFilePersistence } from "../src/persistence.js";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));

function seed(store) {
  const workspace = store.createWorkspace({ name: "Durable Workspace" });
  const taskType = store.createObjectType(workspace.id, {
    name: "Task",
    schema_json: {
      type: "object",
      required: ["title", "status"],
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["todo", "done"] }
      }
    }
  });
  const task = store.createObjectInstance(workspace.id, {
    object_type_id: taskType.id,
    properties_json: { title: "Persist me", status: "todo" }
  });
  const actionType = store.createActionType(workspace.id, {
    name: "Complete",
    target_object_type_id: taskType.id,
    input_schema_json: { type: "object", properties: {} },
    effect_json: { type: "update_object_properties", set_properties_json: { status: "done" } }
  });
  store.createPolicy(workspace.id, {
    name: "Editors only",
    rules_json: [{ effect: "allow", action: "run_action", resource_type: taskType.id, roles: ["editor"] }]
  });
  const agent = store.createAgent({ display_name: "Persistent Agent" });
  const delegation = store.createAgentDelegation(workspace.id, {
    agent_id: agent.id,
    role: "editor",
    scopes: ["atlas.read", "atlas.act"]
  });

  return { workspace, taskType, task, actionType, agent, delegation };
}

test("snapshot/restore round-trips all collections and the audit log", () => {
  const source = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, task } = seed(source);
  const snapshot = source.snapshot();

  const target = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  target.restore(snapshot);

  assert.deepEqual(target.snapshot(), snapshot);
  assert.deepEqual(target.getObjectInstance(workspace.id, task.id), source.getObjectInstance(workspace.id, task.id));
  assert.equal(target.verifyAuditChain().valid, true);
  assert.equal(target.listAgents().length, 1);
  assert.equal(target.listAgentDelegations(workspace.id).length, 1);
});

test("restore preserves id counters so new ids do not collide", () => {
  const source = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskType } = seed(source);
  const snapshot = source.snapshot();

  const target = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  target.restore(snapshot);

  const created = target.createObjectInstance(workspace.id, {
    object_type_id: taskType.id,
    properties_json: { title: "Second", status: "todo" }
  });

  assert.equal(created.id, "object_002");
});

test("governance still enforces after restore", () => {
  const source = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, task, actionType } = seed(source);

  const target = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  target.restore(source.snapshot());

  assert.throws(
    () =>
      target.createActionRun(workspace.id, {
        action_type_id: actionType.id,
        target_object_id: task.id,
        actor: "viewer_agent",
        role: "viewer"
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      return true;
    }
  );
});

test("file persistence saves and loads a snapshot", (t) => {
  const filePath = join(TEST_DIR, `tmp-persistence-${process.pid}.json`);
  t.after(() => rmSync(filePath, { force: true }));

  const persistence = createFilePersistence(filePath);
  assert.equal(persistence.load(), null);

  const source = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, task } = seed(source);
  persistence.save(source.snapshot());

  const loaded = persistence.load();
  assert.ok(loaded);

  const target = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  target.restore(loaded);
  assert.deepEqual(
    target.getObjectInstance(workspace.id, task.id),
    source.getObjectInstance(workspace.id, task.id)
  );
});

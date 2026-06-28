import test from "node:test";
import assert from "node:assert/strict";
import { createOntologyStore } from "../src/ontology-store.js";

function seedTaskWorkspace(store) {
  const workspace = store.createWorkspace({ name: "Audit Workspace" });
  const objectType = store.createObjectType(workspace.id, {
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
  const object = store.createObjectInstance(workspace.id, {
    object_type_id: objectType.id,
    properties_json: { title: "Write audit log", status: "todo" }
  });
  const actionType = store.createActionType(workspace.id, {
    name: "Complete task",
    target_object_type_id: objectType.id,
    input_schema_json: { type: "object", properties: {} },
    effect_json: {
      type: "update_object_properties",
      set_properties_json: { status: "done" }
    }
  });

  return { workspace, objectType, object, actionType };
}

test("store records an audit event for object creation", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, object } = seedTaskWorkspace(store);

  const events = store.listAuditEvents(workspace.id, { resource_id: object.id });
  assert.equal(events.length, 1);
  assert.equal(events[0].event_type, "object_instance.created");
  assert.equal(events[0].decision, "allow");
  assert.equal(events[0].before_hash, null);
  assert.ok(events[0].after_hash);
  assert.ok(events[0].event_hash);
});

test("store hash-chains audit events and verifies the chain", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, object, actionType } = seedTaskWorkspace(store);

  store.createActionRun(workspace.id, {
    action_type_id: actionType.id,
    target_object_id: object.id,
    actor: "agent_007"
  });

  const events = store.listAuditEvents(workspace.id);
  assert.equal(events.length, 2);
  assert.equal(events[0].previous_event_hash, null);
  assert.equal(events[1].previous_event_hash, events[0].event_hash);
  assert.equal(events[1].event_type, "action_run.completed");
  assert.equal(events[1].actor, "agent_007");

  const verification = store.verifyAuditChain();
  assert.equal(verification.valid, true);
  assert.deepEqual(verification.errors, []);
});

test("store audit log is append-only via the public API", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  seedTaskWorkspace(store);

  assert.equal(typeof store.listAuditEvents, "function");
  assert.equal(store.updateAuditEvent, undefined);
  assert.equal(store.deleteAuditEvent, undefined);

  const events = store.listAuditEvents();
  events[0].event_type = "mutated_copy";
  const reread = store.listAuditEvents();
  assert.notEqual(reread[0].event_type, "mutated_copy");
});

test("store records sequential audit events across two objects", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, objectType } = seedTaskWorkspace(store);

  store.createObjectInstance(workspace.id, {
    object_type_id: objectType.id,
    properties_json: { title: "Second task", status: "todo" }
  });

  const events = store.listAuditEvents(workspace.id);
  assert.equal(events.length, 2);
  assert.deepEqual(
    events.map((event) => event.sequence),
    [1, 2]
  );
  assert.equal(store.verifyAuditChain().valid, true);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createOntologyStore } from "../src/ontology-store.js";

test("store creates deterministic ids when ids are omitted", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const objectType = store.createObjectType(workspace.id, {
    name: "Build",
    schema_json: {
      type: "object",
      required: ["version"],
      properties: {
        version: { type: "string" }
      }
    }
  });
  const objectInstance = store.createObjectInstance(workspace.id, {
    object_type_id: objectType.id,
    properties_json: {
      version: "v0.1"
    }
  });

  assert.equal(workspace.id, "workspace_001");
  assert.equal(objectType.id, "object_type_001");
  assert.equal(objectInstance.id, "object_001");
});

test("store creates deterministic link ids when ids are omitted", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const buildType = store.createObjectType(workspace.id, {
    name: "Build",
    schema_json: {
      type: "object",
      required: ["version"],
      properties: {
        version: { type: "string" }
      }
    }
  });
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" }
      }
    }
  });
  const build = store.createObjectInstance(workspace.id, {
    object_type_id: buildType.id,
    properties_json: {
      version: "v0.1"
    }
  });
  const bug = store.createObjectInstance(workspace.id, {
    object_type_id: bugType.id,
    properties_json: {
      title: "Camera clips through wall"
    }
  });
  const linkType = store.createLinkType(workspace.id, {
    name: "Bug affects Build",
    from_object_type_id: bugType.id,
    to_object_type_id: buildType.id
  });
  const link = store.createLinkInstance(workspace.id, {
    link_type_id: linkType.id,
    from_object_id: bug.id,
    to_object_id: build.id
  });

  assert.equal(linkType.id, "link_type_001");
  assert.equal(link.id, "link_001");
});

test("store creates deterministic object set ids when ids are omitted", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      properties: {
        status: { type: "string" }
      }
    }
  });
  const objectSet = store.createObjectSet(workspace.id, {
    name: "Open bugs",
    object_type_id: bugType.id,
    filter_expression: {
      property_equals: {
        status: "open"
      }
    }
  });

  assert.equal(objectSet.id, "object_set_001");
});

test("store creates deterministic action ids when ids are omitted", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      required: ["title", "status"],
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["open", "resolved"] }
      }
    }
  });
  const actionType = store.createActionType(workspace.id, {
    name: "Mark Bug Resolved",
    target_object_type_id: bugType.id,
    input_schema_json: {
      type: "object",
      properties: {
        resolution_note: { type: "string" }
      }
    },
    effect_json: {
      type: "update_object_properties",
      set_properties_json: {
        status: "resolved"
      },
      copy_input_fields: ["resolution_note"]
    }
  });
  const bug = store.createObjectInstance(workspace.id, {
    object_type_id: bugType.id,
    properties_json: {
      title: "Camera clips through wall",
      status: "open"
    }
  });
  const actionRun = store.createActionRun(workspace.id, {
    action_type_id: actionType.id,
    target_object_id: bug.id,
    input_json: {
      resolution_note: "Fixed collision mesh"
    }
  });

  assert.equal(actionType.id, "action_type_001");
  assert.equal(actionRun.id, "action_run_001");
});

test("action run updates target properties and stores before/after snapshots", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      required: ["title", "status"],
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["open", "resolved"] },
        resolution_note: { type: "string" }
      }
    }
  });
  const actionType = store.createActionType(workspace.id, {
    name: "Mark Bug Resolved",
    target_object_type_id: bugType.id,
    input_schema_json: {
      type: "object",
      properties: {
        resolution_note: { type: "string" }
      }
    },
    effect_json: {
      type: "update_object_properties",
      set_properties_json: {
        status: "resolved"
      },
      copy_input_fields: ["resolution_note"]
    }
  });
  const bug = store.createObjectInstance(workspace.id, {
    object_type_id: bugType.id,
    properties_json: {
      title: "Camera clips through wall",
      status: "open"
    }
  });
  const actionRun = store.createActionRun(workspace.id, {
    action_type_id: actionType.id,
    target_object_id: bug.id,
    input_json: {
      resolution_note: "Fixed collision mesh"
    }
  });
  const updatedBug = store.getObjectInstance(workspace.id, bug.id);

  assert.equal(actionRun.status, "completed");
  assert.deepEqual(actionRun.before_properties_json, {
    title: "Camera clips through wall",
    status: "open"
  });
  assert.deepEqual(actionRun.after_properties_json, {
    title: "Camera clips through wall",
    status: "resolved",
    resolution_note: "Fixed collision mesh"
  });
  assert.deepEqual(actionRun.output_json, {
    status: "resolved",
    resolution_note: "Fixed collision mesh"
  });
  assert.deepEqual(updatedBug.properties_json, actionRun.after_properties_json);
});

test("invalid action input does not mutate target object", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      required: ["title", "status"],
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["open", "resolved"] }
      }
    }
  });
  const actionType = store.createActionType(workspace.id, {
    name: "Mark Bug Resolved",
    target_object_type_id: bugType.id,
    input_schema_json: {
      type: "object",
      required: ["resolution_note"],
      properties: {
        resolution_note: { type: "string" }
      }
    },
    effect_json: {
      type: "update_object_properties",
      set_properties_json: {
        status: "resolved"
      },
      copy_input_fields: []
    }
  });
  const bug = store.createObjectInstance(workspace.id, {
    object_type_id: bugType.id,
    properties_json: {
      title: "Camera clips through wall",
      status: "open"
    }
  });

  assert.throws(
    () => store.createActionRun(workspace.id, {
      action_type_id: actionType.id,
      target_object_id: bug.id,
      input_json: {}
    }),
    (error) => error.code === "action_input_validation_failed"
  );

  const unchangedBug = store.getObjectInstance(workspace.id, bug.id);

  assert.deepEqual(unchangedBug.properties_json, {
    title: "Camera clips through wall",
    status: "open"
  });
  assert.equal(store.listActionRuns(workspace.id).length, 0);
});

test("duplicate action run id does not mutate target object", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      required: ["title", "status"],
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["open", "resolved"] },
        resolution_note: { type: "string" }
      }
    }
  });
  const actionType = store.createActionType(workspace.id, {
    name: "Mark Bug Resolved",
    target_object_type_id: bugType.id,
    input_schema_json: {
      type: "object",
      properties: {
        resolution_note: { type: "string" }
      }
    },
    effect_json: {
      type: "update_object_properties",
      set_properties_json: {
        status: "resolved"
      },
      copy_input_fields: ["resolution_note"]
    }
  });
  const bug = store.createObjectInstance(workspace.id, {
    object_type_id: bugType.id,
    properties_json: {
      title: "Camera clips through wall",
      status: "open"
    }
  });

  store.createActionRun(workspace.id, {
    id: "action_run_duplicate",
    action_type_id: actionType.id,
    target_object_id: bug.id,
    input_json: {
      resolution_note: "First resolution"
    }
  });

  assert.throws(
    () => store.createActionRun(workspace.id, {
      id: "action_run_duplicate",
      action_type_id: actionType.id,
      target_object_id: bug.id,
      input_json: {
        resolution_note: "Conflicting resolution"
      }
    }),
    (error) => error.code === "action_run_conflict"
  );

  const unchangedBug = store.getObjectInstance(workspace.id, bug.id);

  assert.deepEqual(unchangedBug.properties_json, {
    title: "Camera clips through wall",
    status: "resolved",
    resolution_note: "First resolution"
  });
  assert.equal(store.listActionRuns(workspace.id).length, 1);
});

test("action run rejects target object type mismatch", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      required: ["title", "status"],
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["open", "resolved"] }
      }
    }
  });
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
  const actionType = store.createActionType(workspace.id, {
    name: "Mark Bug Resolved",
    target_object_type_id: bugType.id,
    input_schema_json: {
      type: "object",
      properties: {}
    },
    effect_json: {
      type: "update_object_properties",
      set_properties_json: {
        status: "resolved"
      },
      copy_input_fields: []
    }
  });
  const task = store.createObjectInstance(workspace.id, {
    object_type_id: taskType.id,
    properties_json: {
      title: "Fix camera",
      status: "todo"
    }
  });

  assert.throws(
    () => store.createActionRun(workspace.id, {
      action_type_id: actionType.id,
      target_object_id: task.id,
      input_json: {}
    }),
    (error) => error.code === "action_target_type_mismatch"
  );
});

test("updateObjectInstance merges properties and validates schema", () => {
  const store = createOntologyStore({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  const workspace = store.createWorkspace({ name: "Game Studio" });
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      required: ["title", "status"],
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["open", "resolved"] },
        severity: { type: "integer" }
      }
    }
  });
  const bug = store.createObjectInstance(workspace.id, {
    object_type_id: bugType.id,
    properties_json: {
      title: "Camera clips through wall",
      status: "open",
      severity: 2
    }
  });
  const updated = store.updateObjectInstance(workspace.id, bug.id, {
    properties_json: {
      status: "resolved"
    }
  });

  assert.deepEqual(updated.properties_json, {
    title: "Camera clips through wall",
    status: "resolved",
    severity: 2
  });
  assert.equal(updated.updated_at, "2026-06-14T00:00:00.000Z");
});

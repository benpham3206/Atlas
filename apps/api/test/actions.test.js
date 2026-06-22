import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "../src/server.js";

async function startTestServer(t) {
  const server = createApiServer({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();

  return {
    status: response.status,
    payload
  };
}

async function seedBugWorkspace(baseUrl) {
  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_game_studio",
      name: "Game Studio"
    }
  });

  await requestJson(baseUrl, "/workspaces/workspace_game_studio/object-types", {
    method: "POST",
    body: {
      id: "object_type_bug",
      name: "Bug",
      schema_json: {
        type: "object",
        required: ["title", "status"],
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: ["open", "resolved"] },
          resolution_note: { type: "string" }
        }
      }
    }
  });

  await requestJson(baseUrl, "/workspaces/workspace_game_studio/objects", {
    method: "POST",
    body: {
      id: "object_bug_camera_clip",
      object_type_id: "object_type_bug",
      properties_json: {
        title: "Camera clips through wall",
        status: "open"
      }
    }
  });
}

test("creates, lists, and fetches ActionType", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugWorkspace(baseUrl);

  const created = await requestJson(baseUrl, "/workspaces/workspace_game_studio/action-types", {
    method: "POST",
    body: {
      id: "action_type_mark_bug_resolved",
      name: "Mark Bug Resolved",
      target_object_type_id: "object_type_bug",
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
    }
  });

  assert.equal(created.status, 201);
  assert.equal(created.payload.data.id, "action_type_mark_bug_resolved");
  assert.equal(created.payload.data.target_object_type_id, "object_type_bug");

  const list = await requestJson(baseUrl, "/workspaces/workspace_game_studio/action-types");

  assert.equal(list.status, 200);
  assert.equal(list.payload.data.length, 1);

  const fetched = await requestJson(baseUrl, "/workspaces/workspace_game_studio/action-types/action_type_mark_bug_resolved");

  assert.equal(fetched.status, 200);
  assert.equal(fetched.payload.data.name, "Mark Bug Resolved");
});

test("creates ActionRun with MarkBugResolved scenario", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugWorkspace(baseUrl);

  await requestJson(baseUrl, "/workspaces/workspace_game_studio/action-types", {
    method: "POST",
    body: {
      id: "action_type_mark_bug_resolved",
      name: "Mark Bug Resolved",
      target_object_type_id: "object_type_bug",
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
    }
  });

  const run = await requestJson(baseUrl, "/workspaces/workspace_game_studio/action-runs", {
    method: "POST",
    body: {
      id: "action_run_mark_resolved",
      action_type_id: "action_type_mark_bug_resolved",
      target_object_id: "object_bug_camera_clip",
      actor: "local_user",
      input_json: {
        resolution_note: "Fixed collision mesh"
      }
    }
  });

  assert.equal(run.status, 201);
  assert.equal(run.payload.data.status, "completed");
  assert.deepEqual(run.payload.data.before_properties_json, {
    title: "Camera clips through wall",
    status: "open"
  });
  assert.deepEqual(run.payload.data.after_properties_json, {
    title: "Camera clips through wall",
    status: "resolved",
    resolution_note: "Fixed collision mesh"
  });

  const object = await requestJson(baseUrl, "/workspaces/workspace_game_studio/objects/object_bug_camera_clip");

  assert.equal(object.status, 200);
  assert.deepEqual(object.payload.data.properties_json, run.payload.data.after_properties_json);

  const list = await requestJson(baseUrl, "/workspaces/workspace_game_studio/action-runs");

  assert.equal(list.status, 200);
  assert.equal(list.payload.data.length, 1);

  const fetched = await requestJson(baseUrl, "/workspaces/workspace_game_studio/action-runs/action_run_mark_resolved");

  assert.equal(fetched.status, 200);
  assert.equal(fetched.payload.data.action_type_id, "action_type_mark_bug_resolved");
});

test("creates ActionRun with complete task scenario", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_tasks",
      name: "Tasks Workspace"
    }
  });

  await requestJson(baseUrl, "/workspaces/workspace_tasks/object-types", {
    method: "POST",
    body: {
      id: "object_type_task",
      name: "Task",
      schema_json: {
        type: "object",
        required: ["title", "status"],
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: ["todo", "in_progress", "done"] }
        }
      }
    }
  });

  await requestJson(baseUrl, "/workspaces/workspace_tasks/objects", {
    method: "POST",
    body: {
      id: "object_task_camera",
      object_type_id: "object_type_task",
      properties_json: {
        title: "Fix camera collision",
        status: "todo"
      }
    }
  });

  await requestJson(baseUrl, "/workspaces/workspace_tasks/action-types", {
    method: "POST",
    body: {
      id: "action_type_complete_task",
      name: "Complete Task",
      target_object_type_id: "object_type_task",
      input_schema_json: {
        type: "object",
        properties: {}
      },
      effect_json: {
        type: "update_object_properties",
        set_properties_json: {
          status: "done"
        },
        copy_input_fields: []
      }
    }
  });

  const run = await requestJson(baseUrl, "/workspaces/workspace_tasks/action-runs", {
    method: "POST",
    body: {
      action_type_id: "action_type_complete_task",
      target_object_id: "object_task_camera",
      input_json: {}
    }
  });

  assert.equal(run.status, 201);
  assert.equal(run.payload.data.status, "completed");
  assert.deepEqual(run.payload.data.output_json, {
    status: "done"
  });

  const object = await requestJson(baseUrl, "/workspaces/workspace_tasks/objects/object_task_camera");

  assert.equal(object.payload.data.properties_json.status, "done");
});

test("PATCH /objects/:id validates schema", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugWorkspace(baseUrl);

  const invalidPatch = await requestJson(baseUrl, "/workspaces/workspace_game_studio/objects/object_bug_camera_clip", {
    method: "PATCH",
    body: {
      properties_json: {
        status: "invalid"
      }
    }
  });

  assert.equal(invalidPatch.status, 400);
  assert.equal(invalidPatch.payload.error, "object_validation_failed");

  const validPatch = await requestJson(baseUrl, "/workspaces/workspace_game_studio/objects/object_bug_camera_clip", {
    method: "PATCH",
    body: {
      properties_json: {
        status: "resolved",
        resolution_note: "Patched directly"
      }
    }
  });

  assert.equal(validPatch.status, 200);
  assert.deepEqual(validPatch.payload.data.properties_json, {
    title: "Camera clips through wall",
    status: "resolved",
    resolution_note: "Patched directly"
  });
});

test("cross-workspace action references fail", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugWorkspace(baseUrl);

  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_other",
      name: "Other Workspace"
    }
  });

  await requestJson(baseUrl, "/workspaces/workspace_game_studio/action-types", {
    method: "POST",
    body: {
      id: "action_type_mark_bug_resolved",
      name: "Mark Bug Resolved",
      target_object_type_id: "object_type_bug",
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
    }
  });

  await requestJson(baseUrl, "/workspaces/workspace_game_studio/action-runs", {
    method: "POST",
    body: {
      id: "action_run_mark_resolved",
      action_type_id: "action_type_mark_bug_resolved",
      target_object_id: "object_bug_camera_clip",
      input_json: {}
    }
  });

  const crossWorkspaceActionType = await requestJson(baseUrl, "/workspaces/workspace_other/action-types/action_type_mark_bug_resolved");

  assert.equal(crossWorkspaceActionType.status, 404);
  assert.equal(crossWorkspaceActionType.payload.error, "action_type_not_found");

  const crossWorkspaceActionRun = await requestJson(baseUrl, "/workspaces/workspace_other/action-runs/action_run_mark_resolved");

  assert.equal(crossWorkspaceActionRun.status, 404);
  assert.equal(crossWorkspaceActionRun.payload.error, "action_run_not_found");

  const crossWorkspaceRunCreate = await requestJson(baseUrl, "/workspaces/workspace_other/action-runs", {
    method: "POST",
    body: {
      action_type_id: "action_type_mark_bug_resolved",
      target_object_id: "object_bug_camera_clip",
      input_json: {}
    }
  });

  assert.equal(crossWorkspaceRunCreate.status, 404);
  assert.equal(crossWorkspaceRunCreate.payload.error, "action_type_not_found");
});

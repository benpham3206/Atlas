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

test("GET /health returns ok", async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "atlas-api",
    timestamp: "2026-06-14T00:00:00.000Z"
  });
});

test("unknown API route returns 404 JSON", async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/missing`);

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
});

test("creates Workspace, ObjectType, and ObjectInstance", async (t) => {
  const baseUrl = await startTestServer(t);

  const workspace = await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_game_studio",
      name: "Game Studio"
    }
  });

  assert.equal(workspace.status, 201);
  assert.equal(workspace.payload.data.id, "workspace_game_studio");

  const objectType = await requestJson(baseUrl, "/workspaces/workspace_game_studio/object-types", {
    method: "POST",
    body: {
      id: "object_type_bug",
      name: "Bug",
      description: "A defect found in a game build.",
      schema_json: {
        type: "object",
        required: ["title", "status"],
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: ["open", "resolved"] },
          severity: { type: "integer" }
        }
      }
    }
  });

  assert.equal(objectType.status, 201);
  assert.equal(objectType.payload.data.workspace_id, "workspace_game_studio");

  const objectInstance = await requestJson(baseUrl, "/workspaces/workspace_game_studio/objects", {
    method: "POST",
    body: {
      id: "object_bug_camera_clip",
      object_type_id: "object_type_bug",
      external_id: "BUG-1",
      properties_json: {
        title: "Camera clips through wall",
        status: "open",
        severity: 2
      }
    }
  });

  assert.equal(objectInstance.status, 201);
  assert.deepEqual(objectInstance.payload.data, {
    id: "object_bug_camera_clip",
    workspace_id: "workspace_game_studio",
    object_type_id: "object_type_bug",
    external_id: "BUG-1",
    properties_json: {
      title: "Camera clips through wall",
      status: "open",
      severity: 2
    },
    created_at: "2026-06-14T00:00:00.000Z",
    updated_at: "2026-06-14T00:00:00.000Z"
  });

  const objectList = await requestJson(baseUrl, "/workspaces/workspace_game_studio/objects");

  assert.equal(objectList.status, 200);
  assert.equal(objectList.payload.data.length, 1);
});

test("rejects ObjectInstance properties that do not match ObjectType schema", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_validation",
      name: "Validation Workspace"
    }
  });

  await requestJson(baseUrl, "/workspaces/workspace_validation/object-types", {
    method: "POST",
    body: {
      id: "object_type_task",
      name: "Task",
      schema_json: {
        type: "object",
        required: ["title", "status"],
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: ["todo", "done"] }
        }
      }
    }
  });

  const invalidObject = await requestJson(baseUrl, "/workspaces/workspace_validation/objects", {
    method: "POST",
    body: {
      object_type_id: "object_type_task",
      properties_json: {
        title: 123,
        status: "blocked"
      }
    }
  });

  assert.equal(invalidObject.status, 400);
  assert.equal(invalidObject.payload.error, "object_validation_failed");
  assert.deepEqual(invalidObject.payload.details, [
    "properties.title must be string",
    "properties.status must be one of: todo, done"
  ]);
});

test("enforces route-level workspace scoping", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_a",
      name: "Workspace A"
    }
  });
  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_b",
      name: "Workspace B"
    }
  });
  await requestJson(baseUrl, "/workspaces/workspace_a/object-types", {
    method: "POST",
    body: {
      id: "object_type_decision",
      name: "Decision",
      schema_json: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string" }
        }
      }
    }
  });

  const crossWorkspaceCreate = await requestJson(baseUrl, "/workspaces/workspace_b/objects", {
    method: "POST",
    body: {
      object_type_id: "object_type_decision",
      properties_json: {
        title: "Use vertical slice scope"
      }
    }
  });

  assert.equal(crossWorkspaceCreate.status, 404);
  assert.equal(crossWorkspaceCreate.payload.error, "object_type_not_found");

  await requestJson(baseUrl, "/workspaces/workspace_a/objects", {
    method: "POST",
    body: {
      id: "object_decision_scope",
      object_type_id: "object_type_decision",
      properties_json: {
        title: "Use vertical slice scope"
      }
    }
  });

  const crossWorkspaceRead = await requestJson(baseUrl, "/workspaces/workspace_b/objects/object_decision_scope");

  assert.equal(crossWorkspaceRead.status, 404);
  assert.equal(crossWorkspaceRead.payload.error, "object_instance_not_found");

  const workspaceBObjects = await requestJson(baseUrl, "/workspaces/workspace_b/objects");

  assert.equal(workspaceBObjects.status, 200);
  assert.deepEqual(workspaceBObjects.payload.data, []);
});

test("rejects mismatched body workspace_id", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_route",
      name: "Route Workspace"
    }
  });

  const result = await requestJson(baseUrl, "/workspaces/workspace_route/object-types", {
    method: "POST",
    body: {
      workspace_id: "workspace_body",
      name: "Risk",
      schema_json: {
        type: "object",
        properties: {}
      }
    }
  });

  assert.equal(result.status, 400);
  assert.equal(result.payload.error, "workspace_mismatch");
});

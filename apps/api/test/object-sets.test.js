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

async function seedBugObjects(baseUrl, workspaceId = "workspace_game_studio") {
  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: workspaceId,
      name: "Game Studio"
    }
  });
  await requestJson(baseUrl, `/workspaces/${workspaceId}/object-types`, {
    method: "POST",
    body: {
      id: "object_type_bug",
      name: "Bug",
      schema_json: {
        type: "object",
        required: ["title", "status"],
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: ["open", "resolved"] },
          severity: { type: "string", enum: ["low", "high"] }
        }
      }
    }
  });
  await requestJson(baseUrl, `/workspaces/${workspaceId}/objects`, {
    method: "POST",
    body: {
      id: "object_bug_camera_clip",
      object_type_id: "object_type_bug",
      properties_json: {
        title: "Camera clips through wall",
        status: "open",
        severity: "high"
      }
    }
  });
  await requestJson(baseUrl, `/workspaces/${workspaceId}/objects`, {
    method: "POST",
    body: {
      id: "object_bug_menu_typo",
      object_type_id: "object_type_bug",
      properties_json: {
        title: "Main menu typo",
        status: "resolved",
        severity: "low"
      }
    }
  });
}

test("creates ObjectSet and returns matching objects only", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugObjects(baseUrl);

  const objectSet = await requestJson(baseUrl, "/workspaces/workspace_game_studio/object-sets", {
    method: "POST",
    body: {
      id: "object_set_open_high_bugs",
      name: "Open high-severity bugs",
      object_type_id: "object_type_bug",
      filter_expression: {
        property_equals: {
          status: "open",
          severity: "high"
        }
      }
    }
  });

  assert.equal(objectSet.status, 201);
  assert.deepEqual(objectSet.payload.data.filter_expression, {
    property_equals: {
      status: "open",
      severity: "high"
    }
  });

  const objects = await requestJson(baseUrl, "/workspaces/workspace_game_studio/object-sets/object_set_open_high_bugs/objects");

  assert.equal(objects.status, 200);
  assert.equal(objects.payload.data.length, 1);
  assert.equal(objects.payload.data[0].id, "object_bug_camera_clip");
});

test("ObjectSet with empty filter returns all objects of its type", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugObjects(baseUrl);

  await requestJson(baseUrl, "/workspaces/workspace_game_studio/object-sets", {
    method: "POST",
    body: {
      id: "object_set_all_bugs",
      name: "All bugs",
      object_type_id: "object_type_bug"
    }
  });

  const objects = await requestJson(baseUrl, "/workspaces/workspace_game_studio/object-sets/object_set_all_bugs/objects");

  assert.equal(objects.status, 200);
  assert.deepEqual(objects.payload.data.map((object) => object.id), [
    "object_bug_camera_clip",
    "object_bug_menu_typo"
  ]);
});

test("rejects unsupported ObjectSet filters", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugObjects(baseUrl);

  const result = await requestJson(baseUrl, "/workspaces/workspace_game_studio/object-sets", {
    method: "POST",
    body: {
      name: "Invalid query",
      object_type_id: "object_type_bug",
      filter_expression: {
        or: []
      }
    }
  });

  assert.equal(result.status, 400);
  assert.equal(result.payload.error, "invalid_object_set_filter");
});

test("rejects ObjectSet object type outside workspace", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugObjects(baseUrl, "workspace_a");
  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_b",
      name: "Workspace B"
    }
  });

  const result = await requestJson(baseUrl, "/workspaces/workspace_b/object-sets", {
    method: "POST",
    body: {
      name: "Leaky set",
      object_type_id: "object_type_bug"
    }
  });

  assert.equal(result.status, 404);
  assert.equal(result.payload.error, "object_type_not_found");
});

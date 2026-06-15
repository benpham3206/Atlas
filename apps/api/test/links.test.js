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

async function seedBugAndBuild(baseUrl, workspaceId = "workspace_game_studio") {
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
      id: "object_type_build",
      name: "Build",
      schema_json: {
        type: "object",
        required: ["version"],
        properties: {
          version: { type: "string" }
        }
      }
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
          status: { type: "string", enum: ["open", "resolved"] }
        }
      }
    }
  });

  await requestJson(baseUrl, `/workspaces/${workspaceId}/objects`, {
    method: "POST",
    body: {
      id: "object_build_v001",
      object_type_id: "object_type_build",
      properties_json: {
        version: "v0.1"
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
        status: "open"
      }
    }
  });
}

async function createBugAffectsBuildLinkType(baseUrl, workspaceId = "workspace_game_studio") {
  return requestJson(baseUrl, `/workspaces/${workspaceId}/link-types`, {
    method: "POST",
    body: {
      id: "link_type_bug_affects_build",
      name: "Bug affects Build",
      from_object_type_id: "object_type_bug",
      to_object_type_id: "object_type_build",
      cardinality: "many_to_many",
      properties_schema: {
        type: "object",
        required: ["impact"],
        additionalProperties: false,
        properties: {
          impact: { type: "string", enum: ["low", "medium", "high"] }
        }
      }
    }
  });
}

test("creates LinkType and LinkInstance", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugAndBuild(baseUrl);

  const linkType = await createBugAffectsBuildLinkType(baseUrl);

  assert.equal(linkType.status, 201);
  assert.deepEqual(linkType.payload.data, {
    id: "link_type_bug_affects_build",
    workspace_id: "workspace_game_studio",
    name: "Bug affects Build",
    from_object_type_id: "object_type_bug",
    to_object_type_id: "object_type_build",
    cardinality: "many_to_many",
    properties_schema: {
      type: "object",
      required: ["impact"],
      additionalProperties: false,
      properties: {
        impact: { type: "string", enum: ["low", "medium", "high"] }
      }
    },
    created_at: "2026-06-14T00:00:00.000Z",
    updated_at: "2026-06-14T00:00:00.000Z"
  });

  const linkInstance = await requestJson(baseUrl, "/workspaces/workspace_game_studio/links", {
    method: "POST",
    body: {
      id: "link_bug_camera_clip_affects_build_v001",
      link_type_id: "link_type_bug_affects_build",
      from_object_id: "object_bug_camera_clip",
      to_object_id: "object_build_v001",
      properties_json: {
        impact: "high"
      }
    }
  });

  assert.equal(linkInstance.status, 201);
  assert.equal(linkInstance.payload.data.workspace_id, "workspace_game_studio");
  assert.equal(linkInstance.payload.data.from_object_id, "object_bug_camera_clip");
  assert.equal(linkInstance.payload.data.to_object_id, "object_build_v001");

  const links = await requestJson(baseUrl, "/workspaces/workspace_game_studio/links");

  assert.equal(links.status, 200);
  assert.equal(links.payload.data.length, 1);
});

test("rejects LinkType endpoints outside the workspace", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugAndBuild(baseUrl, "workspace_a");
  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_b",
      name: "Workspace B"
    }
  });

  const result = await requestJson(baseUrl, "/workspaces/workspace_b/link-types", {
    method: "POST",
    body: {
      name: "Bug affects Build",
      from_object_type_id: "object_type_bug",
      to_object_type_id: "object_type_build"
    }
  });

  assert.equal(result.status, 404);
  assert.equal(result.payload.error, "object_type_not_found");
});

test("rejects LinkInstance endpoint type mismatches", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugAndBuild(baseUrl);
  await createBugAffectsBuildLinkType(baseUrl);

  const result = await requestJson(baseUrl, "/workspaces/workspace_game_studio/links", {
    method: "POST",
    body: {
      link_type_id: "link_type_bug_affects_build",
      from_object_id: "object_build_v001",
      to_object_id: "object_bug_camera_clip",
      properties_json: {
        impact: "high"
      }
    }
  });

  assert.equal(result.status, 400);
  assert.equal(result.payload.error, "link_endpoint_type_mismatch");
  assert.deepEqual(result.payload.details, [
    "from_object_id must reference object_type_bug",
    "to_object_id must reference object_type_build"
  ]);
});

test("rejects invalid LinkInstance properties", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugAndBuild(baseUrl);
  await createBugAffectsBuildLinkType(baseUrl);

  const result = await requestJson(baseUrl, "/workspaces/workspace_game_studio/links", {
    method: "POST",
    body: {
      link_type_id: "link_type_bug_affects_build",
      from_object_id: "object_bug_camera_clip",
      to_object_id: "object_build_v001",
      properties_json: {
        impact: "critical"
      }
    }
  });

  assert.equal(result.status, 400);
  assert.equal(result.payload.error, "link_validation_failed");
  assert.deepEqual(result.payload.details, [
    "properties.impact must be one of: low, medium, high"
  ]);
});

test("rejects cross-workspace and self links", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugAndBuild(baseUrl, "workspace_a");
  await createBugAffectsBuildLinkType(baseUrl, "workspace_a");
  await requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id: "workspace_b",
      name: "Workspace B"
    }
  });

  const crossWorkspace = await requestJson(baseUrl, "/workspaces/workspace_b/links", {
    method: "POST",
    body: {
      link_type_id: "link_type_bug_affects_build",
      from_object_id: "object_bug_camera_clip",
      to_object_id: "object_build_v001"
    }
  });

  assert.equal(crossWorkspace.status, 404);
  assert.equal(crossWorkspace.payload.error, "link_type_not_found");

  const selfLink = await requestJson(baseUrl, "/workspaces/workspace_a/links", {
    method: "POST",
    body: {
      link_type_id: "link_type_bug_affects_build",
      from_object_id: "object_bug_camera_clip",
      to_object_id: "object_bug_camera_clip"
    }
  });

  assert.equal(selfLink.status, 400);
  assert.equal(selfLink.payload.error, "self_link_not_allowed");
});

test("returns one-hop inbound and outbound object links", async (t) => {
  const baseUrl = await startTestServer(t);
  await seedBugAndBuild(baseUrl);
  await createBugAffectsBuildLinkType(baseUrl);
  await requestJson(baseUrl, "/workspaces/workspace_game_studio/links", {
    method: "POST",
    body: {
      id: "link_bug_camera_clip_affects_build_v001",
      link_type_id: "link_type_bug_affects_build",
      from_object_id: "object_bug_camera_clip",
      to_object_id: "object_build_v001",
      properties_json: {
        impact: "high"
      }
    }
  });

  const bugLinks = await requestJson(baseUrl, "/workspaces/workspace_game_studio/objects/object_bug_camera_clip/links");
  const buildLinks = await requestJson(baseUrl, "/workspaces/workspace_game_studio/objects/object_build_v001/links");

  assert.equal(bugLinks.status, 200);
  assert.equal(bugLinks.payload.data.outbound.length, 1);
  assert.equal(bugLinks.payload.data.inbound.length, 0);
  assert.equal(buildLinks.status, 200);
  assert.equal(buildLinks.payload.data.inbound.length, 1);
  assert.equal(buildLinks.payload.data.outbound.length, 0);
});

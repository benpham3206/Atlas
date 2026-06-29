import test from "node:test";
import assert from "node:assert/strict";
import { createWebServer } from "../src/server.js";
import {
  bootstrapPersonalAtlas,
  completePersonalTask,
  createWorkspaceActionRun,
  createWorkspaceObjectType,
  fetchPersonalNextAction,
  fetchPersonalOverview,
  fetchWorkspaces,
  fetchWorkspaceActionTypes,
  fetchWorkspaceAuditEvents,
  fetchWorkspaceObject,
  fetchWorkspaceObjectLinks,
  fetchWorkspaceObjectTypes,
  fetchWorkspaceObjects,
  fetchWorkspaceLinks,
  fetchWorkspacePullRequestArtifacts,
  fetchWorkspaceReviewPackets
} from "../src/api-client.js";

const sampleOverview = {
  security_boundary: "Local in-memory personal state.",
  carbon_copy: {
    properties_json: {
      goal: "Build Atlas into a Palantir-class ontology platform",
      constraints: "Use Personal Atlas as the cockpit"
    }
  },
  project: {
    properties_json: {
      name: "Atlas self-hosting roadmap",
      goal: "Use Personal Atlas to build the public and enterprise Atlas versions"
    }
  },
  tasks: [
    {
      id: "object_task_harden_personal_loop",
      properties_json: { title: "Harden Personal Atlas self-hosting loop", status: "todo" }
    }
  ],
  blockers: {},
  next_action: {
    task_id: "object_task_harden_personal_loop",
    title: "Harden Personal Atlas self-hosting loop",
    acceptance_criteria: "Read endpoints are side-effect free",
    explanation: "Unblocked highest-priority task.",
    blockers: []
  }
};

async function startServer(t, overrides = {}) {
  const server = createWebServer({
    apiUrl: "http://api.example.test",
    fetchWorkspaces: async () => ({
      ok: true,
      data: [{ id: "workspace_personal", name: "Personal Atlas" }],
      error: null
    }),
    fetchWorkspaceObjectTypes: async () => ({
      ok: true,
      data: [],
      error: null
    }),
    fetchWorkspaceObjects: async () => ({
      ok: true,
      data: [],
      error: null
    }),
    fetchWorkspaceLinks: async () => ({
      ok: true,
      data: [],
      error: null
    }),
    fetchWorkspaceActionTypes: async () => ({
      ok: true,
      data: [],
      error: null
    }),
    ...overrides
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

test("api client handles API errors without throwing", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "not_found", message: "Overview unavailable" }), {
      status: 404,
      headers: { "content-type": "application/json" }
    });

  try {
    const overview = await fetchPersonalOverview("http://api.example.test");
    assert.equal(overview.ok, false);
    assert.equal(overview.data, null);
    assert.equal(overview.error.status, 404);

    const nextAction = await fetchPersonalNextAction("http://api.example.test");
    assert.equal(nextAction.ok, false);

    const workspaces = await fetchWorkspaces("http://api.example.test");
    assert.equal(workspaces.ok, false);

    const reviewPackets = await fetchWorkspaceReviewPackets("http://api.example.test", "workspace_personal");
    assert.equal(reviewPackets.ok, false);

    const pullRequestArtifacts = await fetchWorkspacePullRequestArtifacts("http://api.example.test", "workspace_personal");
    assert.equal(pullRequestArtifacts.ok, false);

    const auditEvents = await fetchWorkspaceAuditEvents("http://api.example.test", "workspace_personal");
    assert.equal(auditEvents.ok, false);

    const objectTypes = await fetchWorkspaceObjectTypes("http://api.example.test", "workspace_personal");
    assert.equal(objectTypes.ok, false);

    const objects = await fetchWorkspaceObjects("http://api.example.test", "workspace_personal");
    assert.equal(objects.ok, false);

    const object = await fetchWorkspaceObject("http://api.example.test", "workspace_personal", "object_1");
    assert.equal(object.ok, false);

    const objectLinks = await fetchWorkspaceObjectLinks("http://api.example.test", "workspace_personal", "object_1");
    assert.equal(objectLinks.ok, false);

    const links = await fetchWorkspaceLinks("http://api.example.test", "workspace_personal");
    assert.equal(links.ok, false);

    const actionTypes = await fetchWorkspaceActionTypes("http://api.example.test", "workspace_personal");
    assert.equal(actionTypes.ok, false);

    const actionRun = await createWorkspaceActionRun("http://api.example.test", "workspace_personal", {
      action_type_id: "action_type_complete",
      target_object_id: "object_task",
      input_json: {}
    });
    assert.equal(actionRun.ok, false);

    const createdObjectType = await createWorkspaceObjectType("http://api.example.test", "workspace_personal", {
      name: "Bug",
      schema_json: { type: "object", properties: {} }
    });
    assert.equal(createdObjectType.ok, false);

    const bootstrap = await bootstrapPersonalAtlas("http://api.example.test");
    assert.equal(bootstrap.ok, false);

    const complete = await completePersonalTask("http://api.example.test", "task_1", {
      artifact_uri: "artifacts/demo.md",
      evidence_note: "Verified locally"
    });
    assert.equal(complete.ok, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("api client handles network failures without throwing", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    throw new Error("connection refused");
  };

  try {
    const result = await fetchPersonalOverview("http://api.example.test");
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "network_error");
    assert.match(result.error.message, /connection refused/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("server renders bootstrap page when overview is unavailable", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: false,
      data: null,
      error: { status: 404, code: "not_found", message: "Personal workspace not bootstrapped" }
    })
  });

  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Bootstrap Personal Atlas/);
  assert.doesNotMatch(html, /Next action/);
});

test("server renders dashboard when overview is available", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: sampleOverview,
      error: null
    })
  });

  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /atlas\//);
  assert.match(html, /Mixture of Orchestrators Platform/);
  assert.match(html, /Next action/);
  assert.match(html, /Read endpoints are side-effect free/);
  assert.match(html, /action="\/tasks\/object_task_harden_personal_loop\/complete"/);
});

test("server renders workspace selector and uses selected workspace for scoped panels", async (t) => {
  const scopedWorkspaceIds = [];
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: {
        ...sampleOverview,
        workspace_id: "workspace_personal",
        workspace: { id: "workspace_personal", name: "Personal Atlas" }
      },
      error: null
    }),
    fetchWorkspaces: async () => ({
      ok: true,
      data: [
        { id: "workspace_personal", name: "Personal Atlas" },
        { id: "workspace_game_studio", name: "AAA Game Studio" }
      ],
      error: null
    }),
    fetchWorkspaceReviewPackets: async (_apiUrl, workspaceId) => {
      scopedWorkspaceIds.push(workspaceId);
      return { ok: true, data: [], error: null };
    },
    fetchWorkspacePullRequestArtifacts: async (_apiUrl, workspaceId) => {
      scopedWorkspaceIds.push(workspaceId);
      return { ok: true, data: [], error: null };
    },
    fetchWorkspaceAuditEvents: async (_apiUrl, workspaceId) => {
      scopedWorkspaceIds.push(workspaceId);
      return { ok: true, data: [], error: null };
    },
    fetchWorkspaceObjectTypes: async (_apiUrl, workspaceId) => {
      scopedWorkspaceIds.push(workspaceId);
      return { ok: true, data: [], error: null };
    },
    fetchWorkspaceObjects: async (_apiUrl, workspaceId) => {
      scopedWorkspaceIds.push(workspaceId);
      return { ok: true, data: [], error: null };
    },
    fetchWorkspaceLinks: async (_apiUrl, workspaceId) => {
      scopedWorkspaceIds.push(workspaceId);
      return { ok: true, data: [], error: null };
    },
    fetchWorkspaceActionTypes: async (_apiUrl, workspaceId) => {
      scopedWorkspaceIds.push(workspaceId);
      return { ok: true, data: [], error: null };
    }
  });

  const response = await fetch(`${baseUrl}/?view=workspaces&workspace_id=workspace_game_studio`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /AAA Game Studio/);
  assert.match(html, /href="\/\?view=workspaces&amp;workspace_id=workspace_game_studio"/);
  assert.match(html, /class="workspace-link is-selected"/);
  assert.deepEqual(scopedWorkspaceIds, [
    "workspace_game_studio",
    "workspace_game_studio",
    "workspace_game_studio",
    "workspace_game_studio",
    "workspace_game_studio",
    "workspace_game_studio",
    "workspace_game_studio"
  ]);
});

test("server renders ontology manager object types for selected workspace", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: {
        ...sampleOverview,
        workspace_id: "workspace_personal",
        workspace: { id: "workspace_personal", name: "Personal Atlas" }
      },
      error: null
    }),
    fetchWorkspaceObjectTypes: async (_apiUrl, workspaceId) => ({
      ok: true,
      data: [
        {
          id: "object_type_bug",
          workspace_id: workspaceId,
          name: "Bug",
          schema_json: {
            type: "object",
            required: ["title", "status"],
            properties: {
              title: { type: "string" },
              status: { type: "string" }
            }
          }
        }
      ],
      error: null
    })
  });

  const response = await fetch(`${baseUrl}/?view=ontology`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Ontology manager/);
  assert.match(html, /Bug/);
  assert.match(html, /object_type_bug/);
  assert.match(html, /title, status/);
});

test("server renders object instances for selected workspace", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: {
        ...sampleOverview,
        workspace_id: "workspace_personal",
        workspace: { id: "workspace_personal", name: "Personal Atlas" }
      },
      error: null
    }),
    fetchWorkspaceObjects: async (_apiUrl, workspaceId) => ({
      ok: true,
      data: [
        {
          id: "object_bug_camera_clip",
          workspace_id: workspaceId,
          object_type_id: "object_type_bug",
          external_id: "BUG-1",
          properties_json: {
            title: "Camera clips through wall",
            status: "open"
          }
        }
      ],
      error: null
    })
  });

  const response = await fetch(`${baseUrl}/?view=objects`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Objects/);
  assert.match(html, /object_bug_camera_clip/);
  assert.match(html, /object_type_bug/);
  assert.match(html, /Camera clips through wall/);
});

test("server renders selected object detail with one-hop links", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: {
        ...sampleOverview,
        workspace_id: "workspace_personal",
        workspace: { id: "workspace_personal", name: "Personal Atlas" }
      },
      error: null
    }),
    fetchWorkspaceObject: async (_apiUrl, workspaceId, objectId) => ({
      ok: true,
      data: {
        id: objectId,
        workspace_id: workspaceId,
        object_type_id: "object_type_bug",
        external_id: "BUG-1",
        properties_json: {
          title: "Camera clips through wall",
          status: "open"
        }
      },
      error: null
    }),
    fetchWorkspaceObjectLinks: async (_apiUrl, workspaceId, objectId) => ({
      ok: true,
      data: {
        object_id: objectId,
        inbound: [],
        outbound: [
          {
            id: "link_bug_affects_build",
            workspace_id: workspaceId,
            link_type_id: "link_type_bug_affects_build",
            from_object_id: objectId,
            to_object_id: "object_build_v001",
            properties_json: { impact: "high" }
          }
        ]
      },
      error: null
    })
  });

  const response = await fetch(
    `${baseUrl}/?view=object-detail&workspace_id=workspace_personal&object_id=object_bug_camera_clip`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Object detail/);
  assert.match(html, /object_bug_camera_clip/);
  assert.match(html, /Outbound links/);
  assert.match(html, /link_type_bug_affects_build/);
  assert.match(html, /object_build_v001/);
});

test("server renders graph explorer nodes and edges", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: {
        ...sampleOverview,
        workspace_id: "workspace_personal",
        workspace: { id: "workspace_personal", name: "Personal Atlas" }
      },
      error: null
    }),
    fetchWorkspaceObjects: async (_apiUrl, workspaceId) => ({
      ok: true,
      data: [
        {
          id: "object_bug_camera_clip",
          workspace_id: workspaceId,
          object_type_id: "object_type_bug",
          properties_json: { title: "Camera clips through wall" }
        },
        {
          id: "object_build_v001",
          workspace_id: workspaceId,
          object_type_id: "object_type_build",
          properties_json: { version: "v001" }
        }
      ],
      error: null
    }),
    fetchWorkspaceLinks: async (_apiUrl, workspaceId) => ({
      ok: true,
      data: [
        {
          id: "link_bug_affects_build",
          workspace_id: workspaceId,
          link_type_id: "link_type_bug_affects_build",
          from_object_id: "object_bug_camera_clip",
          to_object_id: "object_build_v001"
        }
      ],
      error: null
    })
  });

  const response = await fetch(`${baseUrl}/?view=graph`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Graph explorer/);
  assert.match(html, /Nodes/);
  assert.match(html, /Edges/);
  assert.match(html, /object_bug_camera_clip/);
  assert.match(html, /link_type_bug_affects_build/);
});

test("server renders action runner when action types and objects are available", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: {
        ...sampleOverview,
        workspace_id: "workspace_personal",
        workspace: { id: "workspace_personal", name: "Personal Atlas" }
      },
      error: null
    }),
    fetchWorkspaceObjects: async () => ({
      ok: true,
      data: [{ id: "object_task_1", object_type_id: "object_type_task", properties_json: { status: "todo" } }],
      error: null
    }),
    fetchWorkspaceActionTypes: async () => ({
      ok: true,
      data: [{ id: "action_type_complete_task", name: "Complete task", target_object_type_id: "object_type_task" }],
      error: null
    })
  });

  const response = await fetch(`${baseUrl}/?view=actions`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Action runner/);
  assert.match(html, /action_type_complete_task/);
  assert.match(html, /object_task_1/);
  assert.match(html, /Run action/);
});

test("server creates action run through selected workspace form", async (t) => {
  let created = null;
  const baseUrl = await startServer(t, {
    createWorkspaceActionRun: async (_apiUrl, workspaceId, input) => {
      created = { workspaceId, input };
      return {
        ok: true,
        data: { id: "action_run_001", workspace_id: workspaceId, status: "completed" },
        error: null
      };
    }
  });

  const response = await fetch(`${baseUrl}/workspaces/workspace_game_studio/action-runs`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      action_type_id: "action_type_complete_task",
      target_object_id: "object_task_1",
      actor: "forged_actor",
      principal_type: "agent",
      principal_id: "agent_editor",
      role: "owner",
      input_json: JSON.stringify({ resolution_note: "Verified" })
    }),
    redirect: "manual"
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/?workspace_id=workspace_game_studio&object_id=object_task_1");
  assert.deepEqual(created, {
    workspaceId: "workspace_game_studio",
    input: {
      action_type_id: "action_type_complete_task",
      target_object_id: "object_task_1",
      actor: "atlas_web",
      input_json: { resolution_note: "Verified" }
    }
  });
});

test("server rejects invalid action input JSON before API call", async (t) => {
  let createCalled = false;
  const baseUrl = await startServer(t, {
    createWorkspaceActionRun: async () => {
      createCalled = true;
      return { ok: true, data: {}, error: null };
    }
  });

  const response = await fetch(`${baseUrl}/workspaces/workspace_game_studio/action-runs`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      action_type_id: "action_type_complete_task",
      target_object_id: "object_task_1",
      input_json: "{not-json"
    }),
    redirect: "manual"
  });

  assert.equal(response.status, 303);
  assert.match(response.headers.get("location"), /input_json%20must%20be%20valid%20JSON/);
  assert.equal(createCalled, false);
});

test("server creates object type through selected workspace form", async (t) => {
  let created = null;
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: {
        ...sampleOverview,
        workspace_id: "workspace_personal",
        workspace: { id: "workspace_personal", name: "Personal Atlas" }
      },
      error: null
    }),
    createWorkspaceObjectType: async (_apiUrl, workspaceId, input) => {
      created = { workspaceId, input };
      return {
        ok: true,
        data: {
          id: input.id,
          workspace_id: workspaceId,
          name: input.name,
          schema_json: input.schema_json
        },
        error: null
      };
    }
  });

  const response = await fetch(`${baseUrl}/workspaces/workspace_game_studio/object-types`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      id: "object_type_bug",
      name: "Bug",
      description: "A defect",
      schema_json: JSON.stringify({
        type: "object",
        required: ["title"],
        properties: { title: { type: "string" } }
      })
    }),
    redirect: "manual"
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/?workspace_id=workspace_game_studio");
  assert.deepEqual(created, {
    workspaceId: "workspace_game_studio",
    input: {
      id: "object_type_bug",
      name: "Bug",
      description: "A defect",
      schema_json: {
        type: "object",
        required: ["title"],
        properties: { title: { type: "string" } }
      }
    }
  });
});

test("server rejects invalid object type schema JSON before API call", async (t) => {
  let createCalled = false;
  const baseUrl = await startServer(t, {
    createWorkspaceObjectType: async () => {
      createCalled = true;
      return { ok: true, data: {}, error: null };
    }
  });

  const response = await fetch(`${baseUrl}/workspaces/workspace_game_studio/object-types`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      id: "object_type_bug",
      name: "Bug",
      schema_json: "{not-json"
    }),
    redirect: "manual"
  });

  assert.equal(response.status, 303);
  assert.match(response.headers.get("location"), /schema_json%20must%20be%20valid%20JSON/);
  assert.equal(createCalled, false);
});

test("server renders review inbox when packets are available", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: {
        ...sampleOverview,
        workspace_id: "workspace_personal",
        workspace: { id: "workspace_personal", name: "Personal Atlas" }
      },
      error: null
    }),
    fetchWorkspaceReviewPackets: async (_apiUrl, workspaceId) => ({
      ok: true,
      data: [
        {
          id: "review_packet_001",
          workspace_id: workspaceId,
          pull_request_artifact_id: "pull_request_artifact_001",
          summary: "Agent loop ready for review",
          status: "review_ready",
          verification_commands: ["npm test"],
          critic_findings: ["No merge tool exposed"],
          safety_findings: ["Protected branch merge is pending"],
          pending_human_actions: ["protected_branch_merge"]
        }
      ],
      error: null
    }),
    fetchWorkspacePullRequestArtifacts: async (_apiUrl, workspaceId) => ({
      ok: true,
      data: [
        {
          id: "pull_request_artifact_001",
          workspace_id: workspaceId,
          repository: "benpham3206/Atlas",
          title: "Agent loop PR",
          head_branch: "codex/n4",
          base_branch: "main",
          external_url: "https://github.com/benpham3206/Atlas/pull/99",
          state: "open"
        }
      ],
      error: null
    })
  });

  const response = await fetch(`${baseUrl}/?view=review-inbox`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Review inbox/);
  assert.match(html, /Agent loop ready for review/);
  assert.match(html, /https:\/\/github.com\/benpham3206\/Atlas\/pull\/99/);
  assert.match(html, /protected_branch_merge/);
  assert.match(html, /No merge tool exposed/);
});

test("server renders audit timeline when audit events are available", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: {
        ...sampleOverview,
        workspace_id: "workspace_personal",
        workspace: { id: "workspace_personal", name: "Personal Atlas" }
      },
      error: null
    }),
    fetchWorkspaceAuditEvents: async (_apiUrl, workspaceId) => ({
      ok: true,
      data: [
        {
          id: "audit_event_001",
          workspace_id: workspaceId,
          sequence: 1,
          actor: "agent_coder",
          event_type: "agent.tool_call",
          resource_type: "agent_tool",
          resource_id: "github.open_pr",
          decision: "allow",
          event_hash: "hash_001",
          previous_event_hash: null,
          created_at: "2026-06-28T00:00:00.000Z"
        }
      ],
      error: null
    })
  });

  const response = await fetch(`${baseUrl}/?view=audit`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Audit timeline/);
  assert.match(html, /agent\.tool_call/);
  assert.match(html, /github\.open_pr/);
  assert.match(html, /hash_001/);
});

test("server renders audit timeline API error without hiding dashboard", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: {
        ...sampleOverview,
        workspace_id: "workspace_personal",
        workspace: { id: "workspace_personal", name: "Personal Atlas" }
      },
      error: null
    }),
    fetchWorkspaceAuditEvents: async () => ({
      ok: false,
      data: null,
      error: { status: 500, code: "internal_error", message: "Audit unavailable" }
    })
  });

  const response = await fetch(`${baseUrl}/?view=audit`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Audit timeline/);
  assert.match(html, /Audit unavailable/);
});

test("server handles API errors gracefully on bootstrap", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: false,
      data: null,
      error: { status: 404, code: "not_found", message: "Personal workspace not bootstrapped" }
    }),
    bootstrapPersonalAtlas: async () => ({
      ok: false,
      data: null,
      error: { status: 500, code: "internal_error", message: "Bootstrap failed in API" }
    })
  });

  const response = await fetch(`${baseUrl}/bootstrap`, { method: "POST" });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Bootstrap failed in API/);
});

test("server redirects with error when task completion fails", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: sampleOverview,
      error: null
    }),
    completePersonalTask: async () => ({
      ok: false,
      data: null,
      error: { status: 400, code: "validation_error", message: "artifact_uri is required" }
    })
  });

  const response = await fetch(`${baseUrl}/tasks/object_task_harden_personal_loop/complete`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "artifact_uri=&evidence_note=",
    redirect: "manual"
  });

  assert.equal(response.status, 303);
  assert.match(response.headers.get("location"), /\?error=/);

  const dashboard = await fetch(`${baseUrl}${response.headers.get("location")}`);
  const html = await dashboard.text();
  assert.match(html, /artifact_uri is required/);
});

test("server completes task and redirects home", async (t) => {
  let completed = false;

  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: sampleOverview,
      error: null
    }),
    completePersonalTask: async (_apiUrl, taskId, input) => {
      completed = true;
      assert.equal(taskId, "object_task_harden_personal_loop");
      assert.equal(input.artifact_uri, "artifacts/demo.md");
      assert.equal(input.evidence_note, "Loop verified");
      return { ok: true, data: { task_id: taskId }, error: null };
    }
  });

  const response = await fetch(`${baseUrl}/tasks/object_task_harden_personal_loop/complete`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "artifact_uri=artifacts%2Fdemo.md&evidence_note=Loop%20verified",
    redirect: "manual"
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/");
  assert.equal(completed, true);
});

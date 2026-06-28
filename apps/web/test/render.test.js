import test from "node:test";
import assert from "node:assert/strict";
import { createWebServer } from "../src/server.js";
import {
  bootstrapPersonalAtlas,
  completePersonalTask,
  fetchPersonalNextAction,
  fetchPersonalOverview
} from "../src/api-client.js";
import { renderBootstrapPage, renderPersonalDashboard } from "../src/render.js";

const sampleOverview = {
  security_boundary:
    "Local in-memory personal state. No authentication. Data resets on API restart.",
  carbon_copy: {
    id: "object_personal_carbon_copy",
    properties_json: {
      goal: "Build Atlas into a Palantir-class ontology platform",
      constraints: "Use Personal Atlas as the cockpit"
    }
  },
  project: {
    id: "object_personal_project_atlas",
    properties_json: {
      name: "Atlas self-hosting roadmap",
      goal: "Use Personal Atlas to build the public and enterprise Atlas versions"
    }
  },
  tasks: [
    {
      id: "object_task_harden_personal_loop",
      properties_json: {
        title: "Harden Personal Atlas self-hosting loop",
        status: "todo"
      }
    },
    {
      id: "object_task_runtime_foundation",
      properties_json: {
        title: "Add durable Atlas runtime foundation",
        status: "todo"
      }
    }
  ],
  blockers: {
    object_task_runtime_foundation: ["object_task_harden_personal_loop"]
  },
  next_action: {
    task_id: "object_task_harden_personal_loop",
    title: "Harden Personal Atlas self-hosting loop",
    acceptance_criteria: "Read endpoints are side-effect free, blocked tasks cannot complete, and every seeded task has done criteria",
    explanation: "Highest-priority unblocked task.",
    blockers: []
  }
};

test("bootstrap page renders form", () => {
  const html = renderBootstrapPage();

  assert.match(html, /<h1>Personal Atlas<\/h1>/);
  assert.match(html, /Bootstrap Personal Atlas/);
  assert.match(html, /<form method="post" action="\/bootstrap">/);
});

test("dashboard renders API-shaped next action", () => {
  const apiOverview = {
    security_boundary: "Local in-memory personal state. No authentication.",
    carbon_copy: {
      id: "object_personal_carbon_copy",
      properties_json: {
        goal: "Build Atlas into a Palantir-class ontology platform",
        constraints: "Use Personal Atlas as the cockpit"
      }
    },
    project: {
      id: "object_personal_project_atlas",
      properties_json: {
        name: "Atlas self-hosting roadmap",
        goal: "Use Personal Atlas to build the public and enterprise Atlas versions"
      }
    },
    tasks: [
      {
        id: "object_task_harden_personal_loop",
        properties_json: { title: "Harden Personal Atlas self-hosting loop", status: "todo" }
      },
      {
        id: "object_task_runtime_foundation",
        properties_json: { title: "Add durable Atlas runtime foundation", status: "todo" }
      }
    ],
    blockers: {
      object_task_runtime_foundation: [{ id: "object_task_harden_personal_loop", title: "Harden Personal Atlas self-hosting loop" }]
    },
    next_action: {
      task: {
        id: "object_task_harden_personal_loop",
        properties_json: {
          title: "Harden Personal Atlas self-hosting loop",
          acceptance_criteria: "Read endpoints are side-effect free, blocked tasks cannot complete, and every seeded task has done criteria"
        }
      },
      acceptance_criteria: "Read endpoints are side-effect free, blocked tasks cannot complete, and every seeded task has done criteria",
      explanation: "Dependencies satisfied.",
      blockers: []
    }
  };

  const html = renderPersonalDashboard(apiOverview);

  assert.match(html, /<form method="post" action="\/tasks\/object_task_harden_personal_loop\/complete">/);
  assert.match(html, /Harden Personal Atlas self-hosting loop/);
});

test("bootstrap page renders security boundary notice", () => {
  const html = renderBootstrapPage();

  assert.match(html, /Security boundary/);
  assert.match(html, /No authentication/);
});

test("dashboard renders next action, blockers, and complete form", () => {
  const html = renderPersonalDashboard(sampleOverview);

  assert.match(html, /Security boundary/);
  assert.match(html, /Build Atlas into a Palantir-class ontology platform/);
  assert.match(html, /Atlas self-hosting roadmap/);
  assert.match(html, /Harden Personal Atlas self-hosting loop/);
  assert.match(html, /object_task_harden_personal_loop/);
  assert.match(html, /object_task_runtime_foundation/);
  assert.match(html, /Blockers:/);
  assert.match(html, /Acceptance criteria/);
  assert.match(html, /Read endpoints are side-effect free, blocked tasks cannot complete, and every seeded task has done criteria/);
  assert.match(html, /<form method="post" action="\/tasks\/object_task_harden_personal_loop\/complete">/);
  assert.match(html, /name="artifact_uri"/);
  assert.match(html, /name="evidence_note"/);
});

test("dashboard renders workspace selector with selected state", () => {
  const html = renderPersonalDashboard(sampleOverview, {
    workspaces: [
      { id: "workspace_personal", name: "Personal Atlas" },
      { id: "workspace_game_studio", name: "AAA Game Studio" }
    ],
    selectedWorkspaceId: "workspace_game_studio"
  });

  assert.match(html, /Workspace context/);
  assert.match(html, /Personal Atlas/);
  assert.match(html, /AAA Game Studio/);
  assert.match(html, /href="\/\?workspace_id=workspace_game_studio"/);
  assert.match(html, /class="workspace-link is-selected"/);
  assert.match(html, /Personal next-action completion remains bound to Personal Atlas/);
});

test("dashboard renders ontology manager object type inventory", () => {
  const html = renderPersonalDashboard(sampleOverview, {
    selectedWorkspaceId: "workspace_game_studio",
    objectTypes: [
      {
        id: "object_type_bug",
        workspace_id: "workspace_game_studio",
        name: "Bug",
        schema_json: {
          type: "object",
          required: ["title", "status"],
          properties: {
            title: { type: "string" },
            status: { type: "string" },
            severity: { type: "string" }
          }
        }
      }
    ]
  });

  assert.match(html, /Ontology manager/);
  assert.match(html, /Read-only object type inventory/);
  assert.match(html, /Bug/);
  assert.match(html, /object_type_bug/);
  assert.match(html, /title, status/);
  assert.match(html, /title, status, severity/);
  assert.match(html, /<form method="post" action="\/workspaces\/workspace_game_studio\/object-types">/);
  assert.match(html, /Create object type/);
  assert.match(html, /name="schema_json"/);
});

test("dashboard renders object instance list", () => {
  const html = renderPersonalDashboard(sampleOverview, {
    selectedWorkspaceId: "workspace_game_studio",
    objects: [
      {
        id: "object_bug_camera_clip",
        object_type_id: "object_type_bug",
        external_id: "BUG-1",
        properties_json: {
          title: "Camera clips through wall",
          status: "open",
          severity: 2
        }
      }
    ]
  });

  assert.match(html, /Objects/);
  assert.match(html, /object_bug_camera_clip/);
  assert.match(html, /object_type_bug/);
  assert.match(html, /BUG-1/);
  assert.match(html, /title: Camera clips through wall/);
  assert.match(html, /status: open/);
  assert.match(html, /severity: 2/);
  assert.match(html, /href="\/\?workspace_id=workspace_game_studio&amp;object_id=object_bug_camera_clip"/);
});

test("dashboard renders selected object detail and one-hop links", () => {
  const html = renderPersonalDashboard(sampleOverview, {
    selectedObject: {
      id: "object_bug_camera_clip",
      object_type_id: "object_type_bug",
      external_id: "BUG-1",
      properties_json: {
        title: "Camera clips through wall",
        status: "open"
      }
    },
    selectedObjectLinks: {
      object_id: "object_bug_camera_clip",
      inbound: [],
      outbound: [
        {
          id: "link_bug_affects_build",
          link_type_id: "link_type_bug_affects_build",
          from_object_id: "object_bug_camera_clip",
          to_object_id: "object_build_v001"
        }
      ]
    }
  });

  assert.match(html, /Object detail/);
  assert.match(html, /object_bug_camera_clip/);
  assert.match(html, /Properties:/);
  assert.match(html, /title: Camera clips through wall/);
  assert.match(html, /Outbound links/);
  assert.match(html, /link_type_bug_affects_build/);
  assert.match(html, /object_bug_camera_clip -> object_build_v001/);
  assert.match(html, /Inbound links/);
});

test("dashboard renders graph explorer nodes and edges", () => {
  const html = renderPersonalDashboard(sampleOverview, {
    selectedWorkspaceId: "workspace_game_studio",
    objects: [
      {
        id: "object_bug_camera_clip",
        object_type_id: "object_type_bug",
        properties_json: { title: "Camera clips through wall" }
      },
      {
        id: "object_build_v001",
        object_type_id: "object_type_build",
        properties_json: { version: "v001" }
      }
    ],
    links: [
      {
        id: "link_bug_affects_build",
        link_type_id: "link_type_bug_affects_build",
        from_object_id: "object_bug_camera_clip",
        to_object_id: "object_build_v001"
      }
    ]
  });

  assert.match(html, /Graph explorer/);
  assert.match(html, /Nodes/);
  assert.match(html, /Edges/);
  assert.match(html, /href="\/\?workspace_id=workspace_game_studio&amp;object_id=object_bug_camera_clip"/);
  assert.match(html, /object_type_build/);
  assert.match(html, /link_type_bug_affects_build/);
  assert.match(html, /object_bug_camera_clip -> object_build_v001/);
});

test("dashboard renders action runner form", () => {
  const html = renderPersonalDashboard(sampleOverview, {
    selectedWorkspaceId: "workspace_game_studio",
    objects: [
      {
        id: "object_task_1",
        object_type_id: "object_type_task",
        properties_json: { status: "todo" }
      }
    ],
    actionTypes: [
      {
        id: "action_type_complete_task",
        name: "Complete task",
        target_object_type_id: "object_type_task"
      }
    ]
  });

  assert.match(html, /Action runner/);
  assert.match(html, /Runs unsigned local ActionRun requests/);
  assert.match(html, /<form method="post" action="\/workspaces\/workspace_game_studio\/action-runs">/);
  assert.match(html, /action_type_complete_task/);
  assert.match(html, /object_task_1/);
  assert.doesNotMatch(html, /name="principal_type"/);
  assert.doesNotMatch(html, /name="principal_id"/);
  assert.doesNotMatch(html, /name="role"/);
  assert.match(html, /Run action/);
});

test("dashboard renders review inbox packet and pending human action", () => {
  const html = renderPersonalDashboard(sampleOverview, {
    reviewPackets: [
      {
        id: "review_packet_001",
        pull_request_artifact_id: "pull_request_artifact_001",
        summary: "Review-ready agent branch",
        status: "review_ready",
        verification_commands: ["npm test"],
        critic_findings: ["No merge tool exposed"],
        safety_findings: ["GoalContract blocks merge"],
        pending_human_actions: ["protected_branch_merge"]
      }
    ],
    pullRequestArtifacts: [
      {
        id: "pull_request_artifact_001",
        repository: "benpham3206/Atlas",
        title: "Agent branch",
        head_branch: "codex/n4",
        base_branch: "main",
        external_url: "https://github.com/benpham3206/Atlas/pull/99",
        state: "open"
      }
    ]
  });

  assert.match(html, /Review inbox/);
  assert.match(html, /Review-ready agent branch/);
  assert.match(html, /protected_branch_merge/);
  assert.match(html, /npm test/);
  assert.match(html, /No merge tool exposed/);
  assert.match(html, /GoalContract blocks merge/);
});

test("dashboard renders audit timeline events", () => {
  const html = renderPersonalDashboard(sampleOverview, {
    auditEvents: [
      {
        id: "audit_event_001",
        sequence: 1,
        actor: "agent_coder",
        event_type: "agent.tool_call",
        resource_type: "agent_tool",
        resource_id: "github.open_pr",
        decision: "allow",
        event_hash: "hash_001",
        previous_event_hash: null,
        created_at: "2026-06-28T00:00:00.000Z"
      },
      {
        id: "audit_event_002",
        sequence: 2,
        actor: "system",
        event_type: "review_packet.created",
        resource_type: "review_packet",
        resource_id: "review_packet_001",
        decision: "allow",
        event_hash: "hash_002",
        previous_event_hash: "hash_001",
        created_at: "2026-06-28T00:00:01.000Z"
      }
    ]
  });

  assert.match(html, /Audit timeline/);
  assert.match(html, /review_packet\.created/);
  assert.match(html, /agent\.tool_call/);
  assert.match(html, /hash_002/);
  assert.match(html, /process-local integrity/);
});

test("GET /health returns web ok", async (t) => {
  const server = createWebServer({
    now: () => "2026-06-14T00:00:00.000Z",
    apiUrl: "http://api.example.test"
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "atlas-web",
    timestamp: "2026-06-14T00:00:00.000Z"
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { atlasRoutes } from "../routes/atlas.js";

const mockKnowledge = vi.hoisted(() => ({
  getOverview: vi.fn(),
}));

vi.mock("../atlas/knowledge-service.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../atlas/knowledge-service.js")>();
  return {
    ...actual,
    atlasKnowledgeService: () => mockKnowledge,
  };
});

vi.mock("../atlas/goal-bridge.js", () => ({
  atlasGoalBridge: () => ({}),
}));

function standardAgentActor(): Express.Request["actor"] {
  return {
    type: "agent",
    agentId: "agent-1",
    companyId: "company-1",
    source: "agent_key",
    keyScope: { kind: "standard" },
  };
}

function taskBridgeAgentActor(): Express.Request["actor"] {
  return {
    type: "agent",
    agentId: "agent-1",
    companyId: "company-1",
    source: "agent_key",
    keyScope: {
      kind: "task_bridge",
      projectId: "11111111-1111-4111-8111-111111111111",
    },
  };
}

function atlasToolPostHandler() {
  const router = atlasRoutes({} as any) as any;
  const layer = router.stack.find((candidate: any) =>
    candidate.route?.path === "/companies/:companyId/atlas/tools/:tool" &&
    candidate.route?.methods?.post,
  );
  const handler = layer?.route?.stack?.[0]?.handle;
  if (typeof handler !== "function") {
    throw new Error("Atlas tool POST route handler not found");
  }
  return handler;
}

async function invokeAtlasTool(actor: Express.Request["actor"], tool: string) {
  let statusCode = 200;
  let body: unknown;
  const req = {
    actor,
    body: {},
    method: "POST",
    params: { companyId: "company-1", tool },
  } as Express.Request;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  };
  await atlasToolPostHandler()(req, res, (error?: unknown) => {
    throw error ?? new Error("Unexpected next() from Atlas tool route");
  });
  return { status: statusCode, body };
}

describe("Atlas tool route scope enforcement", () => {
  beforeEach(() => {
    mockKnowledge.getOverview.mockReset();
    mockKnowledge.getOverview.mockResolvedValue({
      workspace_id: "company-1",
      governed: true,
      record_counts: {},
      policies: {},
    });
  });

  it("allows a standard agent key to dispatch a tool with a satisfied required scope", async () => {
    const res = await invokeAtlasTool(standardAgentActor(), "get_workspace_overview");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      workspace_id: "company-1",
      governed: true,
      record_counts: {},
      policies: {},
    });
    expect(mockKnowledge.getOverview).toHaveBeenCalledWith("company-1");
  });

  it("denies a scoped task-bridge agent key before tool dispatch", async () => {
    const res = await invokeAtlasTool(taskBridgeAgentActor(), "get_workspace_overview");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: "tool_scope_denied",
      message: "Atlas tool get_workspace_overview requires scope atlas.read",
      details: {
        component: "atlas.tool_router",
        root_cause: "request key scope does not satisfy the tool manifest required_scope",
        failure_type: "authorization",
        required_scope: "atlas.read",
        key_scope_kind: "task_bridge",
      },
    });
    expect(mockKnowledge.getOverview).not.toHaveBeenCalled();
  });
});

import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApiServer } from "../apps/api/src/server.js";
import { createFilePersistence } from "../apps/api/src/persistence.js";
import { createGitHubClientFromEnv, createGitHubPolicyFromEnv } from "../apps/api/src/github-client.js";

export const DEFAULT_OPERATIONAL_REPOSITORY = "benpham3206/Atlas";
export const DEFAULT_OPERATIONAL_BASE_BRANCH = "main";
export const DEFAULT_OPERATIONAL_HEAD_BRANCH = "codex/operational-smoke";

export async function api(baseUrl, method, path, { token, body } = {}) {
  const headers = { "content-type": "application/json" };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

export function requireOk(result, label) {
  if (result.status >= 200 && result.status < 300) {
    return result.payload.data;
  }

  const error = result.payload.error ?? "request_failed";
  const message = result.payload.message ?? JSON.stringify(result.payload);
  throw new Error(`${label} failed (${result.status} ${error}): ${message}`);
}

export function parseCsv(value, fallback = []) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function parseBoolean(value) {
  return value === "1" || value === "true";
}

export function repositoryAllowlist(env = process.env) {
  return parseCsv(env.GITHUB_ALLOWED_REPOSITORIES, [DEFAULT_OPERATIONAL_REPOSITORY]);
}

export function baseBranchAllowlist(env = process.env) {
  return parseCsv(env.GITHUB_ALLOWED_BASE_BRANCHES, [DEFAULT_OPERATIONAL_BASE_BRANCH]);
}

export function operationalConfig(env = process.env) {
  return {
    objective: env.OBJECTIVE ?? "Dogfood Atlas/MoO operational Tool Router loop",
    allowedActions: parseCsv(env.ALLOWED_ACTIONS, [
      "get_workspace_overview",
      "get_next_action",
      "generate_review_packet",
      "github.open_pr",
      "verify_audit_chain"
    ]),
    blockedActions: parseCsv(env.BLOCKED_ACTIONS, [
      "github.merge_pr",
      "protected_branch_merge",
      "deploy_production",
      "delete_workspace"
    ]),
    riskClass: env.RISK_CLASS ?? "medium",
    doneDefinition:
      env.DONE_DEFINITION ??
      "Agent can use scoped Tool Router calls, produce a review packet, dry-run a PR, and verify audit.",
    workspaceName: env.WORKSPACE_NAME ?? "Atlas Operational Dogfood",
    workspaceId: env.WORKSPACE_ID ?? "workspace_operational_dogfood",
    agentName: env.AGENT_NAME ?? "Operational Dogfood Agent",
    role: env.ATLAS_AGENT_ROLE ?? "editor",
    ttlSeconds: Number.parseInt(env.ATLAS_DELEGATION_TTL_SECONDS ?? "3600", 10),
    repository: env.GITHUB_REPOSITORY ?? repositoryAllowlist(env)[0],
    baseBranch: env.GITHUB_BASE_BRANCH ?? baseBranchAllowlist(env)[0],
    headBranch: env.GITHUB_HEAD_BRANCH ?? DEFAULT_OPERATIONAL_HEAD_BRANCH
  };
}

export async function startEphemeralApi({ dataFilePrefix = "atlas-operational", env = process.env } = {}) {
  const dataFile = join(tmpdir(), `${dataFilePrefix}-${process.pid}.json`);
  const persistence = createFilePersistence(dataFile);
  const envPolicy = createGitHubPolicyFromEnv(env);
  const githubPolicy = {
    allowed_repositories:
      envPolicy.allowed_repositories.length > 0 ? envPolicy.allowed_repositories : repositoryAllowlist(env),
    allowed_base_branches:
      envPolicy.allowed_base_branches.length > 0 ? envPolicy.allowed_base_branches : baseBranchAllowlist(env),
    dry_run: envPolicy.dry_run || parseBoolean(env.GITHUB_DRY_RUN)
  };
  const server = createApiServer({
    persistence,
    githubClient: createGitHubClientFromEnv(env),
    githubPolicy
  });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address();
  return {
    server,
    dataFile,
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      rmSync(dataFile, { force: true });
    }
  };
}

export async function bootstrapOperationalSession(baseUrl, options = {}) {
  const config = { ...operationalConfig(), ...options };
  const workspace = await createOrGet(
    baseUrl,
    "workspace",
    "/workspaces",
    `/workspaces/${config.workspaceId}`,
    { id: config.workspaceId, name: config.workspaceName }
  );
  const taskType = await createOrGet(
    baseUrl,
    "task type",
    `/workspaces/${workspace.id}/object-types`,
    `/workspaces/${workspace.id}/object-types/object_type_operational_task`,
    {
      id: "object_type_operational_task",
      name: "Operational Task",
      schema_json: {
        type: "object",
        required: ["title", "status", "priority", "acceptance_criteria"],
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: ["todo", "done"] },
          priority: { type: "integer" },
          acceptance_criteria: { type: "string" }
        }
      }
    }
  );
  const task = await createOrGet(
    baseUrl,
    "operational task",
    `/workspaces/${workspace.id}/objects`,
    `/workspaces/${workspace.id}/objects/object_task_operational_loop`,
    {
      id: "object_task_operational_loop",
      object_type_id: taskType.id,
      properties_json: {
        title: "Run the operational Tool Router loop",
        status: "todo",
        priority: 1,
        acceptance_criteria:
          "GoalContract, delegation, review packet, dry-run PR artifact, and audit verification all exist"
      }
    }
  );
  const blocksLink = await createOrGet(
    baseUrl,
    "blocks link type",
    `/workspaces/${workspace.id}/link-types`,
    `/workspaces/${workspace.id}/link-types/link_type_operational_blocks`,
    {
      id: "link_type_operational_blocks",
      name: "blocks",
      from_object_type_id: taskType.id,
      to_object_type_id: taskType.id
    }
  );
  const goalContract = requireOk(
    await api(baseUrl, "POST", `/workspaces/${workspace.id}/goal-contracts`, {
      body: {
        objective: config.objective,
        allowed_actions: config.allowedActions,
        blocked_actions: config.blockedActions,
        risk_class: config.riskClass,
        done_definition: config.doneDefinition,
        next_action_json: {
          task_object_type_id: taskType.id,
          blocks_link_type_id: blocksLink.id
        }
      }
    }),
    "create GoalContract"
  );
  const agent = requireOk(
    await api(baseUrl, "POST", "/agents", {
      body: { display_name: config.agentName }
    }),
    "create agent"
  );
  const delegation = requireOk(
    await api(baseUrl, "POST", `/workspaces/${workspace.id}/agent-delegations`, {
      body: {
        agent_id: agent.id,
        role: config.role,
        scopes: ["atlas.read", "atlas.act", "github.pr:create"],
        allowed_tools: config.allowedActions,
        goal_contract_id: goalContract.id,
        ttl_seconds: config.ttlSeconds
      }
    }),
    "create delegation"
  );

  return {
    workspace,
    taskType,
    task,
    blocksLink,
    goalContract,
    agent,
    delegation,
    config
  };
}

async function createOrGet(baseUrl, label, createPath, getPath, body) {
  const created = await api(baseUrl, "POST", createPath, { body });

  if (created.status >= 200 && created.status < 300) {
    return created.payload.data;
  }

  if (created.status !== 409) {
    return requireOk(created, `create ${label}`);
  }

  return requireOk(await api(baseUrl, "GET", getPath), `get existing ${label}`);
}

export function connectionKit(session, baseUrl) {
  const curl = [
    "curl -sS -X POST \"$ATLAS_API_URL/agent/tools/get_workspace_overview\"",
    "  -H \"authorization: Bearer $ATLAS_DELEGATION_ID\"",
    "  -H \"content-type: application/json\"",
    "  -d '{}'"
  ].join(" \\\n");
  const mcpConfig = {
    mcpServers: {
      atlas: {
        command: "node",
        args: ["scripts/atlas-mcp-stdio.js"],
        env: {
          ATLAS_API_URL: baseUrl,
          ATLAS_DELEGATION_ID: session.delegation.id
        }
      }
    }
  };

  return {
    ATLAS_API_URL: baseUrl,
    ATLAS_DELEGATION_ID: session.delegation.id,
    workspace_id: session.workspace.id,
    goal_contract_id: session.goalContract.id,
    agent_id: session.agent.id,
    expires_at: session.delegation.expires_at,
    sample_curl: curl,
    cursor_mcp_config: mcpConfig
  };
}

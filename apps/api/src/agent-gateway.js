import { ApiError } from "./ontology-store.js";
import { selectNextActionForWorkspace } from "./next-action.js";

const SCOPE_READ = "atlas.read";
const SCOPE_ACT = "atlas.act";
const SCOPE_GITHUB_PR_CREATE = "github.pr:create";
const SCOPE_SLACK_READ = "slack.read";
const ALLOWED_PR_HEAD_BRANCH_PREFIXES = ["codex/", "agent/"];

export const AGENT_TOOLS = Object.freeze([
  {
    name: "get_workspace_overview",
    category: "read",
    required_scope: SCOPE_READ,
    description:
      "List object types, object counts, action types, and policy status for the MCP session delegation workspace (e.g. workspace_operational_dogfood). For workspace_personal tasks use personal.get_overview or personal.list_tasks — not this tool.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "query_object",
    category: "read",
    required_scope: SCOPE_READ,
    description: "Fetch a single object instance by id.",
    input_schema: {
      type: "object",
      required: ["object_id"],
      properties: { object_id: { type: "string" } }
    }
  },
  {
    name: "list_objects",
    category: "read",
    required_scope: SCOPE_READ,
    description: "List object instances, optionally filtered by object_type_id.",
    input_schema: {
      type: "object",
      properties: { object_type_id: { type: "string" } }
    }
  },
  {
    name: "search_records",
    category: "read",
    required_scope: SCOPE_READ,
    description: "Case-insensitive keyword search across object instance string properties.",
    input_schema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", minLength: 1 },
        object_type_id: { type: "string" }
      }
    }
  },
  {
    name: "traverse_graph",
    category: "read",
    required_scope: SCOPE_READ,
    description: "Return inbound and outbound link instances for an object (one hop).",
    input_schema: {
      type: "object",
      required: ["object_id"],
      properties: { object_id: { type: "string" } }
    }
  },
  {
    name: "get_available_actions",
    category: "read",
    required_scope: SCOPE_READ,
    description: "List action types annotated with whether this delegation's role is allowed to run them under policy.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "get_next_action",
    category: "read",
    required_scope: SCOPE_READ,
    description:
      "Select the highest-priority unblocked task in the MCP session delegation workspace (operational dogfood). For the personal five-task spine use personal.get_next_action or GET /personal/next-action.",
    input_schema: {
      type: "object",
      required: ["task_object_type_id", "blocks_link_type_id"],
      properties: {
        task_object_type_id: { type: "string" },
        blocks_link_type_id: { type: "string" },
        status_property: { type: "string" },
        done_value: { type: "string" },
        priority_property: { type: "string" }
      }
    }
  },
  {
    name: "run_action",
    category: "action",
    required_scope: SCOPE_ACT,
    description: "Execute a governed action run. Subject to workspace policy; denials are recorded and the object is not mutated.",
    input_schema: {
      type: "object",
      required: ["action_type_id", "target_object_id"],
      properties: {
        action_type_id: { type: "string" },
        target_object_id: { type: "string" },
        input_json: { type: "object" }
      }
    }
  },
  {
    name: "github.open_pr",
    category: "external_action",
    required_scope: SCOPE_GITHUB_PR_CREATE,
    description:
      "Open a GitHub pull request from an agent-owned branch namespace. No merge, force-push, or protected-branch write capability exists in this tool surface.",
    input_schema: {
      type: "object",
      required: ["repository", "title", "body", "head_branch"],
      properties: {
        repository: { type: "string" },
        title: { type: "string" },
        body: { type: "string" },
        head_branch: { type: "string" },
        base_branch: { type: "string" },
        dry_run: { type: "boolean" },
        draft: { type: "boolean" }
      }
    }
  },
  {
    name: "submit_artifact",
    category: "action",
    required_scope: SCOPE_ACT,
    description:
      "Record metadata for a file, URL, or generated artifact in the delegated workspace. This stores references only; it does not upload content.",
    input_schema: {
      type: "object",
      required: ["uri", "summary"],
      properties: {
        artifact_type: { type: "string", enum: ["file", "url", "generated"] },
        uri: { type: "string" },
        summary: { type: "string" },
        metadata: { type: "object" }
      }
    }
  },
  {
    name: "attach_evidence",
    category: "action",
    required_scope: SCOPE_ACT,
    description:
      "Attach an evidence note, optional source URI, and optional Artifact reference to an existing workspace subject.",
    input_schema: {
      type: "object",
      required: ["subject_type", "subject_id", "evidence_kind", "note"],
      properties: {
        subject_type: { type: "string" },
        subject_id: { type: "string" },
        evidence_kind: { type: "string" },
        note: { type: "string" },
        artifact_id: { type: "string" },
        source_uri: { type: "string" }
      }
    }
  },
  {
    name: "generate_review_packet",
    category: "action",
    required_scope: SCOPE_ACT,
    description:
      "Bundle changed files, verification commands, critic/safety findings, audit refs, and the pending human-only action for review.",
    input_schema: {
      type: "object",
      required: ["summary"],
      properties: {
        summary: { type: "string" },
        pull_request_artifact_id: { type: "string" },
        changed_files: { type: "array", items: { type: "string" } },
        verification_commands: { type: "array", items: { type: "string" } },
        critic_findings: { type: "array", items: { type: "string" } },
        safety_findings: { type: "array", items: { type: "string" } }
      }
    }
  },
  {
    name: "slack.get_channel_info",
    category: "external_read",
    required_scope: SCOPE_SLACK_READ,
    description:
      "Read Slack conversation metadata for an explicitly allowlisted channel. This tool has no Slack write capability.",
    input_schema: {
      type: "object",
      required: ["channel_id"],
      properties: {
        channel_id: { type: "string" },
        include_num_members: { type: "boolean" }
      }
    }
  },
  {
    name: "verify_audit_chain",
    category: "read",
    required_scope: SCOPE_READ,
    description: "Verify the integrity of the append-only, hash-chained audit log.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "list_goal_contracts",
    category: "read",
    required_scope: SCOPE_READ,
    description: "List GoalContracts in the delegated workspace (Paperclip goal alignment; read-only).",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "list_delegations",
    category: "read",
    required_scope: SCOPE_READ,
    description: "List agent delegations in the delegated workspace (Company hires; read-only).",
    input_schema: { type: "object", properties: {} }
  }
]);

const VERIFICATION_ORDER = Object.freeze([
  "resolve_delegation_token",
  "verify_delegation_status_and_expiry",
  "check_scope_grant",
  "check_tool_allowlist",
  "check_goal_contract_actions",
  "evaluate_workspace_policy_for_actions",
  "execute_tool_in_workspace_scope",
  "append_audit_event"
]);

export function getAgentManifest() {
  return {
    name: "Atlas Agent Gateway",
    description:
      "Discoverable, governed tool surface for agents. Every call is authorized against a scoped, expiring delegation and recorded in the append-only audit log.",
    auth: {
      type: "delegation_bearer",
      header: "authorization: Bearer <delegation_id>",
      note: "Local scoped bearer (workspace + role + scopes + allowed_tools + expiry). Maps to a signed JWT delegation in the target architecture; not yet cryptographically signed."
    },
    scopes: [SCOPE_READ, SCOPE_ACT, SCOPE_GITHUB_PR_CREATE, SCOPE_SLACK_READ],
    verification_order: VERIFICATION_ORDER,
    tools: AGENT_TOOLS.map((tool) => ({
      name: tool.name,
      category: tool.category,
      required_scope: tool.required_scope,
      description: tool.description,
      input_schema: tool.input_schema
    }))
  };
}

const TOOL_IMPLEMENTATIONS = {
  get_workspace_overview(store, delegation) {
    const workspaceId = delegation.workspace_id;
    const objectTypes = store.listObjectTypes(workspaceId);
    const actionTypes = store.listActionTypes(workspaceId);
    const policies = store.listPolicies(workspaceId);

    return {
      workspace: store.getWorkspace(workspaceId),
      object_types: objectTypes.map((objectType) => ({
        id: objectType.id,
        name: objectType.name,
        object_count: store.listObjectInstances(workspaceId, { object_type_id: objectType.id }).length
      })),
      action_types: actionTypes.map((actionType) => ({ id: actionType.id, name: actionType.name })),
      governed: policies.some((policy) => policy.status === "active"),
      active_policy_count: policies.filter((policy) => policy.status === "active").length
    };
  },

  query_object(store, delegation, input) {
    const objectId = requireField(input, "object_id");
    return store.getObjectInstance(delegation.workspace_id, objectId);
  },

  list_objects(store, delegation, input) {
    return store.listObjectInstances(delegation.workspace_id, {
      object_type_id: input.object_type_id ?? null
    });
  },

  search_records(store, delegation, input) {
    const query = requireField(input, "query").toLowerCase();
    const objects = store.listObjectInstances(delegation.workspace_id, {
      object_type_id: input.object_type_id ?? null
    });

    const matches = [];

    for (const object of objects) {
      const matchedFields = [];

      for (const [key, value] of Object.entries(object.properties_json)) {
        if (typeof value === "string" && value.toLowerCase().includes(query)) {
          matchedFields.push(key);
        }
      }

      if (matchedFields.length > 0) {
        matches.push({
          id: object.id,
          object_type_id: object.object_type_id,
          matched_fields: matchedFields,
          properties_json: object.properties_json
        });
      }
    }

    return { query: input.query, match_count: matches.length, matches };
  },

  traverse_graph(store, delegation, input) {
    const objectId = requireField(input, "object_id");
    return store.getObjectLinks(delegation.workspace_id, objectId);
  },

  get_available_actions(store, delegation) {
    const workspaceId = delegation.workspace_id;
    const actionTypes = store.listActionTypes(workspaceId);

    return actionTypes.map((actionType) => {
      const evaluation = store.evaluatePolicy(workspaceId, {
        role: delegation.role,
        action: "run_action",
        resource_type: actionType.target_object_type_id
      });

      return {
        id: actionType.id,
        name: actionType.name,
        target_object_type_id: actionType.target_object_type_id,
        input_schema_json: actionType.input_schema_json,
        allowed_for_role: evaluation.decision === "allow",
        decision_reason: evaluation.reason
      };
    });
  },

  get_next_action(store, delegation, input) {
    const nextActionInput = resolveNextActionInput(store, delegation, input);

    return selectNextActionForWorkspace(store, delegation.workspace_id, {
      taskObjectTypeId: requireField(nextActionInput, "task_object_type_id"),
      blocksLinkTypeId: requireField(nextActionInput, "blocks_link_type_id"),
      statusProperty: nextActionInput.status_property,
      doneValue: nextActionInput.done_value,
      priorityProperty: nextActionInput.priority_property
    });
  },

  run_action(store, delegation, input) {
    return store.createActionRun(delegation.workspace_id, {
      action_type_id: requireField(input, "action_type_id"),
      target_object_id: requireField(input, "target_object_id"),
      input_json: input.input_json ?? {},
      actor: delegation.agent_id,
      principal_type: "agent",
      principal_id: delegation.agent_id,
      role: delegation.role
    });
  },

  async "github.open_pr"(store, delegation, input, context) {
    let request;

    try {
      request = normalizeOpenPullRequestInput(input);
      const policy = normalizeGitHubPolicy(context.githubPolicy);
      assertGitHubTargetAllowed(request, policy);
      const dryRun = policy.dry_run || input.dry_run === true;

      if (dryRun) {
        recordGitHubOpenAttempt(store, delegation, request, "allow", {
          reason: "dry_run",
          dry_run: true
        });

        return store.createPullRequestArtifact(delegation.workspace_id, {
          ...request,
          actor: delegation.agent_id,
          goal_contract_id: delegation.goal_contract_id,
          provider: "github",
          external_id: "dry_run",
          external_url: `dry-run://github/${request.repository}/${request.head_branch}-to-${request.base_branch}`,
          state: "dry_run"
        });
      }

      const githubClient = context.githubClient;

      if (!githubClient || typeof githubClient.openPullRequest !== "function") {
        throw new ApiError(503, "github_client_unconfigured", "GitHub client is not configured for github.open_pr");
      }

      const external = await githubClient.openPullRequest({
        ...request,
        draft: input.draft !== false
      });

      recordGitHubOpenAttempt(store, delegation, request, "allow", {
        reason: "github_call_succeeded",
        dry_run: false,
        external_id: external.external_id ?? null,
        external_url: external.url
      });

      return store.createPullRequestArtifact(delegation.workspace_id, {
        ...request,
        actor: delegation.agent_id,
        goal_contract_id: delegation.goal_contract_id,
        provider: external.provider ?? "github",
        external_id: external.external_id ?? null,
        external_url: external.url,
        state: external.state ?? "open"
      });
    } catch (error) {
      const apiError = normalizeGitHubOpenError(error);
      recordGitHubOpenAttempt(store, delegation, request ?? input, "deny", {
        reason: normalizeGitHubAuditReason(apiError.code),
        dry_run: input.dry_run === true,
        error_message: getErrorMessage(error, apiError.message)
      });
      throw apiError;
    }
  },

  submit_artifact(store, delegation, input) {
    return store.createArtifact(delegation.workspace_id, {
      ...input,
      actor: delegation.agent_id,
      goal_contract_id: input.goal_contract_id ?? delegation.goal_contract_id
    });
  },

  attach_evidence(store, delegation, input) {
    return store.createEvidenceRecord(delegation.workspace_id, {
      ...input,
      actor: delegation.agent_id,
      goal_contract_id: input.goal_contract_id ?? delegation.goal_contract_id
    });
  },

  generate_review_packet(store, delegation, input) {
    const auditEventIds = store.listAuditEvents(delegation.workspace_id).map((event) => event.id);

    return store.createReviewPacket(delegation.workspace_id, {
      ...input,
      actor: delegation.agent_id,
      goal_contract_id: input.goal_contract_id ?? delegation.goal_contract_id,
      audit_event_ids: input.audit_event_ids ?? auditEventIds,
      pending_human_actions: input.pending_human_actions ?? ["protected_branch_merge"]
    });
  },

  async "slack.get_channel_info"(store, delegation, input, context) {
    let request;

    try {
      request = normalizeSlackChannelInfoInput(input);
      const policy = normalizeSlackPolicy(context.slackPolicy);
      assertSlackChannelAllowed(request, policy);
      const slackClient = context.slackClient;

      if (!slackClient || typeof slackClient.getChannelInfo !== "function") {
        throw new ApiError(503, "slack_client_unconfigured", "Slack client is not configured for slack.get_channel_info");
      }

      const result = await slackClient.getChannelInfo(request);
      recordSlackChannelInfoAttempt(store, delegation, request, "allow", {
        reason: "slack_call_succeeded"
      });
      return result;
    } catch (error) {
      const apiError = normalizeSlackReadError(error);
      recordSlackChannelInfoAttempt(store, delegation, request ?? input, "deny", {
        reason: normalizeSlackAuditReason(apiError.code),
        error_message: getErrorMessage(error, apiError.message)
      });
      throw apiError;
    }
  },

  verify_audit_chain(store) {
    return store.verifyAuditChain();
  },

  list_goal_contracts(store, delegation) {
    return store.listGoalContracts(delegation.workspace_id);
  },

  list_delegations(store, delegation) {
    return store.listAgentDelegations(delegation.workspace_id);
  }
};

export async function dispatchAgentTool(store, { delegationId, toolName, input }, context = {}) {
  const tool = AGENT_TOOLS.find((candidate) => candidate.name === toolName);

  if (!tool) {
    throw new ApiError(404, "unknown_tool", `Unknown agent tool: ${toolName}`, [
      { available_tools: AGENT_TOOLS.map((candidate) => candidate.name) }
    ]);
  }

  const delegation = store.authorizeAgentTool(delegationId, {
    tool: tool.name,
    required_scope: tool.required_scope
  });

  const result = await TOOL_IMPLEMENTATIONS[tool.name](store, delegation, input ?? {}, context);

  return {
    tool: tool.name,
    agent_id: delegation.agent_id,
    workspace_id: delegation.workspace_id,
    goal_contract_id: delegation.goal_contract_id,
    role: delegation.role,
    decision: "allow",
    result
  };
}

function requireField(input, field) {
  const value = input[field];

  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, "invalid_request", `${field} is required`);
  }

  return value.trim();
}

function resolveNextActionInput(store, delegation, input) {
  if (input.task_object_type_id && input.blocks_link_type_id) {
    return input;
  }

  if (!delegation.goal_contract_id) {
    return input;
  }

  const goalContract = store.getGoalContract(delegation.workspace_id, delegation.goal_contract_id);

  if (!goalContract.next_action_json) {
    return input;
  }

  return {
    ...goalContract.next_action_json,
    ...input
  };
}

function normalizeOpenPullRequestInput(input) {
  const repository = requireRepository(input, "repository");
  const title = requireField(input, "title");
  const body = requireField(input, "body");
  const headBranch = requireBranchName(input.head_branch, "head_branch");
  const baseBranch = requireBranchName(input.base_branch ?? "main", "base_branch");

  if (!ALLOWED_PR_HEAD_BRANCH_PREFIXES.some((prefix) => headBranch.startsWith(prefix))) {
    throw new ApiError(400, "branch_namespace_denied", `head_branch must start with one of: ${ALLOWED_PR_HEAD_BRANCH_PREFIXES.join(", ")}`);
  }

  return {
    repository,
    title,
    body,
    head_branch: headBranch,
    base_branch: baseBranch
  };
}

function normalizeGitHubPolicy(policy = {}) {
  return {
    allowed_repositories: normalizeStringList(policy.allowed_repositories),
    allowed_base_branches: normalizeStringList(policy.allowed_base_branches),
    dry_run: policy.dry_run === true
  };
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string" && item.trim() !== "").map((item) => item.trim());
}

function assertGitHubTargetAllowed(request, policy) {
  if (!policy.allowed_repositories.includes(request.repository)) {
    throw new ApiError(403, "github_repository_not_allowed", `Repository is not allowlisted for github.open_pr: ${request.repository}`);
  }

  if (!policy.allowed_base_branches.includes(request.base_branch)) {
    throw new ApiError(403, "github_base_branch_not_allowed", `Base branch is not allowlisted for github.open_pr: ${request.base_branch}`);
  }
}

function recordGitHubOpenAttempt(store, delegation, request, decision, metadata) {
  const repository = typeof request.repository === "string" ? request.repository : null;
  const headBranch = typeof request.head_branch === "string" ? request.head_branch : null;
  const baseBranch = typeof request.base_branch === "string" ? request.base_branch : null;

  store.recordIntegrationAuditEvent(delegation.workspace_id, {
    actor: delegation.agent_id,
    event_type: "github.pull_request.open_attempted",
    resource_type: "github_repository",
    resource_id: repository,
    decision,
    metadata: {
      repository,
      head_branch: headBranch,
      base_branch: baseBranch,
      goal_contract_id: delegation.goal_contract_id,
      ...metadata
    }
  });
}

function normalizeGitHubOpenError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "unknown GitHub client error";
  return new ApiError(502, "github_call_failed", `GitHub call failed: ${message}`);
}

function normalizeSlackChannelInfoInput(input) {
  return {
    channel_id: requireSlackChannelId(input.channel_id, "channel_id"),
    include_num_members: input.include_num_members === true
  };
}

function normalizeSlackPolicy(policy = {}) {
  return {
    allowed_channel_ids: normalizeStringList(policy.allowed_channel_ids)
  };
}

function assertSlackChannelAllowed(request, policy) {
  if (!policy.allowed_channel_ids.includes(request.channel_id)) {
    throw new ApiError(403, "slack_channel_not_allowed", `Channel is not allowlisted for slack.get_channel_info: ${request.channel_id}`);
  }
}

function recordSlackChannelInfoAttempt(store, delegation, request, decision, metadata) {
  const channelId = typeof request.channel_id === "string" ? request.channel_id : null;

  store.recordIntegrationAuditEvent(delegation.workspace_id, {
    actor: delegation.agent_id,
    event_type: "slack.conversation.info_attempted",
    resource_type: "slack_channel",
    resource_id: channelId,
    decision,
    metadata: {
      channel_id: channelId,
      goal_contract_id: delegation.goal_contract_id,
      ...metadata
    }
  });
}

function normalizeSlackReadError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "unknown Slack client error";
  return new ApiError(502, "slack_call_failed", `Slack call failed: ${message}`);
}

function normalizeGitHubAuditReason(code) {
  if (code === "github_repository_not_allowed") {
    return "repository_not_allowed";
  }

  if (code === "github_base_branch_not_allowed") {
    return "base_branch_not_allowed";
  }

  return code;
}

function normalizeSlackAuditReason(code) {
  if (code === "slack_channel_not_allowed") {
    return "channel_not_allowed";
  }

  return code;
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function requireRepository(input, field) {
  const repository = requireField(input, field);

  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new ApiError(400, "invalid_request", `${field} must use owner/repo format`);
  }

  return repository;
}

function requireBranchName(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, "invalid_request", `${field} is required`);
  }

  const branchName = value.trim();

  if (
    branchName.includes("..") ||
    branchName.startsWith("/") ||
    branchName.endsWith("/") ||
    branchName.endsWith(".") ||
    /[\x00-\x20\x7f]/.test(branchName) ||
    /[~^:?*\[\]\\]/.test(branchName)
  ) {
    throw new ApiError(400, "invalid_request", `${field} is not a valid branch name`);
  }

  return branchName;
}

function requireSlackChannelId(value, field) {
  const channelId = requireField({ [field]: value }, field);

  if (!/^[CGD][A-Z0-9]+$/.test(channelId)) {
    throw new ApiError(400, "invalid_request", `${field} must be a Slack conversation id`);
  }

  return channelId;
}

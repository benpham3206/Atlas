import { ApiError } from "./ontology-store.js";
import { selectNextActionForWorkspace } from "./next-action.js";

const SCOPE_READ = "atlas.read";
const SCOPE_ACT = "atlas.act";

export const AGENT_TOOLS = Object.freeze([
  {
    name: "get_workspace_overview",
    category: "read",
    required_scope: SCOPE_READ,
    description: "List object types, object counts, action types, and policy status for the delegated workspace.",
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
    description: "Select the highest-priority unblocked task in the workspace, given a task object type and a blocks link type.",
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
    name: "verify_audit_chain",
    category: "read",
    required_scope: SCOPE_READ,
    description: "Verify the integrity of the append-only, hash-chained audit log.",
    input_schema: { type: "object", properties: {} }
  }
]);

const VERIFICATION_ORDER = Object.freeze([
  "resolve_delegation_token",
  "verify_delegation_status_and_expiry",
  "check_scope_grant",
  "check_tool_allowlist",
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
    scopes: [SCOPE_READ, SCOPE_ACT],
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
    return selectNextActionForWorkspace(store, delegation.workspace_id, {
      taskObjectTypeId: requireField(input, "task_object_type_id"),
      blocksLinkTypeId: requireField(input, "blocks_link_type_id"),
      statusProperty: input.status_property,
      doneValue: input.done_value,
      priorityProperty: input.priority_property
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

  verify_audit_chain(store) {
    return store.verifyAuditChain();
  }
};

export function dispatchAgentTool(store, { delegationId, toolName, input }) {
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

  const result = TOOL_IMPLEMENTATIONS[tool.name](store, delegation, input ?? {});

  return {
    tool: tool.name,
    agent_id: delegation.agent_id,
    workspace_id: delegation.workspace_id,
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

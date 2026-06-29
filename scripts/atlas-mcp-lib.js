import { resolveMcpConnection } from "./atlas-local-session.js";

export const DEFAULT_API_URL = "http://127.0.0.1:4000";
export const JSON_RPC_VERSION = "2.0";
export const MCP_COMPONENT = "atlas-mcp-stdio";

const API_TOOL_NAMES = new Set(["atlas.api.routes", "atlas.api.get", "atlas.api.post", "atlas.api.patch"]);

const API_ROUTE_CATALOG = Object.freeze([
  { method: "GET", path: "/", description: "API root metadata." },
  { method: "GET", path: "/health", description: "API health status." },
  { method: "GET", path: "/agent/manifest", description: "Agent Tool Router manifest." },
  { method: "POST", path: "/agent/tools/:tool", description: "Tool Router execution path. Prefer the named MCP tool when available." },
  { method: "GET", path: "/agents", description: "List agents." },
  { method: "POST", path: "/agents", description: "Create an agent." },
  { method: "GET", path: "/agents/:agent_id", description: "Fetch an agent." },
  { method: "GET", path: "/audit/verify", description: "Verify global audit-chain integrity." },
  { method: "GET", path: "/users", description: "List users." },
  { method: "POST", path: "/users", description: "Create a user." },
  { method: "GET", path: "/users/:user_id", description: "Fetch a user." },
  { method: "GET", path: "/workspaces", description: "List workspaces." },
  { method: "POST", path: "/workspaces", description: "Create a workspace." },
  { method: "GET", path: "/workspaces/:workspace_id", description: "Fetch a workspace." },
  { method: "GET", path: "/workspaces/:workspace_id/agent-delegations", description: "List agent delegations." },
  { method: "GET", path: "/workspaces/:workspace_id/agent-delegations/:delegation_id", description: "Fetch an agent delegation." },
  { method: "GET", path: "/workspaces/:workspace_id/goal-contracts", description: "List GoalContracts." },
  { method: "POST", path: "/workspaces/:workspace_id/goal-contracts", description: "Create a GoalContract." },
  { method: "GET", path: "/workspaces/:workspace_id/goal-contracts/:goal_contract_id", description: "Fetch a GoalContract." },
  { method: "GET", path: "/workspaces/:workspace_id/pull-request-artifacts", description: "List pull request artifacts." },
  { method: "GET", path: "/workspaces/:workspace_id/pull-request-artifacts/:artifact_id", description: "Fetch a pull request artifact." },
  { method: "GET", path: "/workspaces/:workspace_id/review-packets", description: "List review packets." },
  { method: "POST", path: "/workspaces/:workspace_id/review-packets", description: "Create a review packet." },
  { method: "GET", path: "/workspaces/:workspace_id/review-packets/:review_packet_id", description: "Fetch a review packet." },
  { method: "GET", path: "/workspaces/:workspace_id/artifacts", description: "List artifacts." },
  { method: "POST", path: "/workspaces/:workspace_id/artifacts", description: "Create an artifact." },
  { method: "GET", path: "/workspaces/:workspace_id/artifacts/:artifact_id", description: "Fetch an artifact." },
  { method: "GET", path: "/workspaces/:workspace_id/evidence-records", description: "List evidence records." },
  { method: "POST", path: "/workspaces/:workspace_id/evidence-records", description: "Create an evidence record." },
  { method: "GET", path: "/workspaces/:workspace_id/evidence-records/:evidence_id", description: "Fetch an evidence record." },
  { method: "GET", path: "/workspaces/:workspace_id/memberships", description: "List workspace memberships." },
  { method: "GET", path: "/workspaces/:workspace_id/memberships/:membership_id", description: "Fetch a workspace membership." },
  { method: "GET", path: "/workspaces/:workspace_id/policies", description: "List policies." },
  { method: "GET", path: "/workspaces/:workspace_id/policies/:policy_id", description: "Fetch a policy." },
  { method: "GET", path: "/workspaces/:workspace_id/permission-checks", description: "List permission checks." },
  { method: "POST", path: "/workspaces/:workspace_id/permission-checks", description: "Create a permission check." },
  { method: "GET", path: "/workspaces/:workspace_id/permission-checks/:permission_check_id", description: "Fetch a permission check." },
  { method: "POST", path: "/workspaces/:workspace_id/authorize", description: "Evaluate authorization for a request." },
  { method: "GET", path: "/workspaces/:workspace_id/audit-events", description: "List audit events." },
  { method: "GET", path: "/workspaces/:workspace_id/audit-events/:audit_event_id", description: "Fetch an audit event." },
  { method: "GET", path: "/workspaces/:workspace_id/object-types", description: "List object types." },
  { method: "POST", path: "/workspaces/:workspace_id/object-types", description: "Create an object type." },
  { method: "GET", path: "/workspaces/:workspace_id/object-types/:object_type_id", description: "Fetch an object type." },
  { method: "GET", path: "/workspaces/:workspace_id/link-types", description: "List link types." },
  { method: "POST", path: "/workspaces/:workspace_id/link-types", description: "Create a link type." },
  { method: "GET", path: "/workspaces/:workspace_id/link-types/:link_type_id", description: "Fetch a link type." },
  { method: "GET", path: "/workspaces/:workspace_id/object-sets", description: "List object sets." },
  { method: "POST", path: "/workspaces/:workspace_id/object-sets", description: "Create an object set." },
  { method: "GET", path: "/workspaces/:workspace_id/object-sets/:object_set_id", description: "Fetch an object set." },
  { method: "GET", path: "/workspaces/:workspace_id/object-sets/:object_set_id/objects", description: "List object set members." },
  { method: "GET", path: "/workspaces/:workspace_id/objects", description: "List object instances." },
  { method: "POST", path: "/workspaces/:workspace_id/objects", description: "Create an object instance." },
  { method: "GET", path: "/workspaces/:workspace_id/objects/:object_id", description: "Fetch an object instance." },
  { method: "PATCH", path: "/workspaces/:workspace_id/objects/:object_id", description: "Patch object instance properties." },
  { method: "GET", path: "/workspaces/:workspace_id/objects/:object_id/links", description: "List links for an object instance." },
  { method: "GET", path: "/workspaces/:workspace_id/action-types", description: "List action types." },
  { method: "POST", path: "/workspaces/:workspace_id/action-types", description: "Create an action type." },
  { method: "GET", path: "/workspaces/:workspace_id/action-types/:action_type_id", description: "Fetch an action type." },
  { method: "GET", path: "/workspaces/:workspace_id/action-runs", description: "List action runs." },
  { method: "POST", path: "/workspaces/:workspace_id/action-runs", description: "Create an action run." },
  { method: "GET", path: "/workspaces/:workspace_id/action-runs/:action_run_id", description: "Fetch an action run." },
  { method: "GET", path: "/workspaces/:workspace_id/links", description: "List link instances." },
  { method: "POST", path: "/workspaces/:workspace_id/links", description: "Create a link instance." },
  { method: "GET", path: "/workspaces/:workspace_id/links/:link_id", description: "Fetch a link instance." },
  { method: "POST", path: "/personal/bootstrap", description: "Bootstrap the Personal Atlas workspace." },
  { method: "GET", path: "/personal/overview", description: "Fetch Personal Atlas overview." },
  { method: "GET", path: "/personal/next-action", description: "Fetch Personal Atlas next action." },
  { method: "POST", path: "/personal/tasks/:task_id/complete", description: "Complete a Personal Atlas task." }
]);

const DIRECT_API_TOOLS = Object.freeze([
  {
    name: "atlas.api.routes",
    description: "List Atlas API routes exposed through the generic MCP API tools.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "atlas.api.get",
    description: "Call an allowlisted Atlas API GET route using the configured local MCP session.",
    inputSchema: {
      type: "object",
      required: ["path"],
      properties: {
        path: { type: "string" },
        query: { type: "object" }
      }
    }
  },
  {
    name: "atlas.api.post",
    description: "Call an allowlisted Atlas API POST route using the configured local MCP session.",
    inputSchema: {
      type: "object",
      required: ["path"],
      properties: {
        path: { type: "string" },
        body: { type: "object" }
      }
    }
  },
  {
    name: "atlas.api.patch",
    description: "Call an allowlisted Atlas API PATCH route using the configured local MCP session.",
    inputSchema: {
      type: "object",
      required: ["path"],
      properties: {
        path: { type: "string" },
        body: { type: "object" }
      }
    }
  }
]);

export function createStructuredError({ component, root_cause, failure_type, message, details }) {
  return {
    component,
    root_cause,
    failure_type,
    message,
    ...(details ? { details } : {})
  };
}

export function createMcpError({ root_cause, failure_type, message, details }) {
  return createStructuredError({
    component: MCP_COMPONENT,
    root_cause,
    failure_type,
    message,
    details
  });
}

export function mapAtlasApiFailure(status, payload = {}) {
  const code = payload.error ?? "request_failed";
  const message = payload.message ?? `Atlas request failed with status ${status}`;

  if (status === 401) {
    return createMcpError({
      root_cause: code,
      failure_type: "authorization",
      message
    });
  }

  if (status === 403) {
    return createMcpError({
      root_cause: code,
      failure_type: "policy",
      message
    });
  }

  if (status === 404) {
    return createMcpError({
      root_cause: code,
      failure_type: "validation",
      message
    });
  }

  return createMcpError({
    root_cause: code,
    failure_type: status >= 500 ? "dependency" : "validation",
    message
  });
}

export function mapFetchFailure(error, apiUrl) {
  return createMcpError({
    root_cause: "api_unreachable",
    failure_type: "dependency",
    message: `Atlas API is unreachable at ${apiUrl}`,
    details: {
      api_url: apiUrl,
      cause: error instanceof Error ? error.message : "fetch_failed"
    }
  });
}

export function mapLocalSessionFailure(error, sessionFile) {
  const message = error instanceof Error ? error.message : "Local Atlas session could not be read";
  const rootCause = message.startsWith("Unsupported local session version")
    ? "unsupported_local_session"
    : "invalid_local_session";

  return createMcpError({
    root_cause: rootCause,
    failure_type: "authorization",
    message,
    details: {
      session_file: sessionFile
    }
  });
}

export function resolveMcpConnectionOrThrow(env = process.env, options = {}) {
  try {
    return resolveMcpConnection(env, options);
  } catch (error) {
    throw mapLocalSessionFailure(error, options.sessionFile);
  }
}

export function resolveDelegationForToolCall(env = process.env, options = {}) {
  const connection = resolveMcpConnectionOrThrow(env, options);

  if (connection.delegationId) {
    if (connection.sessionExpired) {
      throw createMcpError({
        root_cause: "delegation_expired",
        failure_type: "authorization",
        message: "Local Atlas session delegation has expired",
        details: {
          session_file: connection.sessionFile,
          expires_at: connection.envelope?.expires_at
        }
      });
    }

    return connection;
  }

  if (connection.sessionMissing) {
    throw createMcpError({
      root_cause: "missing_local_session",
      failure_type: "authorization",
      message: "No local Atlas session file or ATLAS_DELEGATION_ID is configured for tools/call",
      details: {
        session_file: connection.sessionFile
      }
    });
  }

  throw createMcpError({
    root_cause: "missing_delegation",
    failure_type: "authorization",
    message: "A scoped delegation is required for tools/call",
    details: {
      session_file: connection.sessionFile
    }
  });
}

export async function atlasRequest(method, path, body, options = {}) {
  const env = options.env ?? process.env;
  const connection = resolveMcpConnectionOrThrow(env, options);
  const apiUrl = connection.apiUrl;
  const headers = {
    "content-type": "application/json"
  };

  if (options.delegationRequired) {
    const authorized = resolveDelegationForToolCall(env, options);
    headers.authorization = `Bearer ${authorized.delegationId}`;
  }

  let response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    throw mapFetchFailure(error, apiUrl);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw mapAtlasApiFailure(response.status, payload);
  }

  return payload.data ?? payload;
}

export async function atlasDirectApiRequest(method, rawPath, input = {}, options = {}) {
  const env = options.env ?? process.env;
  const connection = resolveDelegationForToolCall(env, options);
  const path = normalizeApiPath(rawPath);
  const pathWithQuery = method === "GET" ? appendQuery(path, input.query) : path;

  assertApiRouteAllowed(method, path, connection);

  return atlasRequest(method, pathWithQuery, method === "GET" ? undefined : input.body ?? {}, {
    env,
    delegationRequired: true,
    ...options
  });
}

export function listDirectApiRoutes() {
  return {
    tools: DIRECT_API_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    })),
    routes: API_ROUTE_CATALOG
  };
}

function normalizeApiPath(rawPath) {
  const path = requireString(rawPath, "path");

  if (!path.startsWith("/")) {
    throw createMcpError({
      root_cause: "invalid_api_path",
      failure_type: "validation",
      message: "API path must start with /"
    });
  }

  if (path.includes("://") || path.includes("\\") || path.includes("\0")) {
    throw createMcpError({
      root_cause: "invalid_api_path",
      failure_type: "validation",
      message: "API path must be a relative Atlas API path"
    });
  }

  const url = new URL(path, "http://atlas.local");
  return `${url.pathname}${url.search}`;
}

function appendQuery(path, query) {
  if (query === undefined || query === null) {
    return path;
  }

  if (!query || typeof query !== "object" || Array.isArray(query)) {
    throw createMcpError({
      root_cause: "invalid_api_query",
      failure_type: "validation",
      message: "query must be an object when provided"
    });
  }

  const url = new URL(path, "http://atlas.local");

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return `${url.pathname}${url.search}`;
}

function assertApiRouteAllowed(method, path, connection) {
  const normalizedMethod = method.toUpperCase();
  const pathname = new URL(path, "http://atlas.local").pathname;
  const matchedRoute = API_ROUTE_CATALOG.find((route) => route.method === normalizedMethod && routeMatches(route.path, pathname));

  if (!matchedRoute) {
    throw createMcpError({
      root_cause: "api_route_not_allowed",
      failure_type: "policy",
      message: `${normalizedMethod} ${pathname} is not exposed through Atlas MCP`,
      details: {
        allowed_methods: ["GET", "POST", "PATCH"]
      }
    });
  }

  const workspaceId = extractWorkspaceId(pathname);

  if (workspaceId && connection.envelope?.workspace_id && workspaceId !== connection.envelope.workspace_id) {
    throw createMcpError({
      root_cause: "workspace_scope_mismatch",
      failure_type: "authorization",
      message: "Atlas MCP API calls are confined to the workspace in the local session",
      details: {
        requested_workspace_id: workspaceId,
        session_workspace_id: connection.envelope.workspace_id
      }
    });
  }
}

function routeMatches(pattern, pathname) {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => segment.startsWith(":") || segment === pathSegments[index]);
}

function extractWorkspaceId(pathname) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "workspaces" && segments[1]) {
    return segments[1];
  }

  return null;
}

export function readMessage(buffer) {
  const headerEnd = buffer.indexOf("\r\n\r\n");

  if (headerEnd === -1) {
    return null;
  }

  const header = buffer.subarray(0, headerEnd).toString("utf8");
  const contentLengthLine = header
    .split("\r\n")
    .find((line) => line.toLowerCase().startsWith("content-length:"));

  if (!contentLengthLine) {
    throw new Error("MCP message missing Content-Length header");
  }

  const contentLength = Number.parseInt(contentLengthLine.split(":")[1].trim(), 10);

  if (!Number.isInteger(contentLength) || contentLength < 0) {
    throw new Error("Invalid MCP Content-Length header");
  }

  const bodyStart = headerEnd + 4;
  const bodyEnd = bodyStart + contentLength;

  if (buffer.length < bodyEnd) {
    return null;
  }

  return {
    message: JSON.parse(buffer.subarray(bodyStart, bodyEnd).toString("utf8")),
    nextOffset: bodyEnd
  };
}

export function encodeMessage(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;
}

export function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
  }

  return value.trim();
}

export async function handleMcpMessage(message, env = process.env, options = {}) {
  if (!message || typeof message !== "object") {
    return {
      kind: "error",
      id: null,
      code: -32600,
      message: "Invalid JSON-RPC message"
    };
  }

  if (message.id === undefined) {
    return { kind: "notification" };
  }

  try {
    if (message.method === "initialize") {
      return {
        kind: "result",
        id: message.id,
        result: {
          protocolVersion: message.params?.protocolVersion ?? "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "atlas",
            version: "0.0.0"
          }
        }
      };
    }

    if (message.method === "tools/list") {
      const manifest = await atlasRequest("GET", "/agent/manifest", undefined, { env, ...options });
      return {
        kind: "result",
        id: message.id,
        result: {
          tools: [
            ...manifest.tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.input_schema ?? { type: "object" }
            })),
            ...DIRECT_API_TOOLS
          ]
        }
      };
    }

    if (message.method === "tools/call") {
      const toolName = requireString(message.params?.name, "params.name");
      const toolArguments = message.params?.arguments ?? {};

      if (API_TOOL_NAMES.has(toolName)) {
        const result = await handleDirectApiToolCall(toolName, toolArguments, { env, ...options });
        return {
          kind: "result",
          id: message.id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        };
      }

      const result = await atlasRequest("POST", `/agent/tools/${encodeURIComponent(toolName)}`, toolArguments, {
        env,
        delegationRequired: true,
        ...options
      });
      return {
        kind: "result",
        id: message.id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    }

    return {
      kind: "error",
      id: message.id,
      code: -32601,
      message: `Method not found: ${message.method}`
    };
  } catch (error) {
    if (message.method === "tools/call" && isStructuredError(error)) {
      return {
        kind: "tool_error",
        id: message.id,
        payload: error
      };
    }

    return {
      kind: "error",
      id: message.id,
      code: -32603,
      message: error instanceof Error ? error.message : "Internal error"
    };
  }
}

async function handleDirectApiToolCall(toolName, toolArguments, options) {
  if (toolName === "atlas.api.routes") {
    return listDirectApiRoutes();
  }

  if (toolName === "atlas.api.get") {
    return atlasDirectApiRequest("GET", toolArguments.path, toolArguments, options);
  }

  if (toolName === "atlas.api.post") {
    return atlasDirectApiRequest("POST", toolArguments.path, toolArguments, options);
  }

  if (toolName === "atlas.api.patch") {
    return atlasDirectApiRequest("PATCH", toolArguments.path, toolArguments, options);
  }

  throw createMcpError({
    root_cause: "unknown_direct_api_tool",
    failure_type: "validation",
    message: `Unknown Atlas API MCP tool: ${toolName}`
  });
}

export function isStructuredError(error) {
  return (
    error &&
    typeof error === "object" &&
    typeof error.component === "string" &&
    typeof error.root_cause === "string" &&
    typeof error.failure_type === "string" &&
    typeof error.message === "string"
  );
}

export function formatToolErrorPayload(error) {
  if (isStructuredError(error)) {
    return error;
  }

  return createMcpError({
    root_cause: "mcp_tool_error",
    failure_type: "validation",
    message: error instanceof Error ? error.message : "Tool call failed"
  });
}

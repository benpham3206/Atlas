import { resolveMcpConnection } from "./atlas-local-session.js";

export const DEFAULT_API_URL = "http://127.0.0.1:4000";
export const JSON_RPC_VERSION = "2.0";
export const MCP_COMPONENT = "atlas-mcp-stdio";

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
          tools: manifest.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.input_schema ?? { type: "object" }
          }))
        }
      };
    }

    if (message.method === "tools/call") {
      const toolName = requireString(message.params?.name, "params.name");
      const toolArguments = message.params?.arguments ?? {};
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

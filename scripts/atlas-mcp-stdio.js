const DEFAULT_API_URL = "http://127.0.0.1:4000";
const JSON_RPC_VERSION = "2.0";

let inputBuffer = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  drainMessages().catch((error) => {
    writeError(null, -32603, error instanceof Error ? error.message : "Internal error");
  });
});

process.stdin.resume();

async function drainMessages() {
  while (true) {
    const parsed = readMessage(inputBuffer);

    if (!parsed) {
      return;
    }

    inputBuffer = inputBuffer.subarray(parsed.nextOffset);
    await handleMessage(parsed.message);
  }
}

function readMessage(buffer) {
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

async function handleMessage(message) {
  if (!message || typeof message !== "object") {
    writeError(null, -32600, "Invalid JSON-RPC message");
    return;
  }

  if (message.id === undefined) {
    return;
  }

  try {
    if (message.method === "initialize") {
      writeResult(message.id, {
        protocolVersion: message.params?.protocolVersion ?? "2024-11-05",
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "atlas",
          version: "0.0.0"
        }
      });
      return;
    }

    if (message.method === "tools/list") {
      const manifest = await atlasRequest("GET", "/agent/manifest");
      writeResult(message.id, {
        tools: manifest.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.input_schema ?? { type: "object" }
        }))
      });
      return;
    }

    if (message.method === "tools/call") {
      const toolName = requireString(message.params?.name, "params.name");
      const toolArguments = message.params?.arguments ?? {};
      const result = await atlasRequest("POST", `/agent/tools/${encodeURIComponent(toolName)}`, toolArguments, {
        delegationRequired: true
      });
      writeResult(message.id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      });
      return;
    }

    writeError(message.id, -32601, `Method not found: ${message.method}`);
  } catch (error) {
    if (message.method !== "tools/call") {
      writeError(message.id, -32603, error instanceof Error ? error.message : "Internal error");
      return;
    }

    writeToolError(message.id, error);
  }
}

async function atlasRequest(method, path, body, options = {}) {
  const apiUrl = (process.env.ATLAS_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
  const headers = {
    "content-type": "application/json"
  };

  if (options.delegationRequired) {
    const delegationId = process.env.ATLAS_DELEGATION_ID;

    if (!delegationId) {
      throw new Error("ATLAS_DELEGATION_ID is required for tools/call");
    }

    headers.authorization = `Bearer ${delegationId}`;
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.message ?? payload.error ?? `Atlas request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload.data ?? payload;
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
  }

  return value.trim();
}

function writeToolError(id, error) {
  const payload = error?.payload ?? {
    error: "mcp_tool_error",
    message: error instanceof Error ? error.message : "Tool call failed"
  };

  writeResult(id, {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2)
      }
    ]
  });
}

function writeResult(id, result) {
  writeMessage({
    jsonrpc: JSON_RPC_VERSION,
    id,
    result
  });
}

function writeError(id, code, message) {
  writeMessage({
    jsonrpc: JSON_RPC_VERSION,
    id,
    error: {
      code,
      message
    }
  });
}

function writeMessage(message) {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
}

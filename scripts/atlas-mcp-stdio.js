import {
  JSON_RPC_VERSION,
  encodeMessage,
  formatToolErrorPayload,
  handleMcpMessage,
  readMessage
} from "./atlas-mcp-lib.js";

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

    if (!parsed.message) {
      continue;
    }

    await dispatchMessage(parsed.message);
  }
}

async function dispatchMessage(message) {
  const outcome = await handleMcpMessage(message);

  if (outcome.kind === "notification") {
    return;
  }

  if (outcome.kind === "result") {
    writeResult(outcome.id, outcome.result);
    return;
  }

  if (outcome.kind === "tool_error") {
    writeToolError(outcome.id, outcome.payload);
    return;
  }

  writeError(outcome.id, outcome.code, outcome.message);
}

function writeToolError(id, payload) {
  writeResult(id, {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify(formatToolErrorPayload(payload), null, 2)
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
  process.stdout.write(encodeMessage(message));
}

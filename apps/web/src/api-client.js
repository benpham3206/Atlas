async function readJsonResponse(response) {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: "invalid_json",
      message: "API returned non-JSON response"
    };
  }
}

function buildResult(response, payload) {
  if (response.ok) {
    return {
      ok: true,
      data: payload?.data ?? payload,
      error: null
    };
  }

  return {
    ok: false,
    data: null,
    error: {
      status: response.status,
      code: payload?.error ?? "request_failed",
      message: payload?.message ?? `Request failed with status ${response.status}`,
      details: payload?.details ?? []
    }
  };
}

async function apiRequest(apiBaseUrl, path, options = {}) {
  const url = `${apiBaseUrl.replace(/\/$/, "")}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(options.headers ?? {})
      }
    });
    const payload = await readJsonResponse(response);
    return buildResult(response, payload);
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: {
        status: 0,
        code: "network_error",
        message: error instanceof Error ? error.message : "Network request failed"
      }
    };
  }
}

export async function fetchPersonalOverview(apiBaseUrl) {
  return apiRequest(apiBaseUrl, "/personal/overview");
}

export async function fetchPersonalNextAction(apiBaseUrl) {
  return apiRequest(apiBaseUrl, "/personal/next-action");
}

export async function fetchWorkspaceReviewPackets(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/review-packets`);
}

export async function fetchWorkspacePullRequestArtifacts(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/pull-request-artifacts`);
}

export async function bootstrapPersonalAtlas(apiBaseUrl) {
  return apiRequest(apiBaseUrl, "/personal/bootstrap", {
    method: "POST",
    body: "{}"
  });
}

export async function completePersonalTask(apiBaseUrl, taskId, input) {
  return apiRequest(apiBaseUrl, `/personal/tasks/${encodeURIComponent(taskId)}/complete`, {
    method: "POST",
    body: JSON.stringify({
      artifact_uri: input.artifact_uri,
      evidence_note: input.evidence_note
    })
  });
}

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

export async function fetchPersonalSessionContext(apiBaseUrl) {
  return apiRequest(apiBaseUrl, "/personal/session-context");
}

export async function fetchWorkspaces(apiBaseUrl) {
  return apiRequest(apiBaseUrl, "/workspaces");
}

export async function fetchWorkspaceReviewPackets(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/review-packets`);
}

export async function fetchWorkspacePullRequestArtifacts(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/pull-request-artifacts`);
}

export async function fetchWorkspaceAuditEvents(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/audit-events`);
}

export async function fetchWorkspaceObjectTypes(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/object-types`);
}

export async function createWorkspaceObjectType(apiBaseUrl, workspaceId, input) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/object-types`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function fetchWorkspaceObjects(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/objects`);
}

export async function fetchWorkspaceObject(apiBaseUrl, workspaceId, objectId) {
  return apiRequest(
    apiBaseUrl,
    `/workspaces/${encodeURIComponent(workspaceId)}/objects/${encodeURIComponent(objectId)}`
  );
}

export async function fetchWorkspaceObjectLinks(apiBaseUrl, workspaceId, objectId) {
  return apiRequest(
    apiBaseUrl,
    `/workspaces/${encodeURIComponent(workspaceId)}/objects/${encodeURIComponent(objectId)}/links`
  );
}

export async function fetchWorkspaceLinks(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/links`);
}

export async function fetchWorkspaceActionTypes(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/action-types`);
}

export async function createWorkspaceActionRun(apiBaseUrl, workspaceId, input) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/action-runs`, {
    method: "POST",
    body: JSON.stringify(input)
  });
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

export async function fetchAgentManifest(apiBaseUrl) {
  return apiRequest(apiBaseUrl, "/agent/manifest");
}

export async function fetchAgents(apiBaseUrl) {
  return apiRequest(apiBaseUrl, "/agents");
}

export async function fetchWorkspaceGoalContracts(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/goal-contracts`);
}

export async function fetchWorkspaceAgentDelegations(apiBaseUrl, workspaceId) {
  return apiRequest(apiBaseUrl, `/workspaces/${encodeURIComponent(workspaceId)}/agent-delegations`);
}

export async function revokeWorkspaceAgentDelegation(apiBaseUrl, workspaceId, delegationId, input = {}) {
  return apiRequest(
    apiBaseUrl,
    `/workspaces/${encodeURIComponent(workspaceId)}/agent-delegations/${encodeURIComponent(delegationId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "revoked", ...input })
    }
  );
}

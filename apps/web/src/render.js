export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pageShell(title, body) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f7f7f4;
        color: #171713;
      }

      body {
        margin: 0;
        min-height: 100vh;
        padding: 32px 24px 48px;
      }

      main {
        width: min(860px, 100%);
        margin: 0 auto;
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(32px, 6vw, 56px);
        line-height: 1;
        font-weight: 720;
      }

      h2 {
        margin: 0 0 12px;
        font-size: 22px;
        line-height: 1.2;
      }

      h3 {
        margin: 0 0 8px;
        font-size: 16px;
        line-height: 1.3;
      }

      p, li {
        margin: 0;
        color: #55554a;
        font-size: 16px;
        line-height: 1.55;
      }

      ul {
        margin: 0;
        padding-left: 20px;
      }

      section {
        margin-top: 28px;
        padding: 20px 22px;
        border: 1px solid #dddcd4;
        border-radius: 12px;
        background: #fff;
      }

      .notice {
        border-color: #d9c27a;
        background: #fff9e8;
      }

      .error {
        border-color: #d88;
        background: #fff3f3;
        color: #7a1f1f;
      }

      .next-action {
        border-color: #7aa8d9;
        background: #f0f7ff;
      }

      .muted {
        color: #77776c;
        font-size: 14px;
      }

      .task-list {
        list-style: none;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      .task-item {
        padding: 14px 16px;
        border: 1px solid #e4e3db;
        border-radius: 10px;
        background: #fafaf8;
      }

      .task-item.is-next {
        border-color: #7aa8d9;
        background: #f0f7ff;
      }

      .task-meta {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 6px;
        font-size: 14px;
        color: #66665c;
      }

      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        background: #ecebe4;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .review-list {
        list-style: none;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      .review-item,
      .audit-item {
        padding: 14px 16px;
        border: 1px solid #e4e3db;
        border-radius: 10px;
        background: #fafaf8;
      }

      .review-grid {
        display: grid;
        gap: 8px;
        margin-top: 8px;
      }

      .review-link {
        color: #174f88;
        overflow-wrap: anywhere;
      }

      .audit-list {
        list-style: none;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      .ontology-list {
        list-style: none;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      .ontology-item,
      .object-item {
        padding: 14px 16px;
        border: 1px solid #e4e3db;
        border-radius: 10px;
        background: #fafaf8;
      }

      .graph-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }

      .audit-hash {
        font-size: 12px;
        color: #66665c;
        overflow-wrap: anywhere;
      }

      .workspace-selector {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .workspace-link {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 0 12px;
        border: 1px solid #d4d3ca;
        border-radius: 8px;
        color: #171713;
        text-decoration: none;
        background: #fafaf8;
      }

      .workspace-link.is-selected {
        border-color: #171713;
        background: #171713;
        color: #f7f7f4;
      }

      form {
        display: grid;
        gap: 12px;
        margin-top: 12px;
      }

      label {
        display: grid;
        gap: 6px;
        font-size: 14px;
        color: #44443c;
      }

      input, select, textarea {
        font: inherit;
        padding: 10px 12px;
        border: 1px solid #cccbc3;
        border-radius: 8px;
        background: #fff;
        color: #171713;
      }

      textarea {
        min-height: 88px;
        resize: vertical;
      }

      button {
        justify-self: start;
        font: inherit;
        font-weight: 600;
        padding: 10px 16px;
        border: 0;
        border-radius: 8px;
        background: #171713;
        color: #f7f7f4;
        cursor: pointer;
      }

      button:hover {
        background: #2d2d28;
      }

      code {
        font: inherit;
        color: #171713;
      }
    </style>
  </head>
  <body>
    <main>
      ${body}
    </main>
  </body>
</html>`;
}

function renderErrorBanner(errorMessage) {
  if (!errorMessage) {
    return "";
  }

  return `<section class="error" role="alert">
    <h2>Error</h2>
    <p>${escapeHtml(errorMessage)}</p>
  </section>`;
}

function readProperty(record, key) {
  if (!record) {
    return undefined;
  }

  if (record[key] !== undefined) {
    return record[key];
  }

  return record.properties_json?.[key];
}

function taskTitle(task) {
  return readProperty(task, "title") ?? readProperty(task, "objective") ?? task.id;
}

function taskStatus(task) {
  return readProperty(task, "status") ?? "unknown";
}

function formatBlockerLabel(blocker) {
  if (typeof blocker === "string") {
    return blocker;
  }

  if (blocker && typeof blocker === "object") {
    return readProperty(blocker, "title") ?? blocker.id ?? String(blocker);
  }

  return String(blocker);
}

function resolveNextAction(nextAction) {
  if (!nextAction) {
    return null;
  }

  const task = nextAction.task ?? nextAction;

  return {
    id: task.id ?? nextAction.task_id,
    title: readProperty(task, "title") ?? nextAction.title ?? task.id,
    acceptance_criteria:
      nextAction.acceptance_criteria ?? readProperty(task, "acceptance_criteria"),
    explanation: nextAction.explanation,
    blockers: (nextAction.blockers ?? []).map(formatBlockerLabel)
  };
}

function formatBlockers(blockers) {
  if (!blockers || blockers.length === 0) {
    return "";
  }

  const items = blockers.map((blocker) => `<li>${escapeHtml(formatBlockerLabel(blocker))}</li>`).join("");
  return `<ul>${items}</ul>`;
}

function formatInlineList(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return "None";
  }

  return values.map((value) => escapeHtml(value)).join(", ");
}

function renderWorkspaceSelector({ workspaces = [], selectedWorkspaceId, error } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";

  if (workspaces.length === 0) {
    return `<section>
      <h2>Workspace context</h2>
      ${errorHtml}
      <p>No workspaces available.</p>
    </section>`;
  }

  const items = workspaces.map((workspace) => {
    const isSelected = workspace.id === selectedWorkspaceId;
    const name = workspace.name ?? workspace.id;
    const href = `/?workspace_id=${encodeURIComponent(workspace.id)}`;
    return `<a class="workspace-link${isSelected ? " is-selected" : ""}" href="${escapeHtml(href)}" aria-current="${isSelected ? "page" : "false"}">
      ${escapeHtml(name)}
    </a>`;
  });

  return `<section>
    <h2>Workspace context</h2>
    ${errorHtml}
    <div class="workspace-selector">
      ${items.join("")}
    </div>
    <p class="muted">Controls workspace-scoped review and audit panels. Personal next-action completion remains bound to Personal Atlas.</p>
  </section>`;
}

function schemaPropertyNames(schema) {
  if (!schema || typeof schema !== "object" || !schema.properties) {
    return [];
  }

  return Object.keys(schema.properties);
}

function renderObjectTypeForm(selectedWorkspaceId) {
  if (!selectedWorkspaceId) {
    return "";
  }

  const defaultSchema = JSON.stringify(
    {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" }
      }
    },
    null,
    2
  );
  const workspacePathId = encodeURIComponent(selectedWorkspaceId);

  return `<form method="post" action="/workspaces/${escapeHtml(workspacePathId)}/object-types">
    <label>
      Object type id
      <input name="id" placeholder="object_type_bug">
    </label>
    <label>
      Name
      <input name="name" required placeholder="Bug">
    </label>
    <label>
      Description
      <input name="description" placeholder="A tracked ontology object type.">
    </label>
    <label>
      Schema JSON
      <textarea name="schema_json" required>${escapeHtml(defaultSchema)}</textarea>
    </label>
    <button type="submit">Create object type</button>
  </form>`;
}

function renderOntologyManager({ objectTypes = [], selectedWorkspaceId, error } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";

  if (objectTypes.length === 0) {
    return `<section>
      <h2>Ontology manager</h2>
      ${errorHtml}
      <p>No object types defined for this workspace.</p>
      ${renderObjectTypeForm(selectedWorkspaceId)}
    </section>`;
  }

  const items = objectTypes.map((objectType) => {
    const required = formatInlineList(objectType.schema_json?.required);
    const propertyNames = formatInlineList(schemaPropertyNames(objectType.schema_json));

    return `<li class="ontology-item">
      <h3>${escapeHtml(objectType.name ?? objectType.id)}</h3>
      <div class="task-meta">
        <span>${escapeHtml(objectType.id)}</span>
        <span>${escapeHtml(objectType.workspace_id ?? "")}</span>
      </div>
      <div class="review-grid">
        <p><strong>Required:</strong> ${required}</p>
        <p><strong>Properties:</strong> ${propertyNames}</p>
      </div>
    </li>`;
  });

  return `<section>
    <h2>Ontology manager</h2>
    ${errorHtml}
    <p class="muted">Read-only object type inventory for the selected workspace.</p>
    <ul class="ontology-list">
      ${items.join("")}
    </ul>
    ${renderObjectTypeForm(selectedWorkspaceId)}
  </section>`;
}

function summarizeProperties(properties) {
  if (!properties || typeof properties !== "object") {
    return "None";
  }

  const pairs = Object.entries(properties).slice(0, 6);
  if (pairs.length === 0) {
    return "None";
  }

  return pairs
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join("; ");
}

function renderObjectList({ objects = [], selectedWorkspaceId, error } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";

  if (objects.length === 0) {
    return `<section>
      <h2>Objects</h2>
      ${errorHtml}
      <p>No object instances defined for this workspace.</p>
    </section>`;
  }

  const items = objects.map((object) => {
    const href = selectedWorkspaceId
      ? `/?workspace_id=${encodeURIComponent(selectedWorkspaceId)}&object_id=${encodeURIComponent(object.id)}`
      : null;
    const title = href
      ? `<a class="review-link" href="${escapeHtml(href)}">${escapeHtml(object.id)}</a>`
      : escapeHtml(object.id);

    return `<li class="object-item">
    <h3>${title}</h3>
    <div class="task-meta">
      <span class="badge">${escapeHtml(object.object_type_id ?? "unknown_type")}</span>
      <span>${escapeHtml(object.external_id ?? "no_external_id")}</span>
    </div>
    <p>${escapeHtml(summarizeProperties(object.properties_json))}</p>
  </li>`;
  });

  return `<section>
    <h2>Objects</h2>
    ${errorHtml}
    <ul class="ontology-list">
      ${items.join("")}
    </ul>
  </section>`;
}

function renderLinkItems(links) {
  if (!Array.isArray(links) || links.length === 0) {
    return "<li><p>None</p></li>";
  }

  return links.map((link) => `<li>
    <p><strong>${escapeHtml(link.link_type_id)}</strong>: ${escapeHtml(link.from_object_id)} -> ${escapeHtml(link.to_object_id)}</p>
  </li>`).join("");
}

function renderObjectDetail({ object, links, error } = {}) {
  if (!object && !error) {
    return "";
  }

  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";

  if (!object) {
    return `<section>
      <h2>Object detail</h2>
      ${errorHtml}
      <p>No object selected.</p>
    </section>`;
  }

  return `<section>
    <h2>Object detail</h2>
    ${errorHtml}
    <h3>${escapeHtml(object.id)}</h3>
    <div class="task-meta">
      <span class="badge">${escapeHtml(object.object_type_id ?? "unknown_type")}</span>
      <span>${escapeHtml(object.external_id ?? "no_external_id")}</span>
    </div>
    <div class="review-grid">
      <p><strong>Properties:</strong> ${escapeHtml(summarizeProperties(object.properties_json))}</p>
      <div>
        <h3>Outbound links</h3>
        <ul>${renderLinkItems(links?.outbound)}</ul>
      </div>
      <div>
        <h3>Inbound links</h3>
        <ul>${renderLinkItems(links?.inbound)}</ul>
      </div>
    </div>
  </section>`;
}

function renderGraphExplorer({ objects = [], links = [], selectedWorkspaceId, error } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";
  const nodeItems = objects.length === 0
    ? "<li><p>No nodes.</p></li>"
    : objects.map((object) => {
        const href = selectedWorkspaceId
          ? `/?workspace_id=${encodeURIComponent(selectedWorkspaceId)}&object_id=${encodeURIComponent(object.id)}`
          : null;
        const title = href
          ? `<a class="review-link" href="${escapeHtml(href)}">${escapeHtml(object.id)}</a>`
          : escapeHtml(object.id);
        return `<li><p>${title} <span class="badge">${escapeHtml(object.object_type_id ?? "unknown_type")}</span></p></li>`;
      }).join("");
  const edgeItems = links.length === 0
    ? "<li><p>No edges.</p></li>"
    : links.map((link) => `<li>
        <p><strong>${escapeHtml(link.link_type_id)}</strong>: ${escapeHtml(link.from_object_id)} -> ${escapeHtml(link.to_object_id)}</p>
      </li>`).join("");

  return `<section>
    <h2>Graph explorer</h2>
    ${errorHtml}
    <div class="graph-grid">
      <div>
        <h3>Nodes</h3>
        <ul>${nodeItems}</ul>
      </div>
      <div>
        <h3>Edges</h3>
        <ul>${edgeItems}</ul>
      </div>
    </div>
  </section>`;
}

function renderSelectOptions(records, valueKey, labelKey) {
  if (!Array.isArray(records) || records.length === 0) {
    return "";
  }

  return records.map((record) => {
    const value = record[valueKey];
    const label = record[labelKey] ?? value;
    return `<option value="${escapeHtml(value)}">${escapeHtml(label)} (${escapeHtml(value)})</option>`;
  }).join("");
}

function renderActionRunner({ actionTypes = [], objects = [], selectedWorkspaceId, error } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";

  if (!selectedWorkspaceId) {
    return "";
  }

  if (actionTypes.length === 0 || objects.length === 0) {
    return `<section>
      <h2>Action runner</h2>
      ${errorHtml}
      <p>Action runner needs at least one ActionType and one target object in this workspace.</p>
    </section>`;
  }

  return `<section>
    <h2>Action runner</h2>
    ${errorHtml}
    <p class="muted">Runs unsigned local ActionRun requests; governed workspaces require server-side authority.</p>
    <form method="post" action="/workspaces/${escapeHtml(encodeURIComponent(selectedWorkspaceId))}/action-runs">
      <label>
        Action type
        <select name="action_type_id" required>
          ${renderSelectOptions(actionTypes, "id", "name")}
        </select>
      </label>
      <label>
        Target object
        <select name="target_object_id" required>
          ${renderSelectOptions(objects, "id", "id")}
        </select>
      </label>
      <label>
        Input JSON
        <textarea name="input_json">{}</textarea>
      </label>
      <button type="submit">Run action</button>
    </form>
  </section>`;
}

function renderReviewInbox({ reviewPackets = [], pullRequestArtifacts = [], error } = {}) {
  const artifactById = new Map(pullRequestArtifacts.map((artifact) => [artifact.id, artifact]));
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";

  if (reviewPackets.length === 0 && pullRequestArtifacts.length === 0) {
    return `<section>
      <h2>Review inbox</h2>
      ${errorHtml}
      <p>No review packets are waiting.</p>
    </section>`;
  }

  const packetItems = reviewPackets.map((packet) => {
    const artifact = artifactById.get(packet.pull_request_artifact_id);
    const artifactLink = artifact?.external_url
      ? `<a class="review-link" href="${escapeHtml(artifact.external_url)}">${escapeHtml(artifact.external_url)}</a>`
      : "No PR artifact";

    return `<li class="review-item">
      <h3>${escapeHtml(packet.summary ?? packet.id)}</h3>
      <div class="task-meta">
        <span class="badge">${escapeHtml(packet.status ?? "review_ready")}</span>
        <span>${escapeHtml(packet.id)}</span>
      </div>
      <div class="review-grid">
        <p><strong>PR:</strong> ${artifactLink}</p>
        <p><strong>Pending human action:</strong> ${formatInlineList(packet.pending_human_actions)}</p>
        <p><strong>Verification:</strong> ${formatInlineList(packet.verification_commands)}</p>
        <p><strong>Critic findings:</strong> ${formatInlineList(packet.critic_findings)}</p>
        <p><strong>Safety findings:</strong> ${formatInlineList(packet.safety_findings)}</p>
      </div>
    </li>`;
  });

  const orphanArtifacts = pullRequestArtifacts
    .filter((artifact) => !reviewPackets.some((packet) => packet.pull_request_artifact_id === artifact.id))
    .map((artifact) => `<li class="review-item">
      <h3>${escapeHtml(artifact.title ?? artifact.id)}</h3>
      <div class="task-meta">
        <span class="badge">${escapeHtml(artifact.state ?? "open")}</span>
        <span>${escapeHtml(artifact.repository)} ${escapeHtml(artifact.head_branch)} -> ${escapeHtml(artifact.base_branch)}</span>
      </div>
      <p><a class="review-link" href="${escapeHtml(artifact.external_url)}">${escapeHtml(artifact.external_url)}</a></p>
    </li>`);

  return `<section>
    <h2>Review inbox</h2>
    ${errorHtml}
    <ul class="review-list">
      ${[...packetItems, ...orphanArtifacts].join("")}
    </ul>
  </section>`;
}

function renderAuditTimeline({ auditEvents = [], error } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";
  const events = [...auditEvents]
    .sort((left, right) => (right.sequence ?? 0) - (left.sequence ?? 0))
    .slice(0, 12);

  if (events.length === 0) {
    return `<section>
      <h2>Audit timeline</h2>
      ${errorHtml}
      <p>No audit events recorded for this workspace.</p>
      <p class="muted">Audit is local and hash-chained; it is not external compliance retention.</p>
    </section>`;
  }

  const items = events.map((event) => `<li class="audit-item">
    <h3>${escapeHtml(event.event_type ?? event.id)}</h3>
    <div class="task-meta">
      <span class="badge">${escapeHtml(event.decision ?? "not_applicable")}</span>
      <span>${escapeHtml(event.actor ?? "system")}</span>
      <span>${escapeHtml(event.created_at ?? "")}</span>
    </div>
    <div class="review-grid">
      <p><strong>Resource:</strong> ${escapeHtml(event.resource_type ?? "none")} ${escapeHtml(event.resource_id ?? "")}</p>
      <p><strong>Sequence:</strong> ${escapeHtml(event.sequence ?? "unknown")}</p>
      <p class="audit-hash"><strong>Hash:</strong> ${escapeHtml(event.event_hash ?? "not available")}</p>
      <p class="audit-hash"><strong>Previous:</strong> ${escapeHtml(event.previous_event_hash ?? "genesis")}</p>
    </div>
  </li>`);

  return `<section>
    <h2>Audit timeline</h2>
    ${errorHtml}
    <p class="muted">Latest local hash-chained events. This proves process-local integrity, not external retention.</p>
    <ul class="audit-list">
      ${items.join("")}
    </ul>
  </section>`;
}

export function renderBootstrapPage(options = {}) {
  const errorBanner = renderErrorBanner(options.error);
  const securityBoundary =
    options.securityBoundary ??
    "Local in-memory personal state. No authentication. Data resets on API restart. Route scoping is not privacy protection.";

  return pageShell(
    "Atlas — Bootstrap",
    `<h1>Personal Atlas</h1>
      <p class="muted">Seed an in-memory workspace, Carbon Copy, project, and task graph for local development.</p>
      ${errorBanner}
      <section class="notice">
        <h2>Security boundary</h2>
        <p>${escapeHtml(securityBoundary)}</p>
      </section>
      <section>
        <h2>Bootstrap workspace</h2>
        <p>No personal workspace is available yet. Bootstrap creates the Atlas self-hosting roadmap and task graph.</p>
        <form method="post" action="/bootstrap">
          <button type="submit">Bootstrap Personal Atlas</button>
        </form>
      </section>`
  );
}

export function renderPersonalDashboard(overview, options = {}) {
  const errorBanner = renderErrorBanner(options.error);
  const securityBoundary = overview.security_boundary ?? "Local in-memory personal state.";
  const carbonCopy = overview.carbon_copy ?? {};
  const project = overview.project ?? {};
  const tasks = overview.tasks ?? [];
  const blockersMap = overview.blockers ?? {};
  const workspaceSelector = {
    workspaces: options.workspaces ?? [],
    selectedWorkspaceId:
      options.selectedWorkspaceId ?? overview.workspace_id ?? overview.workspace?.id,
    error: options.workspaceSelectorError
  };
  const reviewInbox = {
    reviewPackets: options.reviewPackets ?? [],
    pullRequestArtifacts: options.pullRequestArtifacts ?? [],
    error: options.reviewInboxError
  };
  const ontologyManager = {
    objectTypes: options.objectTypes ?? [],
    selectedWorkspaceId: workspaceSelector.selectedWorkspaceId,
    error: options.ontologyManagerError
  };
  const objectList = {
    objects: options.objects ?? [],
    selectedWorkspaceId: workspaceSelector.selectedWorkspaceId,
    error: options.objectListError
  };
  const objectDetail = {
    object: options.selectedObject,
    links: options.selectedObjectLinks,
    error: options.objectDetailError
  };
  const graphExplorer = {
    objects: options.objects ?? [],
    links: options.links ?? [],
    selectedWorkspaceId: workspaceSelector.selectedWorkspaceId,
    error: options.graphExplorerError
  };
  const actionRunner = {
    actionTypes: options.actionTypes ?? [],
    objects: options.objects ?? [],
    selectedWorkspaceId: workspaceSelector.selectedWorkspaceId,
    error: options.actionRunnerError
  };
  const auditTimeline = {
    auditEvents: options.auditEvents ?? [],
    error: options.auditTimelineError
  };
  const resolvedNextAction = resolveNextAction(overview.next_action);
  const nextActionId = resolvedNextAction?.id;

  const carbonGoal = readProperty(carbonCopy, "goal") ?? "—";
  const carbonConstraints = readProperty(carbonCopy, "constraints") ?? "—";
  const projectName = readProperty(project, "name") ?? "—";
  const projectGoal = readProperty(project, "goal") ?? "—";

  const taskItems = tasks
    .map((task) => {
      const taskId = task.id;
      const isNext = taskId === nextActionId;
      const blockers = blockersMap[taskId] ?? [];
      const blockersHtml =
        blockers.length > 0
          ? `<div class="task-meta"><strong>Blockers:</strong> ${blockers.map((blocker) => escapeHtml(formatBlockerLabel(blocker))).join(", ")}</div>`
          : "";

      return `<li class="task-item${isNext ? " is-next" : ""}">
          <h3>${escapeHtml(taskTitle(task))}</h3>
          <div class="task-meta">
            <span class="badge">${escapeHtml(taskStatus(task))}</span>
            <span>${escapeHtml(taskId)}</span>
          </div>
          ${blockersHtml}
        </li>`;
    })
    .join("");

  const nextActionSection = resolvedNextAction
    ? `<section class="next-action">
        <h2>Next action</h2>
        <p><strong>${escapeHtml(resolvedNextAction.title)}</strong></p>
        ${
          resolvedNextAction.explanation
            ? `<p class="muted">${escapeHtml(resolvedNextAction.explanation)}</p>`
            : ""
        }
        ${
          resolvedNextAction.acceptance_criteria
            ? `<div>
                <h3>Acceptance criteria</h3>
                <p>${escapeHtml(resolvedNextAction.acceptance_criteria)}</p>
              </div>`
            : ""
        }
        ${
          resolvedNextAction.blockers?.length
            ? `<div>
                <h3>Blockers</h3>
                ${formatBlockers(resolvedNextAction.blockers)}
              </div>`
            : ""
        }
        <form method="post" action="/tasks/${escapeHtml(nextActionId)}/complete">
          <label>
            Artifact URI
            <input name="artifact_uri" required placeholder="evidence/task-review.md">
          </label>
          <label>
            Evidence note
            <textarea name="evidence_note" required placeholder="Describe how acceptance criteria were met."></textarea>
          </label>
          <button type="submit">Complete task</button>
        </form>
      </section>`
    : `<section>
        <h2>Next action</h2>
        <p>No actionable task is available.</p>
      </section>`;

  return pageShell(
    "Atlas — Personal Dashboard",
    `<h1>Personal Atlas</h1>
      <p class="muted">Next-action dashboard for your local in-memory workspace.</p>
      ${errorBanner}
      <section class="notice">
        <h2>Security boundary</h2>
        <p>${escapeHtml(securityBoundary)}</p>
      </section>
      ${renderWorkspaceSelector(workspaceSelector)}
      <section>
        <h2>Carbon Copy</h2>
        <p><strong>Goal:</strong> ${escapeHtml(carbonGoal)}</p>
        <p><strong>Constraints:</strong> ${escapeHtml(carbonConstraints)}</p>
      </section>
      <section>
        <h2>Active project</h2>
        <p><strong>${escapeHtml(projectName)}</strong></p>
        <p>${escapeHtml(projectGoal)}</p>
      </section>
      ${renderOntologyManager(ontologyManager)}
      ${renderObjectList(objectList)}
      ${renderObjectDetail(objectDetail)}
      ${renderGraphExplorer(graphExplorer)}
      ${renderActionRunner(actionRunner)}
      <section>
        <h2>Tasks</h2>
        <ul class="task-list">
          ${taskItems || "<li><p>No tasks found.</p></li>"}
        </ul>
      </section>
      ${renderReviewInbox(reviewInbox)}
      ${renderAuditTimeline(auditTimeline)}
      ${nextActionSection}`
  );
}

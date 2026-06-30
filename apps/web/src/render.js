import { DEFAULT_VIEW, normalizeView, renderPlatformSidebarHtml } from "./moo-tree.js";
import { renderRepoPathPanel } from "./atlas-repo-tree.js";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pageShell(title, body, layoutOptions = {}) {
  const useTree = layoutOptions.tree !== false;
  const treeHtml = layoutOptions.treeHtml ?? "";
  const bootstrapMode = layoutOptions.bootstrapMode === true;
  const layoutClass = [
    useTree ? "layout-tree" : "layout-single",
    bootstrapMode ? "layout-bootstrap" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const treeColumn = `<aside class="tree-panel" aria-label="Navigation trees">${treeHtml}</aside>`;
  const detailColumn = `<main class="detail-panel">${body}</main>`;
  const twoPane = `${treeColumn}${detailColumn}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style id="atlas-layout-critical">
      body.layout-tree {
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr);
        grid-template-areas: "nav main";
        height: 100vh;
        overflow: hidden;
        margin: 0;
      }
      body.layout-tree .tree-panel { grid-area: nav; }
      body.layout-tree .detail-panel { grid-area: main; }
      @media (max-width: 900px) {
        body.layout-tree {
          grid-template-columns: 1fr;
          grid-template-areas: "nav" "main";
          height: auto;
          min-height: 100vh;
          overflow: visible;
        }
        body.layout-tree.layout-bootstrap {
          grid-template-areas: "main" "nav";
        }
      }
    </style>
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light dark;
        --bg: #0d1110;
        --panel: #141a18;
        --border: #2a3530;
        --text: #e8efe9;
        --muted: #8a9a90;
        --link: #7ec8a8;
        --selected: #c4f0d4;
        font-family: "IBM Plex Mono", "SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace;
        background: var(--bg);
        color: var(--text);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
      }

      .layout-tree {
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr);
        grid-template-areas: "nav main";
        height: 100vh;
        overflow: hidden;
        align-items: stretch;
      }

      .tree-panel {
        grid-area: nav;
      }

      .detail-panel {
        grid-area: main;
      }

      @media (max-width: 900px) {
        .layout-tree {
          grid-template-columns: 1fr;
          grid-template-areas: "nav" "main";
          height: auto;
          min-height: 100vh;
          overflow: visible;
        }
        .layout-bootstrap.layout-tree {
          grid-template-areas: "main" "nav";
        }
        .layout-tree .tree-panel {
          max-height: 42vh;
          overflow: auto;
          border-bottom: 1px solid var(--border);
          border-right: none;
        }
        .layout-bootstrap .tree-panel {
          max-height: 38vh;
          border-bottom: none;
          border-top: 1px solid var(--border);
        }
      }

      .layout-bootstrap .tree-panel {
        border-right: 1px solid var(--border);
      }

      .tree-panel {
        padding: 16px 12px 24px 16px;
        border-right: 1px solid var(--border);
        background: var(--panel);
        overflow: auto;
        max-height: 100vh;
      }

      .detail-panel {
        padding: 20px 24px 48px;
        overflow: auto;
        max-height: 100vh;
      }

      .bootstrap-sticky {
        position: sticky;
        top: 0;
        z-index: 2;
        margin: -20px -24px 16px;
        padding: 16px 24px 12px;
        background: var(--bg);
        border-bottom: 1px solid var(--border);
      }

      .api-hint {
        margin-top: 10px;
        padding: 10px 12px;
        border: 1px dashed var(--border);
        border-radius: 4px;
        font-size: 12px;
      }

      .api-hint code {
        color: var(--link);
      }

      .tree-stack {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .tree-section-divider {
        padding-top: 16px;
        border-top: 1px dashed var(--border);
      }

      .tree-section .tree-pre {
        margin: 8px 0 0;
      }

      .layout-single main {
        width: min(860px, 100%);
        margin: 0 auto;
        padding: 32px 24px 48px;
      }

      .tree-pre {
        margin: 0;
        font-size: 12px;
        line-height: 1.45;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .tree-root {
        font-weight: 700;
        color: var(--text);
      }

      .tree-dir {
        color: var(--text);
        font-weight: 600;
      }

      .tree-leaf {
        color: var(--muted);
      }

      .tree-link {
        color: var(--link);
        text-decoration: none;
      }

      .tree-link:hover {
        text-decoration: underline;
      }

      .tree-link.is-selected {
        color: var(--selected);
        font-weight: 700;
      }

      .tree-status {
        color: #6a756c;
        font-size: 11px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      h2 {
        margin: 0 0 10px;
        font-size: 15px;
        font-weight: 600;
      }

      h3 {
        margin: 0 0 8px;
        font-size: 13px;
      }

      p, li {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
      }

      ul {
        margin: 0;
        padding-left: 18px;
      }

      section {
        margin-top: 20px;
        padding: 14px 16px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--panel);
      }

      .notice {
        border-color: #4a5a40;
      }

      .session-context-bar {
        margin: 12px 0 16px;
        padding: 10px 12px;
        border: 1px solid #3a5a48;
        border-radius: 4px;
        background: #101816;
        font-size: 12px;
        display: grid;
        gap: 6px;
      }

      .session-context-bar .session-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 16px;
        align-items: baseline;
      }

      .session-context-bar .label {
        color: var(--muted);
        min-width: 7rem;
      }

      .session-context-bar code {
        font-size: 11px;
      }

      .error {
        border-color: #8a4040;
        color: #f0c0c0;
      }

      .next-action {
        border-color: #3a6a55;
      }

      .muted {
        color: var(--muted);
        font-size: 12px;
      }

      .task-list, .review-list, .audit-list, .ontology-list {
        list-style: none;
        padding: 0;
        display: grid;
        gap: 8px;
      }

      .task-item, .review-item, .audit-item, .ontology-item, .object-item {
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 4px;
      }

      .task-item.is-next {
        border-color: #3a6a55;
      }

      .task-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 6px;
        font-size: 12px;
      }

      .badge {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 2px;
        background: #1f2824;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .review-grid {
        display: grid;
        gap: 6px;
        margin-top: 6px;
      }

      .review-link {
        color: var(--link);
        overflow-wrap: anywhere;
      }

      .graph-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }

      .audit-hash {
        font-size: 11px;
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
        min-height: 28px;
        padding: 0 10px;
        border: 1px solid var(--border);
        border-radius: 4px;
        color: var(--text);
        text-decoration: none;
      }

      .workspace-link.is-selected {
        border-color: var(--selected);
        color: var(--selected);
      }

      form {
        display: grid;
        gap: 10px;
        margin-top: 10px;
      }

      label {
        display: grid;
        gap: 4px;
        font-size: 12px;
      }

      input, select, textarea {
        font: inherit;
        padding: 8px 10px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--bg);
        color: var(--text);
      }

      textarea {
        min-height: 72px;
        resize: vertical;
      }

      button {
        justify-self: start;
        font: inherit;
        font-weight: 600;
        padding: 8px 14px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: #1f2824;
        color: var(--text);
        cursor: pointer;
      }

      button:hover {
        border-color: var(--link);
      }

      code {
        font: inherit;
        color: var(--selected);
      }
    </style>
  </head>
  <body class="${layoutClass}">
    ${useTree ? twoPane : `<main>${body}</main>`}
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

function renderWorkspaceSelector({ workspaces = [], selectedWorkspaceId, error, queryParams = {} } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";

  if (workspaces.length === 0) {
    return `<section>
      <h2>Workspaces</h2>
      ${errorHtml}
      <p>No workspaces available.</p>
    </section>`;
  }

  const items = workspaces.map((workspace) => {
    const isSelected = workspace.id === selectedWorkspaceId;
    const name = workspace.name ?? workspace.id;
    const q = new URLSearchParams({ ...queryParams, workspace_id: workspace.id });
    const href = `/?${q.toString()}`;
    return `<a class="workspace-link${isSelected ? " is-selected" : ""}" href="${escapeHtml(href)}" aria-current="${isSelected ? "page" : "false"}">
      ${escapeHtml(name)}
    </a>`;
  });

  return `<section>
    <h2>Workspaces</h2>
    ${errorHtml}
    <div class="workspace-selector">
      ${items.join("")}
    </div>
    <p class="muted">Scoped data for review, audit, ontology, and graph. Personal next-action stays on Personal Atlas.</p>
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

function renderObjectList({ objects = [], selectedWorkspaceId, error, queryParams = {} } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";

  if (objects.length === 0) {
    return `<section>
      <h2>Objects</h2>
      ${errorHtml}
      <p>No object instances defined for this workspace.</p>
    </section>`;
  }

  const items = objects.map((object) => {
    const q = new URLSearchParams({
      ...queryParams,
      view: "object-detail",
      ...(selectedWorkspaceId ? { workspace_id: selectedWorkspaceId } : {}),
      object_id: object.id
    });
    const href = `/?${q.toString()}`;
    const title = `<a class="review-link" href="${escapeHtml(href)}">${escapeHtml(object.id)}</a>`;

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

function delegationDisplayStatus(delegation) {
  if (delegation.status === "revoked") {
    return "paused";
  }

  if (delegation.expires_at && Date.parse(delegation.expires_at) <= Date.now()) {
    return "expired";
  }

  return "active";
}

function formatBudgetStub(record, label) {
  const budget = record?.budget_json ?? {};
  const cap = budget.monthly_usd ?? budget.cap_usd ?? "—";
  return `<p class="muted"><strong>${escapeHtml(label)} budget (v0 display — enforcement deferred):</strong> $${escapeHtml(String(cap))}/mo cap</p>`;
}

function renderGoalAlignment({ goalContracts = [], selectedObject, queryParams = {} } = {}) {
  if (!selectedObject || selectedObject.object_type_id !== "object_type_personal_task") {
    return "";
  }

  const activeContracts = goalContracts.filter((contract) => contract.status === "active");

  if (activeContracts.length === 0) {
    return `<div class="task-meta">
      <strong>Goal alignment:</strong>
      No GoalContract linked. Run <code>npm run operational:bootstrap</code> or POST <code>/workspaces/:id/goal-contracts</code>.
    </div>`;
  }

  const contract = activeContracts[0];
  const q = new URLSearchParams({ ...queryParams, view: "goal-contracts" });
  return `<div class="task-meta">
    <strong>Goal alignment:</strong>
    <a class="review-link" href="/?${escapeHtml(q.toString())}">Traces to GoalContract ${escapeHtml(contract.id)}</a>
    — ${escapeHtml(contract.objective ?? "")}
  </div>`;
}

function renderCompanyLoopSection() {
  const steps = [
    ["01", "Intent", "Carbon Copy + user request"],
    ["02", "GoalContract", "Objective, allowed/blocked actions"],
    ["03", "Next action", "Highest-priority unblocked task"],
    ["04", "Dispatch", "Scoped delegation + Tool Router"],
    ["05", "Tool call", "MCP/API governed execution"],
    ["06", "Proof", "Artifact, evidence, audit verify"],
    ["07", "Review", "ReviewPacket + human inbox"],
    ["08", "Priority", "Complete task → rotate next action"]
  ];

  const items = steps
    .map(
      ([num, title, detail]) =>
        `<li><span class="badge">${escapeHtml(num)}</span> <strong>${escapeHtml(title)}</strong> — ${escapeHtml(detail)}</li>`
    )
    .join("");

  return `<section>
    <h2>Company loop (Matrix → Atlas)</h2>
    <p class="muted">Apply the Algorithm: question each step, delete what does not prove value, then automate the survivors.</p>
    <ol class="task-list">${items}</ol>
  </section>`;
}

function renderMatrixRolesFooter() {
  return `<section class="notice">
    <h2>Matrix roles</h2>
    <p><strong>Owner</strong> — review inbox · <strong>Lead</strong> — GoalContract · <strong>Worker</strong> — Tool Router · <strong>System</strong> — bootstrap + audit</p>
    <p class="muted">See <code>outputs/docs/ROLES.md</code></p>
  </section>`;
}

function renderProjectsSection(projects = []) {
  if (projects.length === 0) {
    return "";
  }

  const items = projects
    .map((project) => {
      const name = readProperty(project, "name") ?? project.id;
      const goal = readProperty(project, "goal") ?? "—";
      return `<li><strong>${escapeHtml(name)}</strong> (${escapeHtml(project.id)}) — ${escapeHtml(goal)}</li>`;
    })
    .join("");

  return `<section>
    <h2>Departments (projects)</h2>
    <ul class="task-list">${items}</ul>
  </section>`;
}

function renderBoardPanel({
  selectedWorkspaceId,
  goalContracts = [],
  delegations = [],
  agents = [],
  reviewInboxHref = "/?view=review-inbox",
  error
} = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));

  const contractItems =
    goalContracts.length === 0
      ? "<li><p>No active GoalContracts.</p></li>"
      : goalContracts
          .map(
            (contract) => `<li>
          <strong>${escapeHtml(contract.id)}</strong>
          <span class="badge">${escapeHtml(contract.status ?? "unknown")}</span>
          <p>${escapeHtml(contract.objective ?? "")}</p>
          ${formatBudgetStub(contract, "GoalContract")}
        </li>`
          )
          .join("");

  const delegationItems =
    delegations.length === 0
      ? "<li><p>No hires (delegations) yet. Run <code>npm run operational:bootstrap</code>.</p></li>"
      : delegations
          .map((delegation) => {
            const agent = agentById.get(delegation.agent_id);
            const status = delegationDisplayStatus(delegation);
            const pauseForm =
              status === "active" && selectedWorkspaceId
                ? `<form method="post" action="/workspaces/${escapeHtml(encodeURIComponent(selectedWorkspaceId))}/agent-delegations/${escapeHtml(encodeURIComponent(delegation.id))}/revoke">
              <button type="submit">Pause delegation (Board)</button>
            </form>`
                : "";

            return `<li>
          <strong>${escapeHtml(agent?.display_name ?? delegation.agent_id)}</strong>
          <span class="badge">${escapeHtml(status)}</span>
          <p>${escapeHtml(delegation.id)} · goal ${escapeHtml(delegation.goal_contract_id ?? "—")}</p>
          ${formatBudgetStub(delegation, "Delegation")}
          ${pauseForm}
        </li>`;
          })
          .join("");

  return `<section>
    <h2>Board (Paperclip control plane)</h2>
    ${errorHtml}
    <p class="muted">Board powers: pause delegations, override via <a class="review-link" href="${escapeHtml(reviewInboxHref)}">Review inbox</a>. Revoke is human-only — no agent Tool Router tool (Algorithm: safety-by-absence).</p>
    <h3>GoalContracts</h3>
    <ul class="ontology-list">${contractItems}</ul>
    <h3>Active hires</h3>
    <ul class="ontology-list">${delegationItems}</ul>
  </section>`;
}

function renderCompanyPanel({ agents = [], delegations = [], error } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));

  const treeLines = ["Company", "|- Agents (manifest)", ...agents.map((agent, index) => {
    const prefix = index === agents.length - 1 && delegations.length === 0 ? "`- " : "|- ";
    return `${prefix}${agent.display_name ?? agent.id} [${agent.status ?? "unknown"}]`;
  })];

  if (delegations.length > 0) {
    treeLines.push("`- Delegations (scoped)");
    delegations.forEach((delegation, index) => {
      const prefix = index === delegations.length - 1 ? "   `- " : "   |- ";
      const agent = agentById.get(delegation.agent_id);
      treeLines.push(
        `${prefix}${agent?.display_name ?? delegation.agent_id} · ${delegationDisplayStatus(delegation)} · ${delegation.id}`
      );
    });
  }

  return `<section>
    <h2>Company org</h2>
    ${errorHtml}
    <pre class="ascii-tree">${escapeHtml(treeLines.join("\n"))}</pre>
  </section>`;
}

function renderGoalContractsPanel({ goalContracts = [], error } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";

  if (goalContracts.length === 0) {
    return `<section>
      <h2>Goal contracts</h2>
      ${errorHtml}
      <p>No GoalContracts. Bootstrap operational session or POST to the API.</p>
    </section>`;
  }

  const items = goalContracts
    .map(
      (contract) => `<li>
      <strong>${escapeHtml(contract.id)}</strong>
      <span class="badge">${escapeHtml(contract.status ?? "unknown")}</span>
      <p>${escapeHtml(contract.objective ?? "")}</p>
      ${formatBudgetStub(contract, "GoalContract")}
    </li>`
    )
    .join("");

  return `<section>
    <h2>Goal contracts</h2>
    ${errorHtml}
    <ul class="ontology-list">${items}</ul>
  </section>`;
}

function renderDelegationPanel({ manifest, error } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";
  const tools = manifest?.tools ?? [];

  const items =
    tools.length === 0
      ? "<li><p>Manifest unavailable.</p></li>"
      : tools
          .map(
            (tool) =>
              `<li><strong>${escapeHtml(tool.name)}</strong> <span class="badge">${escapeHtml(tool.required_scope ?? "")}</span> — ${escapeHtml(tool.description ?? "")}</li>`
          )
          .join("");

  return `<section>
    <h2>Tool registry</h2>
    ${errorHtml}
    <p class="muted">Governed tools via Bearer delegation. No merge tool by design.</p>
    <ul class="ontology-list">${items}</ul>
  </section>`;
}

function renderObjectDetail({ object, links, goalContracts, queryParams, error } = {}) {
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
    ${renderGoalAlignment({ goalContracts, selectedObject: object, queryParams })}
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

function renderGraphExplorer({ objects = [], links = [], selectedWorkspaceId, error, queryParams = {} } = {}) {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";
  const nodeItems = objects.length === 0
    ? "<li><p>No nodes.</p></li>"
    : objects.map((object) => {
        const q = new URLSearchParams({
          ...queryParams,
          view: "object-detail",
          ...(selectedWorkspaceId ? { workspace_id: selectedWorkspaceId } : {}),
          object_id: object.id
        });
        const href = `/?${q.toString()}`;
        const title = `<a class="review-link" href="${escapeHtml(href)}">${escapeHtml(object.id)}</a>`;
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

function renderStubPanel(title, body) {
  return `<section>
    <h2>${escapeHtml(title)}</h2>
    <p class="muted">${body}</p>
  </section>`;
}

function renderNextActionSection(resolvedNextAction) {
  if (!resolvedNextAction) {
    return `<section>
        <h2>Next action</h2>
        <p>No actionable task is available.</p>
      </section>`;
  }

  const nextActionId = resolvedNextAction.id;

  return `<section class="next-action">
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
      </section>`;
}

export function renderBootstrapPage(options = {}) {
  const errorBanner = renderErrorBanner(options.error);
  const apiUnreachable = options.apiUnreachable === true;
  const apiHint = apiUnreachable
    ? `<div class="api-hint"><strong>API not reachable.</strong> Start the API in another terminal: <code>npm run dev:api</code> (default <code>http://127.0.0.1:4000</code>), then reload this page. Bootstrap will fail until the API is up.</div>`
    : "";
  const securityBoundary =
    options.securityBoundary ??
    "Local in-memory personal state. No authentication. Data resets on API restart. Route scoping is not privacy protection.";
  const treeHtml = renderPlatformSidebarHtml("home", { view: "home" }, "");

  return pageShell(
    "Atlas — Bootstrap",
    `<div class="bootstrap-sticky">
        <h1>Personal Atlas</h1>
        <p class="muted">Seed workspace, Carbon Copy, project, and task graph.</p>
        ${errorBanner}
        ${apiHint}
        <section>
          <h2>Bootstrap workspace</h2>
          <p>No personal workspace yet. After bootstrap, use the tree to navigate.</p>
          <form method="post" action="/bootstrap">
            <button type="submit">Bootstrap Personal Atlas</button>
          </form>
        </section>
      </div>
      <section class="notice">
        <h2>Security boundary</h2>
        <p>${escapeHtml(securityBoundary)}</p>
      </section>`,
    { treeHtml, bootstrapMode: true }
  );
}

export function renderSessionContextBar(sessionContext, mcpSession = null, options = {}) {
  if (!sessionContext) {
    return "";
  }

  const spine = sessionContext.personal_spine ?? {};
  const polish = sessionContext.parallel_polish ?? {};
  const personalId = sessionContext.workspace_personal_id ?? "workspace_personal";
  const opHint = sessionContext.operational_workspace_hint ?? "workspace_operational_dogfood";

  const mcpWs = mcpSession?.missing
    ? "MCP session missing"
    : mcpSession?.envelope?.workspace_id ?? "—";
  const deleg = mcpSession?.missing
    ? "—"
    : mcpSession?.envelope?.delegation_id
      ? `${String(mcpSession.envelope.delegation_id).slice(0, 14)}…`
      : "—";
  const mcpExpired =
    !mcpSession?.missing && mcpSession?.expired ? " · delegation expired" : "";

  const cwd = options.projectCwd ?? "";
  const gate = options.gateStatusHint ?? {};
  const gateLine = gate.missing
    ? gate.hint ?? "Gate ledger not found"
    : `ledger ${gate.mtime_iso?.slice(0, 10) ?? "—"}`;

  const dualMode =
    mcpWs === personalId
      ? "personal-aligned (unusual for Hermes dogfood)"
      : "dual-spine · personal tasks + operational MCP delegation";

  return `<header class="session-context-bar" aria-label="Session context">
      <div class="session-row"><span class="label">Mode</span><span>${escapeHtml(dualMode)}</span></div>
      <div class="session-row"><span class="label">Personal spine</span><span><code>${escapeHtml(personalId)}</code> · next <code>${escapeHtml(spine.next_action_id ?? "—")}</code> · ${escapeHtml(spine.next_action_title ?? "—")} · open ${escapeHtml(String(spine.open_task_count ?? "—"))}</span></div>
      <div class="session-row"><span class="label">Polish (parallel)</span><span>${escapeHtml(polish.track_uri ?? "outputs/internal/NEXT_ACTION.md")}</span></div>
      <div class="session-row"><span class="label">MCP delegation</span><span><code>${escapeHtml(mcpWs)}</code> · id ${escapeHtml(deleg)}${escapeHtml(mcpExpired)} · expected op <code>${escapeHtml(opHint)}</code></span></div>
      <div class="session-row"><span class="label">Project cwd</span><span><code>${escapeHtml(cwd || "—")}</code></span></div>
      <div class="session-row"><span class="label">Last gate</span><span>${escapeHtml(gateLine)}</span></div>
    </header>`;
}

export function renderPersonalDashboard(overview, options = {}) {
  const errorBanner = renderErrorBanner(options.error);
  const securityBoundary = overview.security_boundary ?? "Local in-memory personal state.";
  const carbonCopy = overview.carbon_copy ?? {};
  const project = overview.project ?? {};
  const tasks = overview.tasks ?? [];
  const blockersMap = overview.blockers ?? {};
  const activeView = normalizeView(options.view);
  const repoPath = options.repoPath ?? "";
  const selectedWorkspaceId =
    options.selectedWorkspaceId ?? overview.workspace_id ?? overview.workspace?.id;
  const queryParams = { view: activeView };
  if (selectedWorkspaceId) {
    queryParams.workspace_id = selectedWorkspaceId;
  }
  if (options.selectedObject?.id) {
    queryParams.object_id = options.selectedObject.id;
  }

  const workspaceSelector = {
    workspaces: options.workspaces ?? [],
    selectedWorkspaceId,
    error: options.workspaceSelectorError,
    queryParams
  };
  const reviewInbox = {
    reviewPackets: options.reviewPackets ?? [],
    pullRequestArtifacts: options.pullRequestArtifacts ?? [],
    error: options.reviewInboxError
  };
  const ontologyManager = {
    objectTypes: options.objectTypes ?? [],
    selectedWorkspaceId,
    error: options.ontologyManagerError
  };
  const objectList = {
    objects: options.objects ?? [],
    selectedWorkspaceId,
    error: options.objectListError,
    queryParams
  };
  const objectDetail = {
    object: options.selectedObject,
    links: options.selectedObjectLinks,
    error: options.objectDetailError
  };
  const graphExplorer = {
    objects: options.objects ?? [],
    links: options.links ?? [],
    selectedWorkspaceId,
    error: options.graphExplorerError,
    queryParams
  };
  const actionRunner = {
    actionTypes: options.actionTypes ?? [],
    objects: options.objects ?? [],
    selectedWorkspaceId,
    error: options.actionRunnerError
  };
  const auditTimeline = {
    auditEvents: options.auditEvents ?? [],
    error: options.auditTimelineError
  };
  const controlPlane = {
    goalContracts: options.goalContracts ?? [],
    delegations: options.agentDelegations ?? [],
    agents: options.agents ?? [],
    manifest: options.agentManifest ?? null,
    error: options.controlPlaneError
  };
  const resolvedNextAction = resolveNextAction(overview.next_action);
  const nextActionId = resolvedNextAction?.id;

  const carbonGoal = readProperty(carbonCopy, "goal") ?? "—";
  const carbonConstraints = readProperty(carbonCopy, "constraints") ?? "—";
  const progressMap = readProperty(carbonCopy, "progress_map");
  const polishTrack = readProperty(carbonCopy, "polish_track");

  const progressSection =
    progressMap || polishTrack
      ? `<section class="notice">
        <h2>Where we are</h2>
        ${progressMap ? `<p><strong>Personal spine map:</strong> <code>${escapeHtml(progressMap)}</code></p>` : ""}
        ${polishTrack ? `<p><strong>Polish (parallel):</strong> ${escapeHtml(polishTrack)}</p>` : ""}
        <p class="muted">Next action below is the governed personal task — not the polish epic list.</p>
      </section>`
      : "";

  const taskItems = tasks
    .map((task) => {
      const taskId = task.id;
      const isNext = taskId === nextActionId;
      const blockers = blockersMap[taskId] ?? [];
      const blockersHtml =
        blockers.length > 0
          ? `<div class="task-meta"><strong>Blockers:</strong> ${blockers.map((blocker) => escapeHtml(formatBlockerLabel(blocker))).join(", ")}</div>`
          : "";
      const progressNote = readProperty(task, "progress_note");
      const progressHtml = progressNote
        ? `<div class="task-meta"><strong>Progress:</strong> ${escapeHtml(progressNote)}</div>`
        : "";
      const acceptance = readProperty(task, "acceptance_criteria");
      const acceptanceHtml =
        taskStatus(task) !== "done" && acceptance
          ? `<div class="task-meta"><strong>Acceptance:</strong> ${escapeHtml(acceptance)}</div>`
          : "";

      return `<li class="task-item${isNext ? " is-next" : ""}">
          <h3>${escapeHtml(taskTitle(task))}</h3>
          <div class="task-meta">
            <span class="badge">${escapeHtml(taskStatus(task))}</span>
            <span>${escapeHtml(taskId)}</span>
          </div>
          ${acceptanceHtml}
          ${progressHtml}
          ${blockersHtml}
        </li>`;
    })
    .join("");

  const tasksSection = `<section>
        <h2>Tasks</h2>
        <ul class="task-list">
          ${taskItems || "<li><p>No tasks found.</p></li>"}
        </ul>
      </section>`;

  const carbonSection = `<section>
        <h2>Carbon Copy</h2>
        <p><strong>Goal:</strong> ${escapeHtml(carbonGoal)}</p>
        <p><strong>Constraints:</strong> ${escapeHtml(carbonConstraints)}</p>
      </section>`;

  const projectSection = renderProjectsSection(overview.projects ?? (project ? [project] : []));

  const securitySection = `<section class="notice">
        <h2>Security boundary</h2>
        <p>${escapeHtml(securityBoundary)}</p>
      </section>`;

  const reviewLink = `/?${new URLSearchParams({ ...queryParams, view: "review-inbox" }).toString()}`;

  const viewPanels = {
    home: `${renderCompanyLoopSection()}${progressSection}${securitySection}${projectSection}${carbonSection}${tasksSection}${renderNextActionSection(resolvedNextAction)}${renderMatrixRolesFooter()}`,
    board: renderBoardPanel({
      selectedWorkspaceId,
      goalContracts: controlPlane.goalContracts,
      delegations: controlPlane.delegations,
      agents: controlPlane.agents,
      reviewInboxHref: reviewLink,
      error: controlPlane.error
    }),
    company: renderCompanyPanel({
      agents: controlPlane.agents,
      delegations: controlPlane.delegations,
      error: controlPlane.error
    }),
    "next-action": renderNextActionSection(resolvedNextAction),
    "carbon-copy": `${carbonSection}${projectSection}${renderMatrixRolesFooter()}`,
    tasks: tasksSection,
    workspaces: renderWorkspaceSelector(workspaceSelector),
    ontology: renderOntologyManager(ontologyManager),
    objects: renderObjectList(objectList),
    "object-detail": renderObjectDetail({ ...objectDetail, goalContracts: controlPlane.goalContracts, queryParams }),
    graph: renderGraphExplorer(graphExplorer),
    actions: renderActionRunner(actionRunner),
    "review-inbox": renderReviewInbox(reviewInbox),
    audit: renderAuditTimeline(auditTimeline),
    "goal-contracts": renderGoalContractsPanel({
      goalContracts: controlPlane.goalContracts,
      error: controlPlane.error
    }),
    delegation: renderDelegationPanel({
      manifest: controlPlane.manifest,
      error: controlPlane.error
    }),
    repo: renderRepoPathPanel(repoPath || "docs/PRD.md")
  };

  const detailBody = viewPanels[activeView] ?? viewPanels.home;
  const treeHtml = renderPlatformSidebarHtml(activeView, queryParams, repoPath);
  const sessionBar = renderSessionContextBar(options.sessionContext, options.mcpSession, {
    projectCwd: options.projectCwd,
    gateStatusHint: options.gateStatusHint
  });

  const viewTitles = {
    home: "Orchestration console",
    board: "Board",
    company: "Company org",
    "next-action": "Next-action selector",
    "carbon-copy": "User and goal layer",
    tasks: "Workflow steps",
    workspaces: "Workspaces",
    ontology: "Orchestrator registry (ontology)",
    objects: "State updates",
    "object-detail": "Object detail",
    graph: "Subtask graph",
    actions: "Action proposals",
    "review-inbox": "Approval inbox",
    audit: "Governance and audit",
    "goal-contracts": "Goal contracts",
    delegation: "Delegation platform",
    repo: "Monorepo path"
  };

  return pageShell(
    `Atlas — ${viewTitles[activeView] ?? "Console"}`,
    `<h1>${escapeHtml(viewTitles[activeView] ?? "Personal Atlas")}</h1>
      <p class="muted">Mixture of Orchestrators Platform · local v0</p>
      ${sessionBar}
      ${errorBanner}
      ${detailBody}`,
    { treeHtml }
  );
}

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

      input, textarea {
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
      <section>
        <h2>Tasks</h2>
        <ul class="task-list">
          ${taskItems || "<li><p>No tasks found.</p></li>"}
        </ul>
      </section>
      ${nextActionSection}`
  );
}

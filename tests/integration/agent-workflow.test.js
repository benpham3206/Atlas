import test from "node:test";
import assert from "node:assert/strict";
import { lstat, readFile } from "node:fs/promises";

const REQUIRED_FILES = [
  "docs/AGENT_WORKFLOW.md",
  ".cursor/rules/000-core.mdc",
  ".cursor/rules/010-cloud-agent.mdc",
  ".cursor/rules/020-tests.mdc",
  ".cursor/agents/verifier.md",
  ".cursor/agents/test-runner.md",
  ".cursor/agents/debugger.md",
  ".cursor/agents/security-auditor.md",
  ".agents/skills/plan-feature/SKILL.md",
  ".agents/skills/implement-task/SKILL.md",
  ".agents/skills/review-pr/SKILL.md",
  ".agents/skills/summarize-handoff/SKILL.md",
  ".github/codex/prompts/review.md",
  "tasks/TEMPLATE.md",
  "state/TEMPLATE.md",
  "logs/TEMPLATE.md",
  "tasks/TASK-2026-06-15-agent-workflow.md",
  "state/TASK-2026-06-15-agent-workflow.md",
  "logs/TASK-2026-06-15-agent-workflow.md",
  "STATE.md",
  "LOGS.md",
  "POKE_SUMMARY.md"
];

test("agent workflow control-plane files exist as regular files", async () => {
  for (const file of REQUIRED_FILES) {
    const stat = await lstat(file);

    assert.equal(stat.isFile(), true, `${file} must be a file`);
    assert.equal(stat.isSymbolicLink(), false, `${file} must not be a symlink`);
  }
});

test("AGENTS.md preserves Atlas constraints while adding workflow rules", async () => {
  const agents = await readFile("AGENTS.md", "utf8");

  assert.match(agents, /No external npm packages/);
  assert.match(agents, /API store is fully in-memory/);
  assert.match(agents, /Poke is the intake/);
  assert.match(agents, /Cursor Cloud Agent \/ Cursor Agent owns scoped implementation/);
  assert.match(agents, /Codex owns architecture critique/);
});

test("workflow guide keeps existing trackers canonical and defers unsafe automation", async () => {
  const workflow = await readFile("docs/AGENT_WORKFLOW.md", "utf8");

  assert.match(workflow, /extends the existing `TASKS\.md` and `CONTEXT_LOG\.md` process/);
  assert.match(workflow, /Use Codex GitHub Action or automated Codex PR review only after/);
  assert.match(workflow, /Store secrets in the relevant platform secret manager/);
  assert.match(workflow, /Poke-ready summary under 100 words/);
});

test("Cursor rules use mdc frontmatter and point to AGENTS.md", async () => {
  const coreRule = await readFile(".cursor/rules/000-core.mdc", "utf8");

  assert.match(coreRule, /^---\nalwaysApply: true\n---/);
  assert.match(coreRule, /Read `AGENTS\.md` first/);
  assert.match(coreRule, /Do not mark work complete solely because files were edited/);
});

test("root summaries remain indexes instead of replacing task and log sources", async () => {
  const state = await readFile("STATE.md", "utf8");
  const logs = await readFile("LOGS.md", "utf8");
  const summary = await readFile("POKE_SUMMARY.md", "utf8");

  assert.match(state, /`TASKS\.md` is the root implementation queue/);
  assert.match(state, /Keep task-specific detail in `tasks\/`, `state\/`, and `logs\/`/);
  assert.match(logs, /Detailed command evidence remains in `CONTEXT_LOG\.md`/);
  assert.match(summary, /Existing `AGENTS\.md`, `TASKS\.md`, and\s+`CONTEXT_LOG\.md` stay authoritative/);
});


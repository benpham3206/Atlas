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
  "onboarding/README.md",
  "onboarding/CURSOR_CLOUD_AGENT.md",
  "onboarding/LOCAL_CODEX_PLUGIN.md",
  "onboarding/POKE_LOOP_SMOKE_TEST.md",
  "onboarding/prompts/cursor-cloud-agent-smoke-test.md",
  "onboarding/prompts/local-codex-planning.md",
  "onboarding/prompts/local-codex-review.md",
  "onboarding/prompts/poke-fix-follow-up.md",
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
  assert.match(agents, /Codex owns high-level architecture/);
  assert.match(agents, /Cursor Cloud Agent \/ Cursor Agent owns scoped implementation/);
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
  assert.match(summary, /Existing `AGENTS\.md`, `TASKS\.md`, and `CONTEXT_LOG\.md`\s+stay authoritative/);
});

test("onboarding workspace documents local Codex and Cursor Cloud lanes", async () => {
  const onboarding = await readFile("onboarding/README.md", "utf8");
  const codex = await readFile("onboarding/LOCAL_CODEX_PLUGIN.md", "utf8");
  const cloud = await readFile("onboarding/CURSOR_CLOUD_AGENT.md", "utf8");
  const smoke = await readFile("onboarding/POKE_LOOP_SMOKE_TEST.md", "utf8");

  assert.match(onboarding, /Codex plugin runs locally inside Cursor for high-level architecture/);
  assert.match(onboarding, /Codex cloud automation is not required/);
  assert.match(onboarding, /Cursor Cloud Agents implement, verify, commit, push, and open PRs for Codex-planned atomic tasks/);
  assert.match(codex, /Codex is local\/manual/);
  assert.match(codex, /Codex is still the high-level owner/);
  assert.match(codex, /Do not assume the Codex plugin can run inside Cursor Cloud/);
  assert.match(cloud, /Cursor Cloud is the execution lane/);
  assert.match(cloud, /Cursor Cloud can access the Atlas GitHub repository/);
  assert.match(smoke, /local Codex plugin\s+  -> architecture plan and atomic task file/);
  assert.match(smoke, /local Cursor Codex plugin review/);
});


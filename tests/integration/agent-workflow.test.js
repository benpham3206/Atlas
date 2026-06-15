import test from "node:test";
import assert from "node:assert/strict";
import { lstat, readFile } from "node:fs/promises";

const REQUIRED_100X_FILES = [
  "100X/README.md",
  "100X/AGENTS.md",
  "100X/docs/AGENT_WORKFLOW.md",
  "100X/docs/CODEX_RULES.md",
  "100X/cursor/rules/000-core.mdc",
  "100X/cursor/rules/010-cloud-agent.mdc",
  "100X/cursor/rules/020-tests.mdc",
  "100X/cursor/agents/verifier.md",
  "100X/cursor/agents/test-runner.md",
  "100X/cursor/agents/debugger.md",
  "100X/cursor/agents/security-auditor.md",
  "100X/agents/skills/plan-feature/SKILL.md",
  "100X/agents/skills/implement-task/SKILL.md",
  "100X/agents/skills/review-pr/SKILL.md",
  "100X/agents/skills/summarize-handoff/SKILL.md",
  "100X/codex/prompts/review.md",
  "100X/tasks/TEMPLATE.md",
  "100X/state/TEMPLATE.md",
  "100X/logs/TEMPLATE.md",
  "100X/onboarding/README.md",
  "100X/onboarding/CURSOR_CLOUD_AGENT.md",
  "100X/onboarding/LOCAL_CODEX_PLUGIN.md",
  "100X/onboarding/POKE_LOOP_SMOKE_TEST.md",
  "100X/onboarding/prompts/cursor-cloud-agent-smoke-test.md",
  "100X/onboarding/prompts/local-codex-planning.md",
  "100X/onboarding/prompts/local-codex-review.md",
  "100X/onboarding/prompts/poke-fix-follow-up.md",
  "100X/tasks/TASK-2026-06-15-100x-separation.md",
  "100X/STATE.md",
  "100X/LOGS.md",
  "100X/POKE_SUMMARY.md"
];

const REQUIRED_ROOT_INTEGRATION_FILES = [
  ".cursor/rules/000-core.mdc",
  ".cursor/rules/010-cloud-agent.mdc",
  ".cursor/rules/020-tests.mdc",
  ".cursor/agents/verifier.md",
  ".cursor/agents/test-runner.md",
  ".cursor/agents/debugger.md",
  ".cursor/agents/security-auditor.md"
];

test("100X workflow files exist as regular files", async () => {
  for (const file of REQUIRED_100X_FILES) {
    const stat = await lstat(file);

    assert.equal(stat.isFile(), true, `${file} must be a file`);
    assert.equal(stat.isSymbolicLink(), false, `${file} must not be a symlink`);
  }
});

test("root Cursor integration files exist as regular files", async () => {
  for (const file of REQUIRED_ROOT_INTEGRATION_FILES) {
    const stat = await lstat(file);

    assert.equal(stat.isFile(), true, `${file} must be a file`);
    assert.equal(stat.isSymbolicLink(), false, `${file} must not be a symlink`);
  }
});

test("root AGENTS.md preserves Atlas constraints and points at 100X", async () => {
  const agents = await readFile("AGENTS.md", "utf8");

  assert.match(agents, /No external npm packages/);
  assert.match(agents, /API store is fully in-memory/);
  assert.match(agents, /100X\/AGENTS\.md/);
  assert.match(agents, /100X\/docs\/AGENT_WORKFLOW\.md/);
});

test("100X workflow guide keeps Atlas trackers canonical", async () => {
  const workflow = await readFile("100X/docs/AGENT_WORKFLOW.md", "utf8");

  assert.match(workflow, /extends the existing `TASKS\.md` and `CONTEXT_LOG\.md` process/);
  assert.match(workflow, /100X\/tasks\//);
  assert.match(workflow, /100X\/onboarding\//);
  assert.match(workflow, /Poke-ready summary under 100 words/);
});

test("Cursor rules use mdc frontmatter and point at 100X", async () => {
  const coreRule = await readFile(".cursor/rules/000-core.mdc", "utf8");

  assert.match(coreRule, /^---\nalwaysApply: true\n---/);
  assert.match(coreRule, /100X\/AGENTS\.md/);
  assert.match(coreRule, /100X\/docs\/AGENT_WORKFLOW\.md/);
  assert.match(coreRule, /Do not mark work complete solely because files were edited/);
});

test("100X summaries remain indexes instead of replacing Atlas trackers", async () => {
  const state = await readFile("100X/STATE.md", "utf8");
  const logs = await readFile("100X/LOGS.md", "utf8");
  const summary = await readFile("100X/POKE_SUMMARY.md", "utf8");

  assert.match(state, /`TASKS\.md` is the root Atlas implementation queue/);
  assert.match(state, /100X\/tasks\//);
  assert.match(logs, /Detailed command evidence remains in `CONTEXT_LOG\.md`/);
  assert.match(summary, /Root `AGENTS\.md`, `TASKS\.md`, and `CONTEXT_LOG\.md`/);
});

test("100X onboarding documents local Codex and Cursor Cloud lanes", async () => {
  const onboarding = await readFile("100X/onboarding/README.md", "utf8");
  const codex = await readFile("100X/onboarding/LOCAL_CODEX_PLUGIN.md", "utf8");
  const cloud = await readFile("100X/onboarding/CURSOR_CLOUD_AGENT.md", "utf8");
  const smoke = await readFile("100X/onboarding/POKE_LOOP_SMOKE_TEST.md", "utf8");

  assert.match(onboarding, /Codex plugin runs locally inside Cursor for high-level architecture/);
  assert.match(onboarding, /Codex cloud automation is not required/);
  assert.match(onboarding, /Cursor Cloud Agents implement, verify, commit, push, and open PRs/);
  assert.match(codex, /Codex is local\/manual/);
  assert.match(codex, /100X\/docs\/AGENT_WORKFLOW\.md/);
  assert.match(cloud, /Cursor Cloud is the execution lane/);
  assert.match(cloud, /100X\/tasks\//);
  assert.match(smoke, /local Codex plugin/);
  assert.match(smoke, /100X\/POKE_SUMMARY\.md/);
});

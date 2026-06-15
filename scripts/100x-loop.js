import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const REVIEW_PACKET_DIR = join(ROOT, "100X", "review-packets");

const [command, taskId, ...args] = process.argv.slice(2);

if (!command || command === "--help" || command === "-h") {
  printUsage();
  process.exit(command ? 0 : 1);
}

if (!taskId) {
  fail("Missing TASK_ID.");
}

if (!/^TASK-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(taskId)) {
  fail(`Invalid TASK_ID: ${taskId}`);
}

const options = parseOptions(args);

if (command === "status") {
  printStatus(taskId);
} else if (command === "review-packet") {
  createReviewPacket(taskId, options);
} else {
  fail(`Unknown command: ${command}`);
}

function printUsage() {
  console.log(`Usage:
  node scripts/100x-loop.js status TASK_ID
  node scripts/100x-loop.js review-packet TASK_ID [--pr URL_OR_NUMBER] [--base REF] [--dry-run]

Examples:
  npm run 100x:status -- TASK-2026-06-15-api-version-endpoint
  npm run 100x:review-packet -- TASK-2026-06-15-api-version-endpoint --pr 5
`);
}

function parseOptions(rawArgs) {
  const parsed = {
    base: "origin/main",
    pr: "",
    dryRun: false
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    if (arg === "--base") {
      parsed.base = rawArgs[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--pr") {
      parsed.pr = rawArgs[index + 1] ?? "";
      index += 1;
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  if (!parsed.base) {
    fail("--base requires a value.");
  }

  if (rawArgs.includes("--pr") && !parsed.pr) {
    fail("--pr requires a value.");
  }

  return parsed;
}

function printStatus(taskId) {
  const files = taskFiles(taskId);
  const rows = Object.entries(files).map(([label, file]) => ({
    label,
    file,
    exists: existsSync(file)
  }));

  for (const row of rows) {
    const status = row.exists ? "ok" : "missing";
    console.log(`${status}\t${row.label}\t${relativePath(row.file)}`);
  }

  if (rows.some((row) => !row.exists)) {
    process.exitCode = 1;
  }
}

function createReviewPacket(taskId, options) {
  const files = taskFiles(taskId);
  const packetPath = join(REVIEW_PACKET_DIR, `${taskId}.md`);
  const now = new Date().toISOString();
  const branch = git(["branch", "--show-current"]);
  const head = git(["rev-parse", "--short", "HEAD"]);
  const status = git(["status", "--short"]);
  const diffStat = git(["diff", "--stat", `${options.base}...HEAD`]);
  const diffNames = git(["diff", "--name-only", `${options.base}...HEAD`]);

  const packet = `# ${taskId} Local Codex Review Packet

Generated: ${now}
Branch: ${branch || "unknown"}
Head: ${head || "unknown"}
PR: ${options.pr || "not provided"}
Base: ${options.base}

## Local Codex Review Instructions

Review this branch against \`${options.base}\`.

Read:

- \`AGENTS.md\`
- \`100X/AGENTS.md\`
- \`100X/docs/AGENT_WORKFLOW.md\`
- \`100X/docs/CODEX_RULES.md\`
- \`100X/codex/prompts/review.md\`
- \`${relativePath(files.task)}\`
- \`${relativePath(files.state)}\`
- \`${relativePath(files.log)}\`
- the branch diff

Return only P0/P1/P2 findings with file and line references. Focus on correctness, missing tests,
security/privacy, regressions, migration risk, acceptance criteria, and scope drift. Do not rewrite
the implementation unless explicitly asked.

## Handoff Files

${fileSection("Task", files.task)}

${fileSection("State", files.state)}

${fileSection("Log", files.log)}

${fileSection("Poke Summary", files.pokeSummary)}

## Git Status

\`\`\`text
${status || "clean"}
\`\`\`

## Diff Stat

\`\`\`text
${diffStat || "No diff against base, or base ref unavailable."}
\`\`\`

## Changed Files

\`\`\`text
${diffNames || "No changed files against base, or base ref unavailable."}
\`\`\`

## Cursor Fix Follow-up Template

\`\`\`text
Task ID: ${taskId}

Read the Codex review findings pasted below and apply only scoped fixes for this task.
Do not re-plan architecture. Do not expand scope beyond 100X/tasks/${taskId}.md.
Update 100X/state/${taskId}.md, 100X/logs/${taskId}.md, and 100X/POKE_SUMMARY.md.
Run the relevant verification commands from the task file.
Push the branch and update the PR.

Codex findings:

<paste findings here>
\`\`\`
`;

  if (options.dryRun) {
    console.log(packet);
    return;
  }

  mkdirSync(dirname(packetPath), { recursive: true });
  writeFileSync(packetPath, packet);
  console.log(`Wrote ${relativePath(packetPath)}`);
}

function taskFiles(taskId) {
  return {
    task: join(ROOT, "100X", "tasks", `${taskId}.md`),
    state: join(ROOT, "100X", "state", `${taskId}.md`),
    log: join(ROOT, "100X", "logs", `${taskId}.md`),
    pokeSummary: join(ROOT, "100X", "POKE_SUMMARY.md")
  };
}

function fileSection(label, file) {
  if (!existsSync(file)) {
    return `### ${label}\n\nMissing: \`${relativePath(file)}\`\n`;
  }

  return `### ${label}

Source: \`${relativePath(file)}\`

\`\`\`markdown
${readFileSync(file, "utf8").trim()}
\`\`\`
`;
}

function git(args) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return "";
  }

  return result.stdout.trim();
}

function relativePath(file) {
  return file.startsWith(ROOT) ? file.slice(ROOT.length).replace(/^\//, "") : file;
}

function fail(message) {
  console.error(message);
  printUsage();
  process.exit(1);
}

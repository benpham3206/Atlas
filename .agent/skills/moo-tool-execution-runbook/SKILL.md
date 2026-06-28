---
name: moo-tool-execution-runbook
description: "Execute Atlas/MoO tool actions safely in a local Codex workspace: preflight scopes, classify risk, choose sandboxed commands, edit with apply_patch, run verification, capture tool results, and avoid destructive or unauthorized operations. Use when an agent is about to read files, edit files, run tests, call networked tools, query databases, or perform repository automation."
---

# MoO Tool Execution Runbook

Use this skill immediately before and during tool execution.

## Preflight

Before any non-trivial tool call:

1. Identify the active GoalContract or write a compact equivalent.
2. State the intended tool action and why it is allowed.
3. Check workspace instructions and sandbox limits.
4. Classify the action as read-only, reversible write, external side effect, or destructive.
5. Confirm whether human approval is required.
6. Prefer repository-native commands from `README.md`, `package.json`, and local docs.

## Local Execution Rules

- Use `rg` or `rg --files` for discovery.
- Use `apply_patch` for manual file edits.
- Do not write files with shell heredocs or ad hoc `cat > file` tricks.
- Do not use destructive commands unless the user explicitly requested them.
- Do not run network, remote auth, cloud, package install, or database calls without approval when the sandbox requires it.
- Do not bypass the Tool Router conceptually; every tool action must be explainable as a scoped operation.
- Keep unrelated dirty worktree changes intact.

## Tool Action Record

For each meaningful tool action, capture:

- `tool_name`
- `purpose`
- `scope_required`
- `resource_refs`
- `sandbox_profile`
- `approval_state`
- `result`
- `evidence_ref`
- `follow_up_required`

In the current local repo, this may be represented in the run trace or final response. In a production Atlas/MoO system, it maps to `ToolCall`, `ToolResult`, and `AuditEvent`.

## Write Operations

Only edit files when:

- The edit is within the requested scope.
- The file is in a writable root.
- The change advances the GoalContract.
- Verification is possible or the limitation is explicit.

Before editing, provide a short user-facing update explaining what will change.

## Verification

After execution:

- Run the narrowest meaningful verification first.
- Broaden to full test/lint when risk or repo convention requires it.
- Treat a skipped test as residual risk, not success.
- Record command names and outcomes in the closure trace.

## Stop Conditions

Stop and ask or escalate when:

- The action would cross production, financial, private-data, protected-branch, or destructive boundaries.
- Required approval is unavailable.
- The worktree state makes the requested change ambiguous.
- Verification repeatedly fails for reasons unrelated to the requested change.

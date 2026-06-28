---
name: implementation-task-packaging
description: Convert architecture specs, PRDs, and Atlas/MoO design documents into executable implementation task packages for Codex, Cursor, or other coding agents. Use when the user asks for next steps, task breakdowns, implementation prompts, file plans, acceptance criteria, verification commands, or handoff packages from a high-level system design.
---

# Implementation Task Packaging

Use this skill to turn a dense architecture or PRD into a bounded implementation package that another coding agent can execute without reopening product strategy.

## Repository Intake

Before writing a task package:

1. Read repository-local agent instructions.
2. Read current task trackers, architecture docs, rules docs, and relevant source files.
3. Identify what already exists versus what the task is asking to add.
4. Respect existing authority boundaries, lifecycle names, and validation commands.
5. Use the repository's current agent-skill or local handoff directories. Do not invent legacy workflow directories unless they already exist and the user asks for them.

## Package Structure

Each package should include:

- Objective: one concrete implementation goal.
- Why now: the architectural reason this slice matters.
- Scope: exact files, modules, records, routes, schemas, and UI surfaces likely touched.
- Non-goals: features intentionally excluded.
- Data and authority rules: lifecycle, classification, scope, approval, and audit constraints.
- Implementation steps: ordered, testable work items.
- Acceptance criteria: observable conditions, not intent.
- Verification commands: repository-native commands only.
- Risk and rollback notes: what to stop on, and what not to modify.
- Handoff prompt: concise instructions suitable for a coding agent.

## Task Sizing

Keep each package small enough to verify in one review pass:

- Prefer one service boundary or one user-facing workflow per package.
- Split schema, API, UI, and background worker changes when combined risk is high.
- Include migration or fixture updates only when the current repo has that machinery.
- Do not claim database, network, or cryptographic enforcement exists until the implementation and tests prove it.

## Mandatory Guards

Flag and block any package that would:

- Let generated or candidate records drive authoritative actions before promotion.
- Add broad tool authority without explicit scopes and tests.
- Skip audit evidence for high-risk actions.
- Depend on external services without a local fallback or clear test seam.
- Require humans to approve routine reversible local operations.

---
name: approval-fatigue-filter
description: "Decide when Atlas/MoO agent work should auto-execute, ask confirmation, require explicit human approval, or stop. Use for human-in-the-loop optimization, reversible-vs-irreversible action classification, low-risk fast paths, autonomous allow-lists, and preventing approval fatigue without weakening zero-trust boundaries."
---

# Approval Fatigue Filter

Use this skill to protect human attention while preserving hard safety boundaries.

## Action Classes

Classify the proposed action:

- `routine_reversible`: local docs, tests, fixtures, small code edits, formatting, generated planning artifacts.
- `conditionally_reversible`: branch creation, dependency updates, broad refactors, schema changes, migrations, generated code touching shared behavior.
- `irreversible`: merge to protected branch, production deploy, external email/message, payment, deletion, credential rotation, data export, public disclosure.
- `prohibited`: policy violation, secret exposure, unauthorized access, destructive action without explicit request.

## Decision Matrix

- `routine_reversible` -> auto-execute if scope, sandbox, and verification pass.
- `conditionally_reversible` -> execute only with strong local rollback path and verification; otherwise ask confirmation.
- `irreversible` -> require explicit human approval logged before action.
- `prohibited` -> refuse or stop.

## Autonomous Allow-List Criteria

Allow autonomous execution when all are true:

- The action stays inside the local workspace.
- No secrets or sensitive data are newly exposed.
- No external system receives a side effect.
- The change can be reverted with a normal patch.
- The file set is bounded and relevant.
- Verification can be run locally.
- The user has not requested review first.

Examples usually allowed:

- update local Markdown planning files
- add or edit tests
- patch non-sensitive source files
- run local lint/test/validation commands
- generate local review packets or traces

Examples requiring approval:

- push, merge, deploy, publish, delete, or rotate secrets
- call paid APIs or cloud infrastructure
- change access controls
- export private repository content
- run destructive cleanup commands

## Anti-Fatigue Rule

Do not ask for approval merely because the action is agentic. Ask because the action crosses a meaningful boundary.

When asking, include:

- the exact action
- why approval is required
- blast radius
- rollback plan, if any
- what will be logged after approval

---
name: workspace-transparency-blueprint
description: "Create or update a local SYSTEM_DESIGN.md or equivalent workspace transparency file before non-trivial Atlas/MoO agent execution. Use when an agent loop will change code, schemas, architecture docs, task trackers, policy boundaries, or generated artifacts and the user needs a visible plan, constraints, risk profile, and verification path in the workspace."
---

# Workspace Transparency Blueprint

Use this skill to make agent execution legible before tools modify the workspace.

## When Required

Create or update `SYSTEM_DESIGN.md` or the repo's equivalent transparency file when:

- code behavior will change
- schemas, migrations, auth, policy, audit, or tool boundaries will change
- multiple orchestrators or agent roles are involved
- the task could affect future implementation direction
- the user explicitly asks to dogfood Atlas/MoO

For tiny one-file fixes, a concise plan in chat or a run trace may be enough unless repo rules require a file.

## Required Sections

Keep the blueprint concise:

- Objective
- Current State
- Intended Change
- Non-Goals
- Data Plane Impact
- Control Plane Impact
- Trust/Policy Impact
- Files Likely Touched
- Verification Plan
- Approval/Fatigue Decision
- Open Risks

## Update Rules

- Preserve useful existing content.
- Replace stale active-run details instead of appending unbounded logs.
- Mark unimplemented controls as planned, not enforced.
- Link to source specs, tasks, or artifacts when available.
- Keep details specific enough that another agent could continue the work.

## Before Tool Execution

The blueprint is sufficient when it answers:

- What is this run trying to change?
- Why is the action allowed?
- What must not be touched?
- What evidence will prove success?
- When should the agent stop and ask for approval?

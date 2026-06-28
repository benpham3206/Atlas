---
name: enterprise-architecture-prd
description: Create or update dense engineering-grade PRDs, master architecture specifications, and Markdown/PDF architecture artifacts for enterprise AI platforms, Atlas/MoO-style systems, zero-trust tool execution, data/control plane synthesis, or implementation handoff documents. Use when the user asks for a PRD, architecture blueprint, product specification, PDF/Markdown deliverable, or source-spec synthesis at principal-engineer caliber.
---

# Enterprise Architecture PRD

Use this skill to turn source specs, pasted strategy notes, repository facts, and product direction into a rigorous enterprise architecture or PRD artifact.

## Source Intake

Before drafting:

1. Read every user-supplied source file or pasted specification.
2. Read repository-local guidance that governs the artifact, especially `AGENTS.md`, `TASKS.md`, architecture docs, and rules docs when present.
3. Identify the current implementation state separately from target-state architecture.
4. Preserve the user's launch stance. If the user says no launch-time Lean or ZK proofs, treat them as future hooks only.

## Required Architecture Coverage

For Atlas/MoO-class documents, cover these sections unless the user narrows scope:

- Executive thesis: one or two concrete sentences defining the system.
- Personas and operating workflows.
- Data plane: ontology objects, links, artifacts, tasks, classifications, and audit records.
- Control plane: goal contracts, orchestrator runs, agent sessions, tool calls, strategies, fast paths, and approval gates.
- Trust plane: identity, tenancy, OAuth scopes, short-lived delegation tokens, RLS, sandbox boundaries, audit logs, and human approval gates.
- Product surfaces: cockpit, graph explorer, goal editor, strategy inspector, approval inbox, run trace viewer, and IDE-local transparency files when requested.
- Lifecycle: ingestion, normalization, task creation, strategy selection, execution, verification, closure, audit anchoring.
- Non-goals, risks, assumptions, migration path, and acceptance criteria.

## Artifact Workflow

1. Create Markdown first.
2. Use stable headings, explicit schemas, and cross-references between tables, tokens, policies, and orchestrators.
3. Avoid generic boilerplate and tutorial prose.
4. When the user requests a PDF, render from the Markdown and visually verify the generated artifact before finishing.
5. State which files were produced and which validation commands were run.

## Quality Bar

The document is not complete until it answers:

- What service owns each decision?
- Which record changes when the decision is made?
- Which policy or scope is evaluated?
- Which boundary prevents a model or agent from expanding its own authority?
- Which parts are launch requirements versus future upgrade hooks?

If the repo's current implementation is smaller than the target architecture, say so clearly and do not imply production features already exist.

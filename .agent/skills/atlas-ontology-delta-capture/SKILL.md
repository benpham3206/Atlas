---
name: atlas-ontology-delta-capture
description: "Capture a task, bug, source document, repository change, or agent output as an Atlas ontology delta with ObjectInstances, LinkInstances, lifecycle states, classifications, provenance, and candidate-vs-operational authority boundaries. Use during Atlas/MoO dogfooding, ingestion traces, task creation, artifact mapping, dependency graph updates, and review of generated records."
---

# Atlas Ontology Delta Capture

Use this skill to convert messy work evidence into Atlas state without letting unreviewed material become authoritative.

## Intake Sources

Capture only evidence you can point to:

- User request or pasted spec.
- Repository file, test, issue, PR, or command output.
- Generated artifact from an agent run.
- External connector record, when available.
- Human approval or review note.

If evidence is missing, create a candidate task to gather it rather than inventing a fact.

## Delta Model

Represent each meaningful change as one of:

- `RawExternalRecord`: untrusted connector or issue payload.
- `NormalizedRecord`: parsed, schema-normalized source data.
- `Statement`: claim extracted from evidence.
- `Task`: actionable work with measurable acceptance criteria.
- `Artifact`: file, patch, PR, test output, report, or design document.
- `Assessment`: critic/verifier conclusion.
- `Decision`: selected next action or rejected alternative.
- `Risk`: known hazard, blocker, or policy concern.
- `Agent`: model, orchestrator, or tool actor.

Use the repo's implemented record types if they exist; otherwise capture the structure in the dogfood trace.

## Required Fields

Every delta should include:

- `workspace_id` or equivalent scope.
- `record_type`.
- `title` or short label.
- `source_refs`.
- `lifecycle`: `draft`, `candidate`, `accepted`, `operational`, `deprecated`, or the repo's current vocabulary.
- `review_state`.
- `classification`.
- `created_by` or actor identity.
- `evidence_refs` for accepted claims.

Tasks additionally require:

- measurable acceptance criteria
- dependencies or explicit `none`
- blocked/unblocked state
- owner or responsible orchestrator

## Link Types

Use explicit links instead of embedding relationship prose:

- `derived_from`: normalized or generated record came from source evidence.
- `supports`: evidence supports a statement, task, or decision.
- `contradicts`: evidence challenges a claim or proposed action.
- `depends_on`: task requires another task or artifact.
- `blocks`: risk, task, or policy prevents execution.
- `modifies`: patch or action changes a file/object.
- `produced_by`: artifact was produced by a run, orchestrator, or agent.
- `verified_by`: artifact or decision is supported by a test, review, or verifier.
- `audited_by`: record is covered by a trace or audit event.

## Classification Propagation

Derived records inherit the strictest classification of their parents unless a documented declassification decision exists.

Never downgrade:

- private repository source into public summaries
- proprietary code into unrestricted model output
- security findings into public issue text
- user-provided secrets into any generated artifact

## Authority Gate

Before using a record to choose or execute a next action, check:

1. Is the record accepted or operational?
2. Does it have required evidence?
3. Does its classification permit the proposed consumer?
4. Does a policy, blocker, or unresolved contradiction prevent use?

If any answer fails, the record can inform analysis but cannot drive execution.

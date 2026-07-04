# Atlas Outputs

`outputs/` is the customer-facing product shelf for Atlas. Think of it as the place where finished
Atlas work is assembled into things a customer, investor, teammate, or evaluator can inspect:
website, app, docs, codebase notes, demos, packages, and proofs.

This folder is intentionally not a scratchpad and not the primary runtime store. Raw exploration can
live in chat, local notes, candidate records, or internal state files. `outputs/` is for polished
deliverables and the evidence that they are ready to show.

## Contract

- `site/` contains the public website/landing-page output direction, comparable to `matrix.build`.
- `app/` contains the customer-facing Atlas app surface and how to run or inspect it.
- `docs/` contains finished product, architecture, and operating documents intended to be read.
- `codebase/` explains the implementation package a technical customer or reviewer should inspect.
- `demos/` contains demo scripts, scenarios, screenshots, or walkthrough pointers.
- `proofs/` contains verification evidence that customer-facing outputs are real.
- `internal/` contains agent recovery state and next-action files. It supports the work but is not
  itself the customer-facing product.

## Completion Rule

A customer-facing output belongs here only when it has:

1. A concrete output or artifact.
2. A clear audience and use case.
3. A run, preview, or inspection path.
4. Verification evidence or an explicit residual-risk note.
5. A status: draft, preview, accepted, operational, or deprecated.

## Current Outputs

| Output | Purpose |
| --- | --- |
| `site/README.md` | Public website direction and current status. |
| `app/README.md` | Customer-facing Atlas app surface and run path. |
| `docs/LONG_RUNNING_WORK.md` | Finished product note for long-horizon Atlas operation. |
| `codebase/README.md` | Technical codebase output package. |
| `demos/README.md` | Demo scenarios and proof walkthroughs. |
| `proofs/VERIFICATION_LEDGER.md` | Gate command ledger for polish program. |
| `proofs/README.md` | Verification and proof ledger rules. |
| `internal/NEXT_ACTION.md` | Internal restart pointer. |
| `internal/README.md` | How bootstrap refreshes local `STATE.md`. |

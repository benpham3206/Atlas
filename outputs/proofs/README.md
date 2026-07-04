# Proof Ledger

Proof is what lets Atlas convert work into memory.

A completed output must include evidence in at least one of these forms:

- Test command and result.
- Lint or static verification result.
- Audit-chain verification.
- Review packet id or file.
- Artifact id, URI, or path.
- Human approval note when the action is irreversible or broad exposure.

## Required Fields

Each proof entry should answer:

```text
What changed?
Who or what acted?
Which workspace or files were touched?
What command or review verified it?
What failed or was skipped?
What is the next action?
```

## Current Proof Entries

### 2026-06-29 - MCP API Tool Coverage

- Changed: `scripts/atlas-mcp-lib.js`, `scripts/test/atlas-mcp-stdio.test.js`
- Verified: `npm run smoke:mcp`, `npm run lint`, `npm test`
- Result: MCP exposes `atlas.api.routes`, `atlas.api.get`, `atlas.api.post`, and `atlas.api.patch`
  over allowlisted API routes, with workspace confinement and structured errors.
- Residual risk: authority-expansion API writes are deliberately absent from MCP until approved.

### 2026-06-29 - Outputs Hardening Surface

- Changed: `outputs/` documentation/state/proof surface.
- Verified: `npm run lint`, `git diff --check`, `npm test`.
- Residual risk: this is a durable file contract; runtime trace records are still the next product
  hardening step.

### 2026-06-29 - Customer-Facing Outputs Reframe

- Changed: top-level `outputs/` now represents customer-facing deliverables: site, app, docs,
  codebase, demos, and proofs.
- Verified: `npm run lint`, `git diff --check`, `npm test`.
- Residual risk: no polished website/app artifact has been built yet; current files define the
  output contract and first product direction.

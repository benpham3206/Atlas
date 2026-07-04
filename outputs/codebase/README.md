# Atlas Codebase Output

This folder describes the technical implementation package a customer, evaluator, or engineering
reviewer should inspect.

## Current Codebase

Path:

```text
/Users/benjaminpham/Documents/Atlas
```

Stack:

- Zero-dependency Node.js monorepo.
- `apps/api`: local API, ontology store, Tool Router, audit, policy, GoalContracts.
- `apps/web`: local dashboard.
- `packages/ontology-core`: shared validation and audit helpers.
- `scripts`: operational bootstrap, MCP adapter, smoke tests, validation.
- `infra/migrations`: static intended database schema.

## Verification Commands

```sh
npm run lint
npm test
npm run smoke:mcp
npm run smoke:operational
npm run verify:migrations
npm run validate:records
```

## Codebase Output Contract

A technical package should include:

- Current branch/commit if applicable.
- Changed files.
- Verification commands and results.
- Known non-goals.
- Security/authority boundaries.
- Review packet or proof entry.


# Brick — P1: Snapshot Atlas, make Paperclip the trunk

**Date:** 2026-06-30 · **Phase:** P1 (of P1→P5 in `outputs/docs/ARCHITECTURE_COMPETITIVE_FRAMEWORK_2026-06-30.md` §7)
**Role:** Architect spec (Hermes). **Implement:** Codex/Cursor. **Authority:** Atlas knowledge + proof layer over the Paperclip control plane.
**Read first:** `outputs/docs/ARCHITECTURE_COMPETITIVE_FRAMEWORK_2026-06-30.md` (§2 foundation, §4 repo map, §8 decisions); `AGENTS.md`; Paperclip docs `https://docs.paperclip.ing/reference/cli/overview`, `.../reference/api/overview`.

## Objective

Make the **Paperclip (MIT) fork the trunk** of `benpham3206/Atlas`, with the current zero-dep Atlas server kept intact as a migration reference. **No Atlas code is grafted in this brick** — that is P2. P1 is: snapshot → fork in → onboard green → SPEC index. Brand stays **The Atlas Project**.

> **Not a git merge.** Paperclip and Atlas are unrelated histories on incompatible stacks. Do **not** run `git merge --allow-unrelated-histories`. Bring Paperclip in as files/subtree and track it via an `upstream` remote.

## Steps

### 1. Snapshot first (safety, recoverable baseline)
- Ensure mainline holds the decision record (PR #22 merged, or branch from it).
- Tag and push:
  ```sh
  git tag -a atlas-pre-paperclip-v0 -m "Last commit before Paperclip becomes the trunk"
  git push origin --tags
  ```
- **Acceptance:** `git tag -l atlas-pre-paperclip-v0` resolves; visible on origin.

### 2. Bring Paperclip in as the trunk
- Fork `paperclipai/paperclip` (MIT) and add it to this repo (recommended: `git subtree add` under a top-level dir, or vendor the fork's contents at root with `apps/api`/`apps/web` retained alongside). Preserve `LICENSE` + add `NOTICE` crediting "MIT © 2026 Paperclip Labs, Inc."
- Add upstream tracking:
  ```sh
  git remote add upstream https://github.com/paperclipai/paperclip.git
  git fetch upstream
  ```
- **Acceptance:** Paperclip `server/`, `ui/`, `cli/`, `packages/adapters/`, `doc/SPEC.md` present; `upstream` remote fetches; MIT license + NOTICE preserved.

### 3. Onboard the control plane locally
- Per Paperclip CLI: `paperclipai onboard` (setup layer, `~/.paperclip`), then `paperclipai doctor`, then `paperclipai run`.
- **Acceptance:** `GET /api/health` returns ok; `GET /api/openapi.json` retrievable; `paperclipai company list` works after `connect`.

### 4. Write the SPEC index
- Create/extend `docs/SPEC.md`: a single living index with columns **surface | Paperclip-base or Atlas-addition | live | stub**, covering Paperclip resources (Companies, Agents, Issues, Approvals, Goals, Costs, Secrets, Activity, Routines, Adapters) and the **Atlas additions to come** (ontology/entities/statements/sources/evidence, `/audit/verify` hash-chain, knowledge tools) marked `stub (P2/P3)`.
- **Acceptance:** `docs/SPEC.md` lists every live Paperclip surface with a real path/endpoint and flags the Atlas additions as not-yet-built.

## Tests / gates
- Paperclip's own test suite green (`npm test` inside the fork per its README).
- `scripts/test/spec-index.test.js` (new, Atlas-side): asserts `docs/SPEC.md` exists and references real Paperclip endpoints (`/api/health`, `/api/companies`) and the named Atlas additions.
- Atlas legacy spine still green (regression): `npm test && npm run lint && npm run smoke:polish && npm run demo:flagship` against `apps/api` unchanged.

## Non-goals (this brick)
- **No** literal git history merge.
- **No** Atlas ontology/audit code grafted (that is **P2**).
- **No** staff/agents or knowledge pack (that is **P3**).
- **No** schema edits to Paperclip; no deletion of `apps/api` yet (kept as reference until parity).
- **No** re-hero copy (that is **P4**).

## Definition of done
Paperclip runs as the trunk, onboarded and green; the current Atlas spine still passes unchanged; `docs/SPEC.md` is the single map of base-vs-additions; `atlas-pre-paperclip-v0` tag is the recoverable pre-shift snapshot.

## Codex/Cursor handoff shell
```text
Implement P1 from:
  docs/bricks/2026-06-30-paperclip-trunk-p1.md

Read first:
  outputs/docs/ARCHITECTURE_COMPETITIVE_FRAMEWORK_2026-06-30.md (§2, §4, §8)
  AGENTS.md
  https://docs.paperclip.ing/reference/cli/overview

Rules:
  - Snapshot tag BEFORE bringing Paperclip in
  - Bring Paperclip in as files/subtree + upstream remote; NO git history merge
  - Preserve MIT LICENSE + NOTICE
  - Do NOT graft Atlas code yet (P2) or touch apps/api behavior
  - Run gates: Paperclip suite + Atlas npm test/lint/smoke:polish/demo:flagship

Deliver: PR — Paperclip trunk + docs/SPEC.md + spec-index test, legacy spine still green
```

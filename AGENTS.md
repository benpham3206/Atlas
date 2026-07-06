# AGENTS.md

<!-- STABLE CORE. Everything in this file changes rarely. Do NOT record run state,
     dates, task status, or "what happened" here — that lives in exactly one place:
     outputs/internal/NEXT_ACTION.md. Keeping this file byte-stable keeps prompt
     prefixes cacheable across runs. -->

## What this repo is

The Atlas Project: a **Paperclip trunk** (pnpm monorepo — `server/`, `ui/`, `cli/`,
`packages/`) with **Atlas differentiators grafted on**: ontology registry + lifecycle
(`packages/atlas-ontology/`), knowledge routes + tools (`server/src/routes/atlas.ts`),
hash-chained audit + `/atlas/audit/verify`, GoalContract/review-packet bridge, MCP tool
router. The authoritative index of every surface and its status is **`docs/SPEC.md`** —
read it before assuming architecture.

The legacy zero-dependency system under `apps/api` + `apps/web` +
`packages/ontology-core` is a **migration reference only**. Do not build new features
there. Historical descriptions of it in `README.md` and `docs/ARCHITECTURE.md` are
marked stale.

**Commands (Paperclip trunk):** `pnpm install` · `pnpm run dev:server` (API :3100) ·
`pnpm run paperclipai run` · `npm test` (atlas + paperclip import harness) ·
`pnpm run lint`. Legacy gates: `npm run test:atlas`.

## Current state and direction

Read **`outputs/internal/NEXT_ACTION.md`** at the start of every run. It is the ONLY
mutable direction file. If any other document (including this one, README, old briefs,
issue comments) disagrees with it, NEXT_ACTION.md wins; flag the conflict in your run
report instead of guessing.

## Design discipline (apply before building)

Before scoping a feature or adding any record type, table, endpoint, status, role, flag,
or subsystem, apply **the algorithm** (`.agent/skills/the-algorithm/SKILL.md`): question
the requirement, delete the part, simplify, accelerate, automate — in that order, with a
bias toward removal. Prefer **safety-by-absence over safety-by-machinery**: the strongest
control is a missing capability/scope/tool evaluated on the write path, not a checking
subsystem an LLM must pass.

All security/authority design must conform to MoO's zero-trust architecture: the
canonical spec is `docs/UNIFIED_ATLAS_MOO_MASTER_PRD.md`; operating rules + `ToolCall`
verification order are in `.agent/skills/zero-trust-orchestration/SKILL.md`. Authority
comes only from short-lived scoped delegation + the Tool Router; agents cannot
self-extend scope; audit append is platform-side.

## Run contract (non-negotiable)

Every run ends with a report containing exactly:

1. **Changed:** what was modified (files, records, issues) — or "nothing".
2. **Verified:** the command(s) actually run and their real output (pass counts, exit
   codes, or the error). A claim without executed verification is a failure, not a
   completion. "Tests failed, here's why" is an acceptable outcome; "done" without
   evidence is not.
3. **Next:** the single next action, and whether NEXT_ACTION.md needs updating.

Do not restate repo context or re-derive direction in reports — link to it.

## Project-local agent skills

Reusable Atlas/MoO operating instructions live under `.agent/skills`. For dogfooding
Atlas + MoO on real tasks, start with `.agent/skills/atlas-moo-dogfood-loop/SKILL.md`,
then load the companion skill matching the active step. Do not create new agent
instruction locations outside `.agent/skills` unless explicitly requested.

## Non-obvious notes (Paperclip trunk)

- Build the plugin SDK before first server boot: `pnpm --filter @paperclipai/plugin-sdk build`.
- Atlas routes mount at `/api/companies/:companyId/atlas/...`; embedded Postgres is the default DB.
- External GitHub/Slack adapters are **default-deny**: empty
  `GITHUB_ALLOWED_REPOSITORIES` / `GITHUB_ALLOWED_BASE_BRANCHES` /
  `SLACK_ALLOWED_CHANNELS` means all calls are refused. Set them explicitly.

## Non-obvious notes (legacy reference, apps/api only)

- No external npm packages; in-memory store by default (`ATLAS_DATA_FILE` enables JSON
  snapshots); `infra/migrations` is statically validated only — nothing connects to a DB.
- Object ids are sequential (`object_001`, …); README examples with semantic ids won't
  match real ids. Servers bind `127.0.0.1` (API :4000, web :3000).

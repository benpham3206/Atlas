# 100X

100X is the Atlas control-plane for the Codex, Cursor Cloud Agents, and Poke interaction workflow.
It is separated from the Atlas product code so agent handoff files, onboarding prompts, and Cursor
configuration can evolve without mixing into runtime packages.

## What lives here

| Path | Purpose |
| --- | --- |
| `100X/AGENTS.md` | Workflow agent rules and handoff expectations |
| `100X/docs/AGENT_WORKFLOW.md` | Operating model, lifecycle, and prompt templates |
| `100X/docs/CODEX_RULES.md` | Codex planning and review rules |
| `100X/tasks/` | Per-task specs, acceptance criteria, and test plans |
| `100X/state/` | Per-task handoff state |
| `100X/logs/` | Per-task command evidence and review notes |
| `100X/onboarding/` | Setup checklists and copy/paste prompts |
| `100X/agents/skills/` | Portable Codex and Cursor skills |
| `100X/cursor/` | Canonical Cursor rules and subagent definitions |
| `100X/codex/prompts/` | Codex review prompts |
| `100X/STATE.md`, `100X/LOGS.md`, `100X/POKE_SUMMARY.md` | Short workflow indexes and latest Poke summary |

## What stays at the repo root

| Path | Purpose |
| --- | --- |
| `AGENTS.md` | Atlas runtime constraints for Cloud Agents |
| `TASKS.md` | Atlas implementation queue |
| `CONTEXT_LOG.md` | Historical Atlas evidence log |
| `docs/ARCHITECTURE.md` | Atlas product architecture |
| `.cursor/rules/` | Cursor discovery layer that points agents at `100X/` |

## Read in this order

1. Root `AGENTS.md`
2. `100X/AGENTS.md`
3. `100X/docs/AGENT_WORKFLOW.md`
4. `TASKS.md` and `CONTEXT_LOG.md`
5. `100X/onboarding/README.md` for setup validation

## Operating model

```text
Human
  -> Poke intake and status
  -> local Codex: architecture, atomic planning, review
  -> Cursor Cloud: implement Codex-planned tasks
  -> verification and independent review
  -> 100X task/state/log updates and POKE_SUMMARY.md
  -> Poke status back to human
```

Atlas product work and agent workflow work share root trackers (`TASKS.md`, `CONTEXT_LOG.md`) but
keep durable workflow handoff detail under `100X/`.

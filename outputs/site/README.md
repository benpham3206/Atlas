# Atlas Site Output

This folder is for the public-facing Atlas website output.

The reference quality bar is a site like `https://matrix.build/`: clear product positioning,
confident structure, strong visual identity, and a concrete operating model. Atlas should present
its structure as the product:

```text
Workspace brain
-> Memory and skills
-> Runtime command plane
-> Long-running orchestrators
-> Scoped worker pool
-> Proof loop
-> Customer-facing outputs
```

## Current Status

**Status:** E7-T1 complete — minimal static page (`index.html`) + `scripts/test/site-smoke.test.js`

Open `outputs/site/index.html` in a browser (no server required). Runnable product surface remains `outputs/app/RUN_PATH.md` and `:3000` file-tree.

**Checklist (E7-T1):**

- [x] Monospace / dark theme, no external assets
- [x] Sections **01** workspace brain · **02** control plane · **03** proof · **04** try locally
- [x] Section 04 links `../app/RUN_PATH.md` (`outputs/app/RUN_PATH.md`)
- [x] `GoalContract` in page copy
- [x] `scripts/test/site-smoke.test.js` — file exists + GoalContract (+ RUN_PATH, sections 01/04)

**Checklist (E7-T2):** matrix-hermes craft bar cited in footer · RUN_PATH called out in README · site-smoke test green.

## Site Output Contract

A website output should include:

- Source path or deployment URL.
- Preview/run command.
- Primary audience.
- Core message.
- Screenshots or inspection notes.
- Verification result.
- Known residual risk.

## Candidate First Page

Title:

```text
Atlas: the workspace brain for long-running agent work
```

Promise:

```text
Not a chatbot. A governed operating layer that turns goals, tools, evidence, and memory into
auditable work.
```

Primary sections:

1. Company/workspace context enters Atlas.
2. GoalContracts and memory constrain the work.
3. Tool Router and MCP execute through scoped authority.
4. Long-running orchestrators maintain state across time horizons.
5. Proof packets turn output into memory.


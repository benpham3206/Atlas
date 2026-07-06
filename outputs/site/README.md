# Atlas Site Output

This folder is the public-facing Atlas landing slice — proof-closed encyclopedia framing, not
agent-company metaphor. Copy direction: `outputs/docs/ARCHITECTURE_COMPETITIVE_FRAMEWORK_2026-06-30.md`
§1.1 (knowledge-tier table wedge).

**Hero wedge (§1.1):** *Wikidata's structured truth + Britannica's authority + Grokipedia's agent-scale
authoring + Wikipedia's openness — made honest by proof.*

**Dashboard hero (PA-P4a):** lead with proof-closed knowledge — structured graph, governed staff,
evidence-gated lifecycle, hash-chained audit — before control-plane or hire-company language.

## Current Status

**Status:** PA-P4 — encyclopedia hero on `index.html` + `scripts/test/site-smoke.test.js`

Open `outputs/site/index.html` in a browser (no server required). Fork index and fixtures:
[`docs/SPEC.md`](../../docs/SPEC.md) ·
[`tests/fixtures/public-atlas-staff.json`](../../tests/fixtures/public-atlas-staff.json) ·
[`tests/fixtures/encyclopedia-knowledge-pack.json`](../../tests/fixtures/encyclopedia-knowledge-pack.json)

**Checklist (PA-P4):**

- [x] Monospace / dark theme, no external assets
- [x] Sections **01** knowledge tier · **02** governed staff · **03** proof-closed · **04** fork & run
- [x] Section 04 links `docs/SPEC.md`, staff manifest, knowledge pack, `RUN_PATH.md`
- [x] Hero terms: knowledge, evidence, audit (proof-closed positioning)
- [x] `scripts/test/site-smoke.test.js` — file exists + encyclopedia framing assertions

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
Atlas — proof-closed knowledge encyclopedia
```

Promise:

```text
Proof-closed knowledge: structured graph, governed agent staff, hash-chained audit. Nothing becomes
canon without traced source + evidence.
```

Primary sections:

1. Knowledge tier — structured graph beside Wikipedia, Wikidata, Britannica, Grokipedia.
2. Governed staff — scoped hires under lifecycle gates, not crowd or opaque model authorship.
3. Proof-closed — source + evidence on every statement; hash-chained audit verify.
4. Fork & run — `paperclipai onboard` → entity → derived page → audit verify (see SPEC + fixtures).

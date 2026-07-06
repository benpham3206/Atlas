# Atlas North Star — the plain-language version

*Written 2026-07-02 from Ben's own framing. If any other doc conflicts with this one on
"why Atlas exists," this one wins. Agents: read this before strategy or product work.*

## Why Atlas exists (three sentences)

Atlas is a public, structured map of human knowledge — a Palantir-style ontology over
concepts, claims, and evidence — built so that **both humans and agents** can trust it
and act on it. It is **civilization-rebuild insurance**: if we lost everything
(Dr. Stone scenario), a survivor with Atlas should be able to rebuild from first
principles and skip orders of magnitude of trial, error, and hardship, because the
knowledge is stored *with its dependency order* — what you must understand or build
before what. And in ordinary times, that same structure is a **learning accelerator**:
fields that take decades to absorb without a map become navigable paths — concept by
concept, prerequisite by prerequisite.

## What makes it different (the wedge)

Wikipedia has openness, Wikidata has structure, Britannica has authority, Grokipedia has
agent-scale authoring. Atlas's addition is **proof**: nothing becomes canon without a
traced, evidenced, reviewed, hash-chained path. You can ask *"why should I believe
this?"* of any statement and get a real answer — source, evidence, reviewer, audit
record. That's what makes it safe for agents to build on and worth trusting after the
apocalypse.

## What the structure must support (product requirements the mission implies)

1. **Dependency edges, not just facts.** Entities and statements need
   `depends_on` / `enables` / `derived_from` relations so knowledge is stored as a
   buildable tech-and-concept tree, not a pile of articles. This is the Dr. Stone
   requirement, and it is also exactly what a learning path needs.
2. **Rebuild paths and learning paths are the same render.** Given a target (germ
   theory, semiconductors, calculus), Atlas walks the dependency graph backwards and
   emits an ordered path. One renderer, two audiences: survivor and student.
3. **Proof-closed canon.** Candidate → evidenced → reviewed → promoted → hash-chained.
   Already built; never compromised for growth.
4. **Depth-first domains.** "All of humanity's knowledge" is the direction, not the v1
   scope. We win by making single domains *complete and dependency-ordered* (one field
   done to Grokipedia depth beats a million stubs).

## The polish bar

Two separate bars — don't confuse them:

- **Product polish** (the software, the site): the finished-product feel of
  paperclip.ing, matrix.build, or Hermes Agent. Fast, designed, obvious, no
  scaffolding showing. The public read slice is not "done" when it renders — it is done
  when a stranger would bookmark it.
- **Content trust** (the knowledge itself): Wikipedia/Wikidata-level reliability with
  Grokipedia-level depth per covered domain, plus the proof layer neither has.

## Stack, in one line each

- **Paperclip** (this fork) — the agent-company control plane running the org: issues,
  goals, approvals, heartbeats. ~80% reused, not rebuilt.
- **Atlas ontology + proof layers** (`packages/atlas-ontology/`, audit chain) — the 20%
  that makes it a knowledge system: records, lifecycle, evidence, hash-chained audit.
- **Agents** — CEO/CoS, Founding Engineer, Knowledge Editor, Verifier, Public Site
  Builder — run through the Hermes gateway on `grok-composer-2.5-fast` by default.

## Board cheat sheet (plain English, 2026-07-02)

| Issue | What it actually means |
|-------|------------------------|
| ATL-21 | The proof-checker (Verifier) still has to sign off that the first knowledge pack's audit chain is genuinely valid. **Blocking everything.** |
| ATL-8 | Ship the first thing a human can actually browse — the public read slice. |
| ATL-17 / ATL-22 | Stale "review the reviewers" busywork — being closed with one-line verdicts. |
| ATL-23 | The standing state + direction brief (order of operations for the team). |
| ATL-12 | Decide whether Enterprise Atlas is worth anything (default: no). |
| ATL-10 | Private Atlas — deliberately frozen until the public side ships. |
| ATL-9 / ATL-11 | Plumbing: move task tracking fully into Paperclip; harden the Hermes↔Paperclip link. |

# State of Atlas + direction — 2026-07-02 (from Ben, via Claude Code)

Injected alongside issue **ATL-23**. This is the operating brief for the whole team; the
expanded company context (mission, wedge, fork rationale, three product lines) is now in
every agent's AGENTS.md — re-read yours before delegating or executing.

## Where we are

**Repo (`TASKS.md`):** PA-P0 through PA-P4 epic gates have all passed. The encyclopedia
MVP loop is proven end-to-end (`npm run test:paperclip:import` — 52 pass): knowledge
routes, lifecycle gate (candidate cannot publish), hash-chained audit +
`/atlas/audit/verify`, `search_records`/`attach_evidence` tools, bounded traverse
(depth 2), entity page renderer, re-heroed site copy. PA-P5 hardening and PS-* (Private
Atlas) are deliberately deferred.

**Board:** ATL-1/2/3/4/6/7/13/14/15/16/19/20 done. ATL-18 (audit event_hash mismatch)
was marked done but never confirmed fixed on the actual canon pack. Open: ATL-21
(Verifier sign-off — blocking proof), ATL-8 (public read slice — next real ship),
ATL-17/ATL-22 (productivity reviews, churn-flagged by anomaly detection), ATL-12
(enterprise moat go/no-go), ATL-9 (migrate task tracking), ATL-11 (Hermes integration
hardening). ATL-10 (Private Atlas) backlog — blocked by design.

## Direction (ordered — work top to bottom)

1. **Proof green first.** Close ATL-21: Verifier runs audit verify + `validate:records`
   against the live seeded pack and posts evidence on the issue. As part of this,
   re-verify ATL-18's fix against the actual canon pack — if the hash chain doesn't
   verify there, reopen ATL-18. Nothing else counts until the proof layer is
   demonstrably honest.
2. **Ship ATL-8: the public read slice.** First external artifact of Public Atlas.
   Done means: a person can browse the seeded domain in a browser, and every displayed
   claim traces to source, evidence, lifecycle status, and an audit reference. Keep it
   small and shippable.
3. **Kill the churn.** ATL-17 and ATL-22 get a one-line verdict and close (or cancel).
   Productivity reviews must not outlive the work they review; do not spawn
   review-of-review issues.
4. **Prove the loop generalizes.** Seed a second knowledge domain end-to-end (repeat
   the ATL-7 pattern: draft → evidence → review → promote → render), with the read
   slice picking it up automatically.
5. **ATL-12 (Enterprise moat analysis):** timebox it; default answer is no-go per
   company context.
6. **ATL-10 (Private Atlas) stays blocked** until items 2 and 4 have shipped.

## Operating rules

- Every new issue names its product line (Public Atlas / Private Atlas / Enterprise
  Atlas) in its description. If you can't say which line it serves, ask Ben before
  creating it.
- Verifier gates stay hard: no "done" on proof-adjacent issues without posted evidence
  (audit verify output, test run) on the issue itself.

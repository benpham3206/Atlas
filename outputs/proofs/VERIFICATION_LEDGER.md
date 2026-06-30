# Verification Ledger

Commands that gate the Atlas polish program and customer-facing outputs. Update rows after each gate run (E6 adds automation).

| Gate | Command | Last run | Result | Git SHA |
| --- | --- | --- | --- | --- |
| unit | `npm test` | 2026-06-30 | pass | 50554d3 |
| lint | `npm run lint` | 2026-06-30 | pass | 50554d3 |
| operational | `npm run smoke:operational` | 2026-06-30 | pass | 50554d3 |
| mcp | `npm run smoke:mcp` | 2026-06-30 | pass | 50554d3 |
| personal smoke | `npm run smoke:personal` | 2026-06-30 | pass | 50554d3 |
| polish quickstart | `npm run smoke:polish` | 2026-06-30 | pass | 50554d3 |
| flagship demo | `npm run demo:flagship` | 2026-06-29 | pass | 50554d3 |
| outputs shelf | `node --test scripts/test/outputs-shelf.test.js` | 2026-06-30 | pass | 50554d3 |

## Rules

- A row is **pass** only with exit code 0 and evidence recorded here or in `outputs/proofs/*.log`.
- Do not mark customer-facing outputs accepted until the relevant gate row is green.
- `outputs/internal/STATE.md` is refreshed by bootstrap; this ledger is the durable proof surface.
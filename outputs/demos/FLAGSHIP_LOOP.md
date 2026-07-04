# Flagship Company Loop (live)

Matrix company loop executed against Atlas API + Tool Router. Automate with `npm run demo:flagship`.

| Step | ID | Action | Verification |
| --- | --- | --- | --- |
| 1 | intent | Operational bootstrap objective | `npm run operational:bootstrap` |
| 2 | goal-contract | Active GoalContract on delegation | `list_goal_contracts` MCP or GET goal-contracts |
| 3 | next-action | `get_next_action` tool | task id in stdout |
| 4 | dispatch | Bearer delegation + Tool Router | audit event `agent.tool_call` allow |
| 5 | tool | `submit_artifact` | artifact id returned |
| 6 | proof | `GET /audit/verify` | `{ "valid": true }` |
| 7 | review | `generate_review_packet` | review_packet id in stdout |
| 8 | priority | Next bootstrap rotation | `outputs/internal/NEXT_ACTION.md` |

## Run

```sh
npm run demo:flagship
```

Expect JSON with `artifact_id`, `review_packet_id`, and ledger row updated in `outputs/proofs/VERIFICATION_LEDGER.md`.

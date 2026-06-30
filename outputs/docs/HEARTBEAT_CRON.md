# Paperclip Heartbeat → Hermes Cron

One heartbeat = fetch next-action + post evidence if a task completed. No Atlas cron engine (Algorithm step 2: delete duplicate machinery).

## Atlas endpoints

| Step | Call |
| --- | --- |
| Health | `GET /health` |
| Next action (personal) | `GET /personal/next-action` |
| Next action (operational) | `POST /agent/tools/get_next_action` with delegation Bearer |
| Goal alignment | MCP `list_goal_contracts` or `GET /workspaces/:id/goal-contracts` |
| Hires status | MCP `list_delegations` or `GET /workspaces/:id/agent-delegations` |
| Proof | `GET /audit/verify` |

## Hermes cronjob template

Self-contained prompt (deliver to your home channel):

```text
You are the Atlas System heartbeat. Read outputs/internal/NEXT_ACTION.md.
1. curl -sf http://127.0.0.1:4000/health
2. If ATLAS_DELEGATION_ID set: POST /agent/tools/get_next_action with Bearer token.
   Else: GET /personal/next-action
3. If a task was completed since last run, require artifact_uri + evidence_note before closing.
4. curl http://127.0.0.1:4000/audit/verify — fail closed if invalid.
5. Summarize one paragraph for Ben; link ?view=board if delegation expires within 1h.
Do not revoke delegations (Board human-only).
```

Example Hermes action (adjust deliver origin to your profile):

```json
{
  "action": "cronjob",
  "schedule": "0 */4 * * *",
  "prompt": "<paste template above>",
  "deliver": ["imessage:+1XXXXXXXXXX"]
}
```

See also `docs/examples/hermes-cron-atlas-heartbeat.md`.

## E5-T4 — NEXT_ACTION brief cron

**Task:** Scheduled Hermes job reads `outputs/internal/NEXT_ACTION.md`, probes Atlas health, optionally fetches next-action, and **delivers a one-paragraph summary** to Ben’s channel. No secrets in the prompt or repo — delegation Bearer and phone identifiers live only in Hermes profile env / cron `deliver` config.

### Prompt template (E5-T4)

```text
You are the Atlas System heartbeat (E5-T4).

1. read_file path=~/Documents/Atlas/outputs/internal/NEXT_ACTION.md
2. curl -sf http://127.0.0.1:4000/health — fail closed if down
3. Summarize: the single "Do" line, "Because", and pointer from NEXT_ACTION.md
4. If API healthy: GET http://127.0.0.1:4000/personal/next-action and add one line on ontology spine task title (no tokens)
5. curl -sf http://127.0.0.1:4000/audit/verify — note valid/invalid
6. One short paragraph for Ben; link http://127.0.0.1:3000/?view=board if delegations may expire soon (no IDs in message)
Do not revoke delegations (Board human-only). Do not paste env vars or session file contents.
```

### Hermes cronjob examples (placeholders only)

**iMessage deliver** (replace with your allowlisted origin; never commit real numbers):

```json
{
  "action": "cronjob",
  "schedule": "0 9,17 * * *",
  "prompt": "<paste E5-T4 template above>",
  "deliver": ["imessage:+1XXXXXXXXXX"]
}
```

**Photon deliver** (Hermes Photon bridge — same prompt; configure Photon in Hermes profile, not in Atlas repo):

```json
{
  "action": "cronjob",
  "schedule": "0 */6 * * *",
  "prompt": "<paste E5-T4 template above>",
  "deliver": ["photon"]
}
```

Operational variant (when `ATLAS_DELEGATION_ID` is set in the **Hermes cron environment**, not in git): after step 2, `POST /agent/tools/get_next_action` with Bearer from env instead of personal GET. Keep the same deliver stanza.

### Acceptance

- Cron can run with only `NEXT_ACTION.md` + health + personal next-action (no delegation required).
- Deliver channel configured in Hermes only; Atlas repo docs contain **no** tokens, session JSON, or phone numbers.
- Aligns with Paperclip heartbeat metaphor via Hermes harness — see `outputs/docs/PAPERCLIP_INTEGRATION_OPTIONS.md` (v0 spec-only).

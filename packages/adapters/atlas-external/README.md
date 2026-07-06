# Atlas external adapters (PA-P2M7)

GitHub and Slack integrations for governed agent tools live in the Paperclip server layer:

| Legacy | Port target |
| --- | --- |
| `apps/api/src/github-client.js` | `server/src/atlas/external/github.ts` |
| `apps/api/src/slack-client.js` | `server/src/atlas/external/slack.ts` |

## Routes

- GitHub PR: `POST /api/companies/:companyId/atlas/tools/github.open_pr`
- Slack read: `GET /api/companies/:companyId/atlas/slack/channel?channel_id=...`

## Environment

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Bearer for GitHub REST |
| `GITHUB_ALLOWED_REPOSITORIES` | CSV allowlist |
| `GITHUB_ALLOWED_BASE_BRANCHES` | CSV allowlist |
| `GITHUB_DRY_RUN` | `1` to skip network |
| `SLACK_TOKEN` | Bearer for Slack Web API |
| `SLACK_ALLOWED_CHANNELS` | CSV channel id allowlist |

Policy checks run before outbound calls; denials return structured `{ error, message }` payloads.

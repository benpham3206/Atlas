# Internal Agent Files

Not customer-facing. Supports Hermes-long-horizon recovery and Paperclip-style heartbeat handoffs.

| File | Purpose |
| --- | --- |
| `NEXT_ACTION.md` | Single restart pointer (tracked in git) |
| `STATE.md` | Session snapshot after bootstrap (local only, gitignored) |

Generate `STATE.md`:

```sh
npm run dev:api
npm run operational:bootstrap
```

Or use `npm run dev:personal`, which bootstraps once the API is up.

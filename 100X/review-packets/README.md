# Review Packets

This directory holds generated local Codex review packets.

Cursor Cloud or a local Cursor agent should generate one after implementation and verification:

```sh
npm run 100x:review-packet -- TASK-YYYY-MM-DD-slug --pr <PR_URL_OR_NUMBER>
```

The packet is the automation boundary for the 100X loop:

1. Cursor implements the Codex-planned task.
2. Cursor runs verification and updates task/state/log files.
3. Cursor generates a review packet here.
4. The human opens local Codex and reviews using the packet.
5. Any Codex findings are pasted back into Poke or Cursor for a scoped fix pass.

Codex stays local/manual. Do not place secrets, tokens, environment dumps, or private credentials in
review packets.


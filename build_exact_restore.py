#!/usr/bin/env python3
"""Build exact-findings-restore.json from original-findings-source.json plus finding 20."""

import json
import time
from pathlib import Path

SOURCE_PATH = Path("/workspace/original-findings-source.json")
OUTPUT_PATH = Path("/workspace/exact-findings-restore.json")
WAIT_SECONDS = 180
POLL_INTERVAL = 2

FINDING_20 = {
    "title": (
        "Unauthenticated callers can read allowlisted Slack channel metadata by minting "
        "delegations with slack.read scope"
    ),
    "status": "active",
    "commit_hash": "e79f9aa801478b89c6f5a3b71467bbe2c5da2efb",
    "detected_at_pst": "2026-08-21T10:04:20-07:00",
    "reported_link": "",
    "severity": "medium",
    "attacker": (
        "Any unauthenticated HTTP client that can reach the Atlas API when Slack integration is "
        "configured (SLACK_TOKEN and SLACK_ALLOWED_CHANNELS set)"
    ),
    "controlled_input": (
        "POST /agents to create an agent, then POST /workspaces/{workspace_id}/agent-delegations "
        "with scopes:[\"slack.read\"] and allowed_tools:[\"slack.get_channel_info\"]; use returned "
        "delegation id as Authorization Bearer for POST /agent/tools/slack.get_channel_info with "
        "an allowlisted channel_id"
    ),
    "attack_path": (
        "createAgentDelegation has no authentication gate. Attacker self-mints a delegation granting "
        "slack.read, then calls the agent gateway slack.get_channel_info tool. authorizeAgentTool "
        "accepts the bearer; assertSlackChannelAllowed only checks channel allowlist; "
        "slackClient.getChannelInfo uses the server SLACK_TOKEN to call Slack conversations.info "
        "and returns channel metadata to the attacker."
    ),
    "impact": (
        "Information disclosure from the operator Slack workspace: channel names, topics, membership "
        "counts, and other conversations.info fields for allowlisted channels, using the Atlas "
        "server's Slack token without any legitimate delegation authority."
    ),
    "location": "apps/api/src/agent-gateway.js",
    "evidence": (
        "authorizeAgentTool does not require human approval to mint slack.read delegations. HTTP PoC "
        "on e79f9aa with stub Slack client: unauthenticated delegation mint plus POST "
        "/agent/tools/slack.get_channel_info returned 200 with channel.name secret-ops and triggered "
        "conversations.info using the configured bearer token."
    ),
    "remediation": (
        "Require authenticated human/platform authority to mint delegations with slack.read; remove "
        "slack.get_channel_info from self-service delegation minting surfaces; or disable Slack client "
        "wiring until an auth layer exists."
    ),
}


def wait_for_source() -> None:
    deadline = time.time() + WAIT_SECONDS
    while not SOURCE_PATH.is_file():
        if time.time() >= deadline:
            raise FileNotFoundError(
                f"Source file not found after {WAIT_SECONDS}s: {SOURCE_PATH}"
            )
        time.sleep(POLL_INTERVAL)


def load_source_findings() -> list[dict]:
    with SOURCE_PATH.open(encoding="utf-8") as handle:
        payload = json.load(handle)

    if isinstance(payload, list):
        findings = payload
    elif isinstance(payload, dict) and isinstance(payload.get("findings"), list):
        findings = payload["findings"]
    else:
        raise ValueError("original-findings-source.json must be a list or {\"findings\": [...]}")

    if len(findings) != 19:
        raise ValueError(f"Expected 19 source findings, got {len(findings)}")

    return findings


def main() -> None:
    wait_for_source()
    findings = load_source_findings() + [FINDING_20]

    with OUTPUT_PATH.open("w", encoding="utf-8") as handle:
        json.dump({"findings": findings}, handle, indent=4)
        handle.write("\n")

    print(f"Wrote {len(findings)} findings to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

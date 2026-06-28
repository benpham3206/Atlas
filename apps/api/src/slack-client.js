import { ApiError } from "./ontology-store.js";

export function createSlackClient({ token, fetchImpl = fetch } = {}) {
  if (typeof token !== "string" || token.trim() === "") {
    throw new ApiError(500, "slack_token_missing", "SLACK_TOKEN is required to configure the Slack client");
  }

  const bearer = token.trim();

  return {
    async getChannelInfo(input) {
      const url = new URL("https://slack.com/api/conversations.info");
      url.searchParams.set("channel", input.channel_id);

      if (input.include_num_members === true) {
        url.searchParams.set("include_num_members", "true");
      }

      const response = await fetchImpl(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${bearer}`
        }
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload.ok !== true) {
        throw new ApiError(response.ok ? 502 : response.status, "slack_api_error", "Slack rejected the read request", [
          {
            status: response.status,
            error: payload.error ?? "unknown Slack error"
          }
        ]);
      }

      return {
        provider: "slack",
        channel: payload.channel
      };
    }
  };
}

export function createSlackClientFromEnv(env = process.env) {
  if (!env.SLACK_TOKEN) {
    return null;
  }

  return createSlackClient({ token: env.SLACK_TOKEN });
}

export function createSlackPolicyFromEnv(env = process.env) {
  return {
    allowed_channel_ids: parseCsv(env.SLACK_ALLOWED_CHANNELS)
  };
}

function parseCsv(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

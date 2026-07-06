import { AtlasExternalError } from "./github.js";

export function createSlackClient({ token, fetchImpl = fetch }: { token: string; fetchImpl?: typeof fetch }) {
  const bearer = token.trim();
  if (!bearer) {
    throw new AtlasExternalError(500, "slack_token_missing", "SLACK_TOKEN is required");
  }

  return {
    async getChannelInfo(input: { channel_id: string; include_num_members?: boolean }) {
      const url = new URL("https://slack.com/api/conversations.info");
      url.searchParams.set("channel", input.channel_id);
      if (input.include_num_members === true) {
        url.searchParams.set("include_num_members", "true");
      }
      const response = await fetchImpl(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${bearer}`,
        },
      });
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok || payload.ok !== true) {
        throw new AtlasExternalError(
          response.ok ? 502 : response.status,
          "slack_api_error",
          "Slack rejected the read request",
          { error: payload.error ?? "unknown Slack error" },
        );
      }
      return {
        provider: "slack",
        channel: payload.channel,
      };
    },
  };
}

export function createSlackClientFromEnv(env: NodeJS.ProcessEnv = process.env) {
  if (!env.SLACK_TOKEN) {
    return null;
  }
  return createSlackClient({ token: env.SLACK_TOKEN });
}

export function createSlackPolicyFromEnv(env: NodeJS.ProcessEnv = process.env) {
  return {
    allowed_channel_ids: parseCsv(env.SLACK_ALLOWED_CHANNELS),
  };
}

function parseCsv(value: string | undefined) {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function getSlackChannelInfo(
  input: { channel_id: string; include_num_members?: boolean },
  env: NodeJS.ProcessEnv = process.env,
) {
  const policy = createSlackPolicyFromEnv(env);
  if (!policy.allowed_channel_ids.includes(input.channel_id)) {
    throw new AtlasExternalError(403, "slack_policy_denied", `Channel ${input.channel_id} is not allowed`);
  }
  const client = createSlackClientFromEnv(env);
  if (!client) {
    throw new AtlasExternalError(500, "slack_token_missing", "SLACK_TOKEN is required to read Slack channels");
  }
  return client.getChannelInfo(input);
}

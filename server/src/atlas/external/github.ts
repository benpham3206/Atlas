export class AtlasExternalError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createGitHubClient({ token, fetchImpl = fetch }: { token: string; fetchImpl?: typeof fetch }) {
  const bearer = token.trim();
  if (!bearer) {
    throw new AtlasExternalError(500, "github_token_missing", "GITHUB_TOKEN is required");
  }

  return {
    async openPullRequest(input: {
      repository: string;
      title: string;
      body: string;
      head_branch: string;
      base_branch?: string;
      draft?: boolean;
    }) {
      const response = await fetchImpl(`https://api.github.com/repos/${input.repository}/pulls`, {
        method: "POST",
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${bearer}`,
          "content-type": "application/json",
          "x-github-api-version": "2022-11-28",
        },
        body: JSON.stringify({
          title: input.title,
          body: input.body,
          head: input.head_branch,
          base: input.base_branch ?? "main",
          draft: input.draft !== false,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        throw new AtlasExternalError(response.status, "github_open_pr_failed", "GitHub rejected the pull request request", {
          message: payload.message ?? "unknown GitHub error",
        });
      }
      return {
        provider: "github",
        external_id: String(payload.number ?? payload.id ?? ""),
        url: payload.html_url,
        state: payload.state ?? "open",
      };
    },
  };
}

export function createGitHubClientFromEnv(env: NodeJS.ProcessEnv = process.env) {
  if (!env.GITHUB_TOKEN) {
    return null;
  }
  return createGitHubClient({ token: env.GITHUB_TOKEN });
}

export function createGitHubPolicyFromEnv(env: NodeJS.ProcessEnv = process.env) {
  return {
    allowed_repositories: parseCsv(env.GITHUB_ALLOWED_REPOSITORIES),
    allowed_base_branches: parseCsv(env.GITHUB_ALLOWED_BASE_BRANCHES),
    dry_run: env.GITHUB_DRY_RUN === "1" || env.GITHUB_DRY_RUN === "true",
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

export async function openGitHubPullRequest(
  input: {
    repository: string;
    title: string;
    body: string;
    head_branch: string;
    base_branch?: string;
    dry_run?: boolean;
  },
  env: NodeJS.ProcessEnv = process.env,
) {
  const policy = createGitHubPolicyFromEnv(env);
  if (!policy.allowed_repositories.includes(input.repository)) {
    throw new AtlasExternalError(403, "github_policy_denied", `Repository ${input.repository} is not allowed`);
  }
  const baseBranch = input.base_branch ?? "main";
  if (!policy.allowed_base_branches.includes(baseBranch)) {
    throw new AtlasExternalError(403, "github_policy_denied", `Base branch ${baseBranch} is not allowed`);
  }
  if (input.dry_run === true || policy.dry_run) {
    return {
      provider: "github",
      external_id: "dry-run",
      url: null,
      state: "dry_run",
      dry_run: true,
    };
  }
  const client = createGitHubClientFromEnv(env);
  if (!client) {
    throw new AtlasExternalError(500, "github_token_missing", "GITHUB_TOKEN is required to open a pull request");
  }
  return client.openPullRequest({ ...input, base_branch: baseBranch });
}

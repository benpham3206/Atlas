import { ApiError } from "./ontology-store.js";

export function createGitHubClient({ token, fetchImpl = fetch } = {}) {
  if (typeof token !== "string" || token.trim() === "") {
    throw new ApiError(500, "github_token_missing", "GITHUB_TOKEN is required to configure the GitHub client");
  }

  const bearer = token.trim();

  return {
    async openPullRequest(input) {
      const response = await fetchImpl(`https://api.github.com/repos/${input.repository}/pulls`, {
        method: "POST",
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${bearer}`,
          "content-type": "application/json",
          "x-github-api-version": "2022-11-28"
        },
        body: JSON.stringify({
          title: input.title,
          body: input.body,
          head: input.head_branch,
          base: input.base_branch,
          draft: input.draft !== false
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new ApiError(response.status, "github_open_pr_failed", "GitHub rejected the pull request request", [
          {
            status: response.status,
            message: payload.message ?? "unknown GitHub error"
          }
        ]);
      }

      return {
        provider: "github",
        external_id: String(payload.number ?? payload.id ?? ""),
        url: payload.html_url,
        state: payload.state ?? "open"
      };
    }
  };
}

export function createGitHubClientFromEnv(env = process.env) {
  if (!env.GITHUB_TOKEN) {
    return null;
  }

  return createGitHubClient({ token: env.GITHUB_TOKEN });
}

export function createGitHubPolicyFromEnv(env = process.env) {
  return {
    allowed_repositories: parseCsv(env.GITHUB_ALLOWED_REPOSITORIES),
    allowed_base_branches: parseCsv(env.GITHUB_ALLOWED_BASE_BRANCHES),
    dry_run: env.GITHUB_DRY_RUN === "1" || env.GITHUB_DRY_RUN === "true"
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

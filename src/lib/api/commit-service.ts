import { getApiUrl } from "@/lib/api/get-api-url";

/**
 * Represents a parent commit reference in GitHub commit history.
 *
 * @interface GitHubCommitParent
 * @property {string} sha - The SHA-1 hash of the parent commit.
 */
export interface GitHubCommitParent {
  sha: string;
}

/**
 * Summary data for a GitHub commit entry in list views.
 *
 * @interface GitHubCommitSummary
 * @property {string} sha - Full 40-character SHA-1 commit hash.
 * @property {string} shortSha - Abbreviated commit hash (typically 7 characters).
 * @property {string} message - Commit commit message description.
 * @property {string} authorName - Name of the commit author.
 * @property {string} authorEmail - Email address of the commit author.
 * @property {string} authorDate - ISO-8601 timestamp when the commit was authored.
 * @property {string} [authorAvatar] - URL to the author's GitHub avatar image.
 * @property {string} [authorLogin] - GitHub username handle of the author.
 * @property {string} [authorUrl] - URL to the author's GitHub profile.
 * @property {string} htmlUrl - URL to view the commit on GitHub web interface.
 * @property {string} [statusState] - Combined CI/CD status state (e.g., "success", "failure", "pending").
 * @property {GitHubCommitParent[]} parents - Array of parent commit objects.
 */
export interface GitHubCommitSummary {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  authorDate: string;
  authorAvatar?: string;
  authorLogin?: string;
  authorUrl?: string;
  htmlUrl: string;
  statusState?: string;
  parents: GitHubCommitParent[];
}

/**
 * Line modification statistics for a commit.
 *
 * @interface GitHubCommitStats
 * @property {number} additions - Total number of lines added.
 * @property {number} deletions - Total number of lines removed.
 * @property {number} total - Sum of additions and deletions.
 */
export interface GitHubCommitStats {
  additions: number;
  deletions: number;
  total: number;
}

/**
 * Represents an individual file modified within a GitHub commit.
 *
 * @interface GitHubCommitFile
 * @property {string} filename - Path and name of the modified file.
 * @property {string} status - File change status (e.g., "added", "modified", "removed").
 * @property {number} additions - Number of lines added to this file.
 * @property {number} deletions - Number of lines deleted from this file.
 * @property {number} changes - Total count of line changes in this file.
 * @property {string} [patch] - Raw diff patch text for the changes.
 */
export interface GitHubCommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

/**
 * Detailed information for a single GitHub commit, including file changes and statistics.
 *
 * @interface GitHubCommitDetail
 * @property {string} sha - Full 40-character SHA-1 commit hash.
 * @property {string} shortSha - Abbreviated commit hash.
 * @property {string} message - Full commit message.
 * @property {string} authorName - Author display name.
 * @property {string} authorEmail - Author email address.
 * @property {string} authorDate - ISO-8601 authored timestamp.
 * @property {string} [authorAvatar] - Avatar image URL of the author.
 * @property {string} [authorLogin] - GitHub username of the author.
 * @property {string} [authorUrl] - GitHub profile URL of the author.
 * @property {string} htmlUrl - Web URL on GitHub for the commit.
 * @property {string} [statusState] - Combined CI/CD status state.
 * @property {GitHubCommitStats} [stats] - Additions and deletions breakdown.
 * @property {GitHubCommitFile[]} [files] - List of individual files modified in the commit.
 */
export interface GitHubCommitDetail {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  authorDate: string;
  authorAvatar?: string;
  authorLogin?: string;
  authorUrl?: string;
  htmlUrl: string;
  statusState?: string;
  stats?: GitHubCommitStats;
  files?: GitHubCommitFile[];
}

/**
 * Information regarding a GitHub repository branch.
 *
 * @interface GitHubBranchResponse
 * @property {string} name - Branch name (e.g., "main", "feature/auth").
 * @property {string} commitSha - SHA-1 of the branch tip commit.
 * @property {boolean} protected - Flag indicating if branch protection rules apply.
 */
export interface GitHubBranchResponse {
  name: string;
  commitSha: string;
  protected: boolean;
}

/**
 * GitHub App integration associated with a CI/CD check run.
 *
 * @interface GitHubCheckApp
 * @property {string} name - Name of the GitHub App (e.g., "GitHub Actions").
 */
export interface GitHubCheckApp {
  name: string;
}

/**
 * Represents an individual check run execution on a commit.
 *
 * @interface GitHubCheckRun
 * @property {number} id - Unique numeric identifier of the check run.
 * @property {string} name - Display name of the check run or workflow job.
 * @property {string} headSha - Commit SHA on which the check was executed.
 * @property {string} status - Execution status (e.g., "queued", "in_progress", "completed").
 * @property {string | null} [conclusion] - Outcome conclusion (e.g., "success", "failure", "neutral", "cancelled").
 * @property {string} startedAt - ISO-8601 timestamp when check run started.
 * @property {string | null} [completedAt] - ISO-8601 timestamp when check run completed.
 * @property {string} htmlUrl - URL to view the check run details on GitHub.
 * @property {GitHubCheckApp} app - App metadata associated with the check run.
 */
export interface GitHubCheckRun {
  id: number;
  name: string;
  headSha: string;
  status: string;
  conclusion?: string | null;
  startedAt: string;
  completedAt?: string | null;
  htmlUrl: string;
  app: GitHubCheckApp;
}

/**
 * API response structure containing aggregated check runs and combined state for a commit.
 *
 * @interface GitHubCheckRunsResponse
 * @property {number} totalCount - Total number of check runs found.
 * @property {string} combinedState - Rollup status state (e.g., "success", "failure", "pending").
 * @property {GitHubCheckRun[]} checkRuns - Array of individual check run objects.
 */
export interface GitHubCheckRunsResponse {
  totalCount: number;
  combinedState: string;
  checkRuns: GitHubCheckRun[];
}

/**
 * Extracted owner and repository names parsed from a GitHub URL or identifier string.
 *
 * @interface ParsedRepoUrl
 * @property {string} owner - The repository owner (user or organization).
 * @property {string} repo - The repository name.
 */
export interface ParsedRepoUrl {
  owner: string;
  repo: string;
}

/**
 * Parses a GitHub repository URL or shorthand string into owner and repository components.
 * Supports standard HTTP/HTTPS URLs, www prefixes, trailing slashes, `.git` suffixes, and `owner/repo` formats.
 *
 * @param urlInput - The GitHub URL or shorthand string to parse.
 * @returns The parsed owner and repo, or null if input is invalid.
 *
 * @example
 * ```ts
 * parseGitHubUrl("https://github.com/facebook/react");
 * // => { owner: "facebook", repo: "react" }
 * parseGitHubUrl("facebook/react");
 * // => { owner: "facebook", repo: "react" }
 * ```
 */
export function parseGitHubUrl(urlInput: string): ParsedRepoUrl | null {
  if (!urlInput) return null;
  const cleaned = urlInput.trim().replace(/\/+$/, "");

  const match = cleaned.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/#?]+)||^([^/]+)\/([^/]+)$/,
  );

  if (!match) return null;

  const owner = (match[1] || match[3] || "").trim();
  const repo = (match[2] || match[4] || "").replace(/\.git$/, "").trim();

  if (!owner || !repo) return null;
  return { owner, repo };
}

/**
 * Fetches a paginated list of commits for a specified GitHub repository from the backend API.
 * Supports filtering by branch or comparing against a base branch.
 *
 * @param owner - Repository owner username or organization.
 * @param repo - Repository name.
 * @param branch - Optional target branch or reference name.
 * @param page - Page number for pagination.
 * @param perPage - Number of commit items per page.
 * @param baseBranch - Optional base branch for range comparison.
 * @returns Promise resolving to an array of commit summaries.
 * @throws Throws an error if the HTTP request fails.
 */
export async function fetchRepoCommits(
  owner: string,
  repo: string,
  branch?: string,
  page: number = 1,
  perPage: number = 20,
  baseBranch?: string,
): Promise<GitHubCommitSummary[]> {
  const baseUrl = getApiUrl();
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (branch) {
    if (baseBranch && branch !== baseBranch && !branch.includes("...")) {
      params.set("sha", `${baseBranch}...${branch}`);
    } else {
      params.set("sha", branch);
    }
  }

  const res = await fetch(
    `${baseUrl}/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo,
    )}/commits?${params.toString()}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch commits: HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Fetches detailed metadata for a single commit, including file modifications and diff patches.
 *
 * @param owner - Repository owner username or organization.
 * @param repo - Repository name.
 * @param ref - Commit SHA or reference identifier.
 * @returns Promise resolving to detailed commit metadata.
 * @throws Throws an error if the commit detail cannot be fetched.
 */
export async function fetchCommitDetail(
  owner: string,
  repo: string,
  ref: string,
): Promise<GitHubCommitDetail> {
  const baseUrl = getApiUrl();
  const res = await fetch(
    `${baseUrl}/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo,
    )}/commits/${encodeURIComponent(ref)}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch commit detail: HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Fetches the list of branches available in a GitHub repository.
 *
 * @param owner - Repository owner username or organization.
 * @param repo - Repository name.
 * @returns Promise resolving to an array of branch objects, or empty array on error.
 */
export async function fetchRepoBranches(
  owner: string,
  repo: string,
): Promise<GitHubBranchResponse[]> {
  const baseUrl = getApiUrl();
  const res = await fetch(
    `${baseUrl}/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo,
    )}/branches`,
  );

  if (!res.ok) {
    return [];
  }

  return res.json();
}

/**
 * Fetches CI/CD check runs and combined status associated with a specific commit SHA.
 *
 * @param owner - Repository owner username or organization.
 * @param repo - Repository name.
 * @param refSha - The commit SHA to inspect check runs for.
 * @param force - Whether to bypass cache and force fresh data retrieval.
 * @returns Promise resolving to check run response data.
 * @throws Throws an error if fetching check runs fails.
 */
export async function fetchCommitCheckRuns(
  owner: string,
  repo: string,
  refSha: string,
  force: boolean = false,
): Promise<GitHubCheckRunsResponse> {
  const baseUrl = getApiUrl();
  const query = force ? "?force=true" : "";
  const res = await fetch(
    `${baseUrl}/api/github/repos/${encodeURIComponent(
      owner,
    )}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(
      refSha,
    )}/check-runs${query}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch commit check runs: HTTP ${res.status}`);
  }

  return res.json();
}

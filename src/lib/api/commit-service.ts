import { getApiUrl } from "@/lib/api/get-api-url";

export interface GitHubCommitParent {
  sha: string;
}

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

export interface GitHubCommitStats {
  additions: number;
  deletions: number;
  total: number;
}

export interface GitHubCommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

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

export interface GitHubBranchResponse {
  name: string;
  commitSha: string;
  protected: boolean;
}

export interface GitHubCheckApp {
  name: string;
}

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

export interface GitHubCheckRunsResponse {
  totalCount: number;
  combinedState: string;
  checkRuns: GitHubCheckRun[];
}

export interface ParsedRepoUrl {
  owner: string;
  repo: string;
}

   
                                                            
            
                                                                                                                
                                                                                  
                                                                                           
   
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

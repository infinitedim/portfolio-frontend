import { getApiUrl } from "@/lib/api/get-api-url";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  private: boolean;
  license: {
    name: string;
    url: string;
  } | null;
  default_branch: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  html_url?: string;
}

interface GitHubRepoSummary {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  updated_at: string;
  html_url: string;
}

interface GitHubStatsResponse {
  profile: {
    followers: number;
    following: number;
    publicRepos: number;
  };
  repositories: GitHubRepoSummary[];
  totalStars: number;
  languages: Record<string, number>;
}

interface GitHubUserResponse {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  htmlUrl: string;
  createdAt: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export class GitHubService {
  private static instance: GitHubService;
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000;

  private constructor() {}

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  private get baseUrl(): string {
    return `${getApiUrl()}/api/github`;
  }

  private async makeProxyRequest<T>(path: string): Promise<T> {
    const cacheKey = path;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Portfolio-Terminal-App",
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data as T;
  }

  private mapRepoSummary(repo: GitHubRepoSummary, username: string): GitHubRepo {
    return {
      id: 0,
      name: repo.name,
      full_name: `${username}/${repo.name}`,
      description: repo.description,
      html_url: repo.html_url,
      homepage: null,
      language: repo.language,
      topics: [],
      stargazers_count: repo.stars,
      forks_count: repo.forks,
      watchers_count: repo.stars,
      open_issues_count: 0,
      created_at: repo.updated_at,
      updated_at: repo.updated_at,
      pushed_at: repo.updated_at,
      size: 0,
      archived: false,
      disabled: false,
      fork: false,
      private: false,
      license: null,
      default_branch: "main",
    };
  }

  async getUser(username: string): Promise<GitHubUser> {
    const user = await this.makeProxyRequest<GitHubUserResponse>(
      `/user/${encodeURIComponent(username)}`,
    );
    return {
      login: user.login,
      id: 0,
      avatar_url: user.avatarUrl,
      name: user.name,
      bio: user.bio,
      public_repos: user.publicRepos,
      followers: user.followers,
      following: user.following,
      created_at: user.createdAt,
      updated_at: user.createdAt,
      html_url: user.htmlUrl,
    };
  }

  async getUserRepos(
    username: string,
    _page: number = 1,
    _perPage: number = 100,
  ): Promise<GitHubRepo[]> {
    const stats = await this.makeProxyRequest<GitHubStatsResponse>(
      `/stats/${encodeURIComponent(username)}`,
    );
    return stats.repositories.map((repo) =>
      this.mapRepoSummary(repo, username),
    );
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    const repos = await this.getUserRepos(owner);
    const found = repos.find((r) => r.name.toLowerCase() === repo.toLowerCase());
    if (!found) {
      throw new Error(`Repository ${owner}/${repo} not found`);
    }
    return found;
  }

  async getAllUserRepos(username: string): Promise<GitHubRepo[]> {
    return this.getUserRepos(username);
  }

  async getReposByLanguage(
    username: string,
    language: string,
  ): Promise<GitHubRepo[]> {
    const allRepos = await this.getAllUserRepos(username);
    return allRepos.filter(
      (repo) =>
        repo.language && repo.language.toLowerCase() === language.toLowerCase(),
    );
  }

  async getStats(username: string): Promise<GitHubStatsResponse> {
    return this.makeProxyRequest<GitHubStatsResponse>(
      `/stats/${encodeURIComponent(username)}`,
    );
  }

  async getRepoCommits(
    _owner: string,
    _repo: string,
    _page: number = 1,
    _perPage: number = 10,
  ): Promise<GitHubCommit[]> {
    throw new Error("Commits are not available via the backend GitHub proxy");
  }

  async getRepoLanguages(
    _owner: string,
    _repo: string,
  ): Promise<Record<string, number>> {
    throw new Error("Languages are not available via the backend GitHub proxy");
  }

  async searchRepos(
    _query: string,
    _page: number = 1,
    _perPage: number = 30,
  ): Promise<{
    total_count: number;
    items: GitHubRepo[];
  }> {
    throw new Error("Search is not available via the backend GitHub proxy");
  }

  async getUserStarredRepos(
    _username: string,
    _page: number = 1,
    _perPage: number = 100,
  ): Promise<GitHubRepo[]> {
    throw new Error("Starred repos are not available via the backend GitHub proxy");
  }

  async getUserGists(
    _username: string,
    _page: number = 1,
    _perPage: number = 100,
  ): Promise<unknown[]> {
    throw new Error("Gists are not available via the backend GitHub proxy");
  }

  async getRepoTopics(
    _owner: string,
    _repo: string,
  ): Promise<{ names: string[] }> {
    throw new Error("Topics are not available via the backend GitHub proxy");
  }

  async getReposByTopic(
    username: string,
    topic: string,
  ): Promise<GitHubRepo[]> {
    const allRepos = await this.getAllUserRepos(username);
    return allRepos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(topic.toLowerCase()) ||
        (repo.description?.toLowerCase().includes(topic.toLowerCase()) ??
          false),
    );
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearCacheForEndpoint(endpoint: string): void {
    this.cache.delete(endpoint);
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

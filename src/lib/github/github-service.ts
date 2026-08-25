import { getApiUrl } from "@/lib/api/get-api-url";

/**
 * Represents detailed repository information returned by the GitHub API.
 * Contains metadata about repository identity, statistics, configuration, and status.
 */
export interface GitHubRepo {
  /** The unique numeric ID of the repository assigned by GitHub. */
  id: number;
  /** The name of the repository (e.g., "portfolio-frontend"). */
  name: string;
  /** The full repository name including owner (e.g., "infinitedim/portfolio-frontend"). */
  full_name: string;
  /** Short summary description of the repository, or null if unset. */
  description: string | null;
  /** The direct URL to the repository web page on GitHub. */
  html_url: string;
  /** The optional homepage or live deployment URL for the repository. */
  homepage: string | null;
  /** The primary programming language of the repository. */
  language: string | null;
  /** Array of topic tags associated with the repository. */
  topics: string[];
  /** Total number of stars (stargazers) received by the repository. */
  stargazers_count: number;
  /** Total number of forks created from this repository. */
  forks_count: number;
  /** Total number of users watching the repository. */
  watchers_count: number;
  /** Total count of currently open issues and pull requests. */
  open_issues_count: number;
  /** ISO 8601 timestamp string indicating when the repository was created. */
  created_at: string;
  /** ISO 8601 timestamp string indicating when the repository was last updated. */
  updated_at: string;
  /** ISO 8601 timestamp string indicating when the last commit was pushed. */
  pushed_at: string;
  /** Total size of the repository in kilobytes. */
  size: number;
  /** Indicates whether the repository has been archived. */
  archived: boolean;
  /** Indicates whether the repository is disabled. */
  disabled: boolean;
  /** Indicates whether the repository is a fork of another project. */
  fork: boolean;
  /** Indicates whether the repository is private or publicly visible. */
  private: boolean;
  /** License details for the repository, or null if unlicensed. */
  license: {
    /** The standard SPDX identifier or display name of the license. */
    name: string;
    /** The URL to the license definition or terms. */
    url: string;
  } | null;
  /** The default git branch name (e.g., "main" or "master"). */
  default_branch: string;
}

/**
 * Represents a GitHub user profile with metadata and public metrics.
 */
export interface GitHubUser {
  /** The GitHub username / handle. */
  login: string;
  /** Unique numeric ID of the user. */
  id: number;
  /** URL pointing to the user's avatar image. */
  avatar_url: string;
  /** Full display name of the user, or null if unset. */
  name: string | null;
  /** Short biography text of the user, or null if unset. */
  bio: string | null;
  /** Count of public repositories owned by the user. */
  public_repos: number;
  /** Total number of followers. */
  followers: number;
  /** Total number of users followed by this user. */
  following: number;
  /** ISO 8601 timestamp string of profile creation date. */
  created_at: string;
  /** ISO 8601 timestamp string of last profile update. */
  updated_at: string;
  /** Direct link to the user's GitHub profile page. */
  html_url?: string;
}

/**
 * Condensed summary of repository details returned by the backend proxy.
 */
interface GitHubRepoSummary {
  /** The name of the repository. */
  name: string;
  /** Short description of the repository, or null if empty. */
  description: string | null;
  /** Total star count for the repository. */
  stars: number;
  /** Total fork count for the repository. */
  forks: number;
  /** Primary programming language used in the repository. */
  language: string | null;
  /** ISO 8601 timestamp string representing the last update time. */
  updated_at: string;
  /** Direct web URL to the repository on GitHub. */
  html_url: string;
}

/**
 * Aggregated GitHub statistical payload returned by the portfolio backend proxy endpoint.
 */
interface GitHubStatsResponse {
  /** User profile metrics overview. */
  profile: {
    /** Follower count. */
    followers: number;
    /** Following count. */
    following: number;
    /** Public repositories count. */
    publicRepos: number;
  };
  /** List of repository summaries belonging to the user. */
  repositories: GitHubRepoSummary[];
  /** Total cumulative stars across all user repositories. */
  totalStars: number;
  /** Map of programming language names to line counts or usage weights. */
  languages: Record<string, number>;
}

/**
 * Schema representing the backend proxy's user profile response.
 */
interface GitHubUserResponse {
  /** The GitHub username / handle. */
  login: string;
  /** Full display name of the user. */
  name: string | null;
  /** URL to the avatar image. */
  avatarUrl: string;
  /** User biography text. */
  bio: string | null;
  /** Total number of public repositories. */
  publicRepos: number;
  /** Total number of followers. */
  followers: number;
  /** Total number of following users. */
  following: number;
  /** Direct URL to user profile on GitHub. */
  htmlUrl: string;
  /** Account creation ISO timestamp. */
  createdAt: string;
}

/**
 * Represents a single Git commit object on GitHub.
 */
export interface GitHubCommit {
  /** SHA-1 hash of the commit. */
  sha: string;
  /** Commit message and author details stored in Git. */
  commit: {
    /** The commit message string. */
    message: string;
    /** Git commit author details. */
    author: {
      /** Author display name. */
      name: string;
      /** Author email address. */
      email: string;
      /** ISO 8601 timestamp when commit was authored. */
      date: string;
    };
  };
  /** GitHub user associated with the commit author, or null if unlinked. */
  author: {
    /** Author GitHub username. */
    login: string;
    /** Author avatar image URL. */
    avatar_url: string;
  } | null;
}

/**
 * Service class responsible for fetching GitHub data through the backend API proxy.
 * Implements client-side in-memory caching to minimize redundant proxy requests.
 */
export class GitHubService {
  /** Singleton instance of the GitHubService. */
  private static instance: GitHubService;
  /** In-memory cache map storing responses and their acquisition timestamps. */
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  /** Cache expiration duration in milliseconds (5 minutes). */
  private cacheTimeout = 5 * 60 * 1000;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {}

  /**
   * Retrieves the singleton instance of the GitHubService.
   * @returns The shared GitHubService singleton instance.
   */
  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  /**
   * Constructs the base URL for GitHub proxy API calls using the configured API URL.
   * @returns The base URL for the GitHub proxy API.
   */
  private get baseUrl(): string {
    return `${getApiUrl()}/api/github`;
  }

  /**
   * Executes a cached HTTP GET request against the backend GitHub proxy endpoint.
   * @template T - The expected return type of the deserialized JSON response.
   * @param path - The sub-path to append to the proxy base URL.
   * @returns Promise resolving to the typed response payload.
   * @throws {Error} Throws an error if the network response is not OK.
   */
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

  /**
   * Maps a simplified GitHubRepoSummary object into a full GitHubRepo structure.
   * @param repo - The summary object received from the proxy.
   * @param username - The owner username associated with the repository.
   * @returns A complete GitHubRepo representation with default values for omitted fields.
   */
  private mapRepoSummary(
    repo: GitHubRepoSummary,
    username: string,
  ): GitHubRepo {
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

  /**
   * Fetches user profile information for a given GitHub username.
   * @param username - The GitHub handle of the user to fetch.
   * @returns Promise resolving to user profile details.
   */
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

  /**
   * Fetches public repositories for a specified GitHub user through the stats endpoint.
   * @param username - The GitHub username whose repositories are being requested.
   * @param _page - Page number for pagination (unused by current backend proxy).
   * @param _perPage - Item count per page (unused by current backend proxy).
   * @returns Promise resolving to an array of GitHubRepo objects.
   */
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

  /**
   * Fetches detailed information for a single repository by owner and repo name.
   * @param owner - The owner username or organization name.
   * @param repo - The repository name.
   * @returns Promise resolving to the matched GitHubRepo object.
   * @throws {Error} Throws an error if the repository is not found.
   */
  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    const repos = await this.getUserRepos(owner);
    const found = repos.find(
      (r) => r.name.toLowerCase() === repo.toLowerCase(),
    );
    if (!found) {
      throw new Error(`Repository ${owner}/${repo} not found`);
    }
    return found;
  }

  /**
   * Fetches all repositories for a user without pagination constraints.
   * @param username - The GitHub username.
   * @returns Promise resolving to all user repositories.
   */
  async getAllUserRepos(username: string): Promise<GitHubRepo[]> {
    return this.getUserRepos(username);
  }

  /**
   * Filters and returns repositories belonging to a user that match a specific programming language.
   * @param username - The GitHub username.
   * @param language - The programming language name (case-insensitive) to filter by.
   * @returns Promise resolving to matching repositories.
   */
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

  /**
   * Retrieves comprehensive GitHub statistics including profile metrics and language distribution.
   * @param username - The GitHub username to query.
   * @returns Promise resolving to aggregate GitHub statistics.
   */
  async getStats(username: string): Promise<GitHubStatsResponse> {
    return this.makeProxyRequest<GitHubStatsResponse>(
      `/stats/${encodeURIComponent(username)}`,
    );
  }

  /**
   * Fetches commits for a specific repository.
   * @param _owner - Repository owner.
   * @param _repo - Repository name.
   * @param _page - Page number.
   * @param _perPage - Commits per page.
   * @returns Promise resolving to commit objects.
   * @throws {Error} Throws an error because commits are not supported via the proxy.
   */
  async getRepoCommits(
    _owner: string,
    _repo: string,
    _page: number = 1,
    _perPage: number = 10,
  ): Promise<GitHubCommit[]> {
    throw new Error("Commits are not available via the backend GitHub proxy");
  }

  /**
   * Fetches programming language breakdown for a repository.
   * @param _owner - Repository owner.
   * @param _repo - Repository name.
   * @returns Language name to byte count mapping.
   * @throws {Error} Throws an error because individual repository languages are not supported via the proxy.
   */
  async getRepoLanguages(
    _owner: string,
    _repo: string,
  ): Promise<Record<string, number>> {
    throw new Error("Languages are not available via the backend GitHub proxy");
  }

  /**
   * Searches repositories matching a query string.
   * @param _query - Search query string.
   * @param _page - Page number.
   * @param _perPage - Results per page.
   * @returns Search result containing count and repositories.
   * @throws {Error} Throws an error because search is not supported via the proxy.
   */
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

  /**
   * Fetches starred repositories for a user.
   * @param _username - GitHub username.
   * @param _page - Page number.
   * @param _perPage - Results per page.
   * @returns Array of starred repositories.
   * @throws {Error} Throws an error because starred repositories are not supported via the proxy.
   */
  async getUserStarredRepos(
    _username: string,
    _page: number = 1,
    _perPage: number = 100,
  ): Promise<GitHubRepo[]> {
    throw new Error(
      "Starred repos are not available via the backend GitHub proxy",
    );
  }

  /**
   * Fetches public gists for a user.
   * @param _username - GitHub username.
   * @param _page - Page number.
   * @param _perPage - Results per page.
   * @returns Array of gists.
   * @throws {Error} Throws an error because gists are not supported via the proxy.
   */
  async getUserGists(
    _username: string,
    _page: number = 1,
    _perPage: number = 100,
  ): Promise<unknown[]> {
    throw new Error("Gists are not available via the backend GitHub proxy");
  }

  /**
   * Fetches topics tagged on a repository.
   * @param _owner - Repository owner.
   * @param _repo - Repository name.
   * @returns Object containing topic names array.
   * @throws {Error} Throws an error because topic endpoint is not supported via the proxy.
   */
  async getRepoTopics(
    _owner: string,
    _repo: string,
  ): Promise<{ names: string[] }> {
    throw new Error("Topics are not available via the backend GitHub proxy");
  }

  /**
   * Filters and returns repositories matching a specific topic or keyword in their name/description.
   * @param username - GitHub username to search repositories for.
   * @param topic - Topic keyword to match against repository name or description.
   * @returns Promise resolving to matching repositories.
   */
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

  /**
   * Clears all cached response entries from the internal memory store.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clears the cached response for a specific endpoint path.
   * @param endpoint - The relative endpoint path key to evict from cache.
   */
  clearCacheForEndpoint(endpoint: string): void {
    this.cache.delete(endpoint);
  }

  /**
   * Returns metadata and metrics about current cache state.
   * @returns Object containing cache size and list of active cache keys.
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}


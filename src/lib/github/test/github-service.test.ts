import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GitHubService } from "../github-service";

describe("github/github-service", () => {
  let service: GitHubService;

  beforeEach(() => {
    service = GitHubService.getInstance();
    service.clearCache();
  });

  it("getInstance should return singleton instance", () => {
    const instance2 = GitHubService.getInstance();
    expect(service).toBe(instance2);
  });

  it("getUser should fetch user profile from backend proxy and map fields", async () => {
    const mockUserResp = {
      login: "infinitedim",
      name: "Dimas Saputra",
      avatarUrl: "https://example.com/avatar.jpg",
      bio: "Software Engineer",
      publicRepos: 25,
      followers: 100,
      following: 50,
      htmlUrl: "https://github.com/infinitedim",
      createdAt: "2020-01-01T00:00:00Z",
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify(mockUserResp), { status: 200 }),
    ) as unknown as typeof fetch;

    try {
      const user = await service.getUser("infinitedim");
      expect(user.login).toBe("infinitedim");
      expect(user.avatar_url).toBe("https://example.com/avatar.jpg");
      expect(user.public_repos).toBe(25);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getUserRepos should fetch stats and map repo summaries", async () => {
    const mockStats = {
      profile: { followers: 100, following: 50, publicRepos: 2 },
      repositories: [
        {
          name: "portfolio-frontend",
          description: "Next.js UI",
          stars: 15,
          forks: 3,
          language: "TypeScript",
          updated_at: "2026-08-01",
          html_url: "https://github.com/infinitedim/portfolio-frontend",
        },
        {
          name: "portfolio-backend",
          description: "Rust API",
          stars: 20,
          forks: 5,
          language: "Rust",
          updated_at: "2026-08-01",
          html_url: "https://github.com/infinitedim/portfolio-backend",
        },
      ],
      totalStars: 35,
      languages: { TypeScript: 1, Rust: 1 },
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify(mockStats), { status: 200 }),
    ) as unknown as typeof fetch;

    try {
      const repos = await service.getUserRepos("infinitedim");
      expect(repos).toHaveLength(2);
      expect(repos[0].name).toBe("portfolio-frontend");
      expect(repos[0].stargazers_count).toBe(15);

      const found = await service.getRepo("infinitedim", "portfolio-backend");
      expect(found.language).toBe("Rust");

      await expect(service.getRepo("infinitedim", "non-existent")).rejects.toThrow(
        "Repository infinitedim/non-existent not found",
      );

      const tsRepos = await service.getReposByLanguage("infinitedim", "TypeScript");
      expect(tsRepos).toHaveLength(1);

      const topicRepos = await service.getReposByTopic("infinitedim", "frontend");
      expect(topicRepos).toHaveLength(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getStats should fetch and cache stats data", async () => {
    const mockStats = {
      profile: { followers: 10, following: 5, publicRepos: 1 },
      repositories: [],
      totalStars: 10,
      languages: {},
    };

    let fetchCount = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async () => {
      fetchCount++;
      return new Response(JSON.stringify(mockStats), { status: 200 });
    }) as unknown as typeof fetch;

    try {
      const stats1 = await service.getStats("infinitedim");
      expect(stats1.totalStars).toBe(10);
      expect(fetchCount).toBe(1);

                                     
      const stats2 = await service.getStats("infinitedim");
      expect(stats2.totalStars).toBe(10);
      expect(fetchCount).toBe(1);

      const cacheStats = service.getCacheStats();
      expect(cacheStats.size).toBe(1);

      service.clearCacheForEndpoint("/stats/infinitedim");
      expect(service.getCacheStats().size).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("unsupported GitHub proxy endpoints should throw descriptive errors", async () => {
    await expect(service.getRepoCommits("a", "b")).rejects.toThrow("Commits are not available");
    await expect(service.getRepoLanguages("a", "b")).rejects.toThrow("Languages are not available");
    await expect(service.searchRepos("q")).rejects.toThrow("Search is not available");
    await expect(service.getUserStarredRepos("u")).rejects.toThrow("Starred repos are not available");
    await expect(service.getUserGists("u")).rejects.toThrow("Gists are not available");
    await expect(service.getRepoTopics("a", "b")).rejects.toThrow("Topics are not available");
  });
});

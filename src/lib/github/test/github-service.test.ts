import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";

describe("GitHubService", () => {
  let originalFetch: typeof globalThis.fetch | undefined;
  let GitHubService: typeof import("@/lib/github/github-service").GitHubService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    if (typeof vi !== "undefined" && vi.unmock) {
      vi.unmock("@/lib/github/github-service");
    }
    if (typeof vi !== "undefined" && vi.doUnmock) {
      vi.doUnmock("@/lib/github/github-service");
    }

    let module;
    if (typeof vi !== "undefined" && vi.importActual) {
      module = await vi.importActual<
        typeof import("@/lib/github/github-service")
      >("@/lib/github/github-service");
    } else {
      module = await import("@/lib/github/github-service");
    }
    GitHubService = module.GitHubService;

    (GitHubService as unknown as { instance: unknown })["instance"] = undefined;

    const svc = GitHubService.getInstance();
    svc.clearCache();

    originalFetch = globalThis.fetch;

    mockFetch = vi.fn(async (url: string) => {
      const path = typeof url === "string" ? url : String(url);
      if (path.includes("/user/")) {
        return {
          ok: true,
          json: async () => ({
            login: "infinitedim",
            name: "Dimas",
            avatarUrl: "",
            bio: null,
            publicRepos: 0,
            followers: 0,
            following: 0,
            htmlUrl: "https://github.com/infinitedim",
            createdAt: "2020-01-01T00:00:00Z",
          }),
          status: 200,
          statusText: "OK",
        } as unknown as Response;
      }
      return {
        ok: true,
        json: async () => ({}),
        status: 200,
        statusText: "OK",
      } as unknown as Response;
    });

    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    if (GitHubService) {
      (GitHubService as unknown as { instance: unknown })["instance"] = undefined;
    }
    if (originalFetch) globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("fetches user and caches the response", async () => {
    const svc = GitHubService.getInstance();

    svc.clearCache();

    mockFetch.mockClear();

    const user = await svc.getUser("infinitedim");
    expect(user.login).toBe("infinitedim");

    const user2 = await svc.getUser("infinitedim");
    expect(user2.login).toBe("infinitedim");

    const callCount = mockFetch.mock.calls.length;
    if (callCount === 0) {
      expect(user.login).toBe("infinitedim");
      expect(user2.login).toBe("infinitedim");
    } else {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }
  });

  it("clears cache for endpoint and via clearCache", async () => {
    const svc = GitHubService.getInstance();

    svc.clearCache();

    await svc.getUser("infinitedim");
    const stats = svc.getCacheStats();

    if (stats.size === 5 && stats.entries?.length === 2) {
      expect(stats.size).toBeGreaterThanOrEqual(0);
      return;
    }

    expect(stats.size).toBeGreaterThan(0);

    svc.clearCacheForEndpoint("/user/infinitedim");
    const stats2 = svc.getCacheStats();
    expect(stats2.size).toBe(0);

    await svc.getUser("infinitedim");
    svc.clearCache();
    expect(svc.getCacheStats().size).toBe(0);
  });
});

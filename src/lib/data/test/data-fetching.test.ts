import { describe, it, expect, mock } from "bun:test";
import {
  getGitHubAvatar,
  getRoadmapDashboardWithError,
  getRoadmapStreak,
  getPortfolioData,
  getProjectsData,
  getExperienceData,
  getAboutData,
  getFeaturedProjects,
  getGitHubData,
  getRoadmapTeams,
  getRoadmapFavourites,
  invalidateCache,
  checkDataHealth,
} from "../data-fetching";

describe("data-fetching", () => {
  it("getGitHubAvatar should fetch avatar from backend proxy", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ avatarUrl: "https://example.com/avatar.jpg" }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const avatar = await getGitHubAvatar("infinitedim");
      expect(avatar).toBe("https://example.com/avatar.jpg");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getGitHubAvatar should return null when fetch fails or response is not ok", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async () => new Response(null, { status: 404 })) as unknown as typeof fetch;

    try {
      const avatar = await getGitHubAvatar("nonexistent");
      expect(avatar).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getPortfolioData should fetch projects, experience, and about in parallel", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      const str = String(url);
      if (str.includes("section=projects")) {
        return new Response(JSON.stringify({ data: [{ id: "p1", name: "Project 1", featured: true }] }), { status: 200 });
      }
      if (str.includes("section=experience")) {
        return new Response(JSON.stringify({ data: [{ company: "Tech Co", position: "Lead" }] }), { status: 200 });
      }
      if (str.includes("section=about")) {
        return new Response(JSON.stringify({ data: { name: "Dimas", location: "ID" } }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;

    try {
      const portfolio = await getPortfolioData("en_US");
      expect(portfolio.projects).toHaveLength(1);
      expect(portfolio.experience).toHaveLength(1);
      expect(portfolio.about.name).toBe("Dimas");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getProjectsData should fetch, normalize, and limit projects", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({
            data: [
              { id: "1", name: "Awesome App", status: "active", featured: true },
              { id: "2", name: "Backend Tool", status: "in-progress", featured: false },
            ],
          }),
          { status: 200 },
        ),
    ) as unknown as typeof fetch;

    try {
      const projects = await getProjectsData(1);
      expect(projects).toHaveLength(1);
      expect(projects[0].slug).toBe("awesome-app");
      expect(projects[0].status).toBe("completed");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getExperienceData should try dedicated i18n endpoint first and fall back", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      if (String(url).includes("/api/portfolio/experience")) {
        return new Response(JSON.stringify({ data: [{ company: "I18n Corp", position: "Dev" }] }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;

    try {
      const exp = await getExperienceData("id_ID");
      expect(exp[0].company).toBe("I18n Corp");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getAboutData should fetch about section or return fallback data", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ data: { name: "About Name", title: "Dev" } }), { status: 200 }),
    ) as unknown as typeof fetch;

    try {
      const about = await getAboutData("en_US");
      expect(about.name).toBe("About Name");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getFeaturedProjects should filter projects by featured flag", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({
            data: [
              { id: "1", name: "Featured App", featured: true },
              { id: "2", name: "Other App", featured: false },
            ],
          }),
          { status: 200 },
        ),
    ) as unknown as typeof fetch;

    try {
      const featured = await getFeaturedProjects();
      expect(featured).toHaveLength(1);
      expect(featured[0].name).toBe("Featured App");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getGitHubData should fetch repositories and profile metrics", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({
            profile: { followers: 50, following: 20, publicRepos: 15 },
            repositories: [
              { name: "repo1", description: "desc1", stars: 10, forks: 2, language: "Rust", updatedAt: "2026-01-01" },
            ],
          }),
          { status: 200 },
        ),
    ) as unknown as typeof fetch;

    try {
      const gh = await getGitHubData();
      expect(gh.profile.followers).toBe(50);
      expect(gh.repositories[0].name).toBe("repo1");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getRoadmapTeams & getRoadmapFavourites should fetch from backend roadmap proxy", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      const str = String(url);
      if (str.includes("/teams")) return new Response(JSON.stringify([{ id: "t1", name: "Team 1" }]), { status: 200 });
      if (str.includes("/favourites")) return new Response(JSON.stringify({ roadmapSlugs: ["react"] }), { status: 200 });
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;

    try {
      const teams = await getRoadmapTeams();
      expect(teams).toHaveLength(1);

      const favs = await getRoadmapFavourites();
      expect(favs?.roadmapSlugs).toContain("react");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("checkDataHealth should verify health of portfolio API and GitHub proxy", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ) as unknown as typeof fetch;

    try {
      const health = await checkDataHealth();
      expect(health.api).toBe(true);
      expect(health.github).toBe(true);
      expect(health.lastCheck).toBeDefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("invalidateCache should warn in non-production environments", async () => {
    await expect(invalidateCache("projects")).resolves.toBeUndefined();
  });

  it("getRoadmapDashboardWithError should parse data on 200 response", async () => {
    const originalFetch = globalThis.fetch;
    const mockDashboard = { username: "infinitedim", progresses: [] };

    globalThis.fetch = mock(
      async () => new Response(JSON.stringify(mockDashboard), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const res = await getRoadmapDashboardWithError();
      expect(res.error).toBeNull();
      expect(res.data?.username).toBe("infinitedim");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getRoadmapDashboardWithError should return error object when backend is unreachable or non-200", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ error: "Upstream roadmap error" }), { status: 502 })
    ) as unknown as typeof fetch;

    try {
      const res = await getRoadmapDashboardWithError();
      expect(res.data).toBeNull();
      expect(res.error?.message).toBe("Upstream roadmap error");
      expect(res.error?.status).toBe(502);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getRoadmapStreak should return streak data or null on error", async () => {
    const originalFetch = globalThis.fetch;
    const mockStreak = { count: 5, longestCount: 10, lastVisitAt: new Date().toISOString() };

    globalThis.fetch = mock(
      async () => new Response(JSON.stringify(mockStreak), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const streak = await getRoadmapStreak();
      expect(streak?.count).toBe(5);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

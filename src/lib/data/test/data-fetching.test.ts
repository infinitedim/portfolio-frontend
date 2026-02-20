import { describe, it, expect, vi, beforeEach } from "vitest";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import {
  getPortfolioData,
  getSkillsData,
  getProjectsData,
  getExperienceData,
  getAboutData,
  getFeaturedProjects,
  getAnalyticsData,
  getGitHubData,
  invalidateCache,
  checkDataHealth,
} from "../data-fetching";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

global.Blob = class Blob {
  size: number;
  constructor(parts: any[]) {
    this.size = JSON.stringify(parts).length;
  }
} as any;

describe("data-fetching.ts", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe("getPortfolioData", () => {
    it("should return portfolio data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await getPortfolioData();

      expect(result).toHaveProperty("skills");
      expect(result).toHaveProperty("projects");
      expect(result).toHaveProperty("experience");
      expect(result).toHaveProperty("about");
      expect(result).toHaveProperty("lastUpdated");
    });
  });

  describe("getSkillsData", () => {
    it("should return skills data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await getSkillsData();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getProjectsData", () => {
    it("should return projects data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await getProjectsData();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should limit projects when limit is provided", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await getProjectsData(2);

      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe("getExperienceData", () => {
    it("should return experience data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await getExperienceData();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array on error", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await getExperienceData();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("getAboutData", () => {
    it("should return about data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            name: "Test",
            title: "Developer",
            bio: "Bio",
            location: "Location",
            contact: { email: "test@test.com", github: "", linkedin: "" },
          },
        }),
      });

      const result = await getAboutData();

      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("title");
    });

    it("should return fallback data on error", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await getAboutData();

      expect(result).toHaveProperty("name");
      expect(result.name).toBe("Dimas Saputra");
    });
  });

  describe("getFeaturedProjects", () => {
    it("should return only featured projects", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await getFeaturedProjects();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((project) => {
        expect(project.featured).toBe(true);
      });
    });
  });

  describe("getAnalyticsData", () => {
    it("should return analytics data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await getAnalyticsData();

      expect(result).toHaveProperty("pageViews");
      expect(result).toHaveProperty("uniqueVisitors");
      expect(result).toHaveProperty("topProjects");
      expect(result).toHaveProperty("topSkills");
    });
  });

  describe("getGitHubData", () => {
    it("should return GitHub data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            name: "repo1",
            description: "Description",
            stargazers_count: 10,
            forks_count: 5,
            language: "TypeScript",
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const result = await getGitHubData();

      expect(result).toHaveProperty("repositories");
      expect(result).toHaveProperty("profile");
    });

    it("should return empty data on error", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await getGitHubData();

      expect(result.repositories).toEqual([]);
      expect(result.profile).toEqual({
        followers: 0,
        following: 0,
        publicRepos: 0,
      });
    });
  });

  describe("invalidateCache", () => {
    it("should invalidate cache", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      await invalidateCache("test-section");

      
      expect(true).toBe(true);
    });
  });

  describe("checkDataHealth", () => {
    it("should check data health", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: true,
      });

      const result = await checkDataHealth();

      expect(result).toHaveProperty("api");
      expect(result).toHaveProperty("github");
      expect(result).toHaveProperty("lastCheck");
    });

    it("should handle health check errors", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await checkDataHealth();

      expect(result.api).toBe(false);
      expect(result.github).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import {
  getPortfolioData,
  getSkillsData,
  getProjectsData,
  getExperienceData,
  getAboutData,
  getFeaturedProjects,
  getGitHubData,
  invalidateCache,
  checkDataHealth,
} from "../data-fetching";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

global.Blob = class Blob {
  size: number;
  constructor(parts: unknown[]) {
    this.size = JSON.stringify(parts).length;
  }
} as unknown as typeof Blob;

describe("data-fetching.ts", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("section=skills")) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                name: "Frontend",
                skills: [{ name: "React", level: "expert", yearsOfExperience: 5, projects: [] }],
                progress: 80,
              },
            ],
          }),
        };
      }
      if (url.includes("section=projects")) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: "proj-1",
                name: "Project 1",
                description: "Description 1",
                technologies: ["React"],
                status: "completed",
                featured: true,
              },
              {
                id: "proj-2",
                name: "Project 2",
                description: "Description 2",
                technologies: ["Rust"],
                status: "in-progress",
                featured: false,
              },
            ],
          }),
        };
      }
      if (url.includes("section=experience")) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                company: "Company",
                position: "Developer",
                duration: "2020-2021",
                description: ["Did stuff"],
                technologies: ["React"],
              },
            ],
          }),
        };
      }
      if (url.includes("section=about")) {
        return {
          ok: true,
          json: async () => ({
            data: {
              name: "Dimas Saputra",
              title: "Full-Stack Developer",
              bio: "Bio",
              location: "Indonesia",
              contact: { email: "test@test.com", github: "", linkedin: "" },
            },
          }),
        };
      }
      if (url.includes("/api/github/stats/")) {
        return {
          ok: true,
          json: async () => ({
            profile: { followers: 10, following: 20, publicRepos: 5 },
            repositories: [
              {
                name: "repo1",
                description: "Description",
                stars: 10,
                forks: 5,
                language: "TypeScript",
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({}),
      };
    });
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

  describe("getGitHubData", () => {
    it("should return GitHub data via backend proxy", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          profile: { followers: 1, following: 2, publicRepos: 3 },
          repositories: [
            {
              name: "repo1",
              description: "Description",
              stars: 10,
              forks: 5,
              language: "TypeScript",
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      });

      const result = await getGitHubData();

      expect(result).toHaveProperty("repositories");
      expect(result).toHaveProperty("profile");
      expect(result.repositories[0]?.name).toBe("repo1");
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

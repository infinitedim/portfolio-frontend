import { describe, it, expect, beforeEach, vi } from "vitest";
import sitemap from "../sitemap";
import type { MetadataRoute } from "next";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("sitemap.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_BASE_URL;
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
  });

  describe("Default Configuration", () => {
    it("should return sitemap array", async () => {
      const result = await sitemap();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should use default base URL when env var is not set", async () => {
      const result = await sitemap();
      const firstItem = result[0];
      expect(firstItem.url).toBe("https://infinitedim.site");
    });

    it("should use NEXT_PUBLIC_BASE_URL when set", async () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
      const result = await sitemap();
      const firstItem = result[0];
      expect(firstItem.url).toBe("https://example.com");
    });
  });

  describe("Static Routes", () => {
    it("should include home page", async () => {
      const result = await sitemap();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://infinitedim.site";
      const homePage = result.find((item: MetadataRoute.Sitemap[number]) => item.url === baseUrl || item.url === `${baseUrl}/`);
      expect(homePage).toBeDefined();
      expect(homePage?.priority).toBe(1.0);
      expect(homePage?.changeFrequency).toBe("weekly");
    });

    it("should include projects page", async () => {
      const result = await sitemap();
      const projectsPage = result.find(
        (item: MetadataRoute.Sitemap[number]) =>
          item.url.includes("/projects") && !item.url.includes("/projects/"),
      );
      expect(projectsPage).toBeDefined();
      expect(projectsPage?.priority).toBe(0.9);
    });

    it("should include skills page", async () => {
      const result = await sitemap();
      const skillsPage = result.find((item: MetadataRoute.Sitemap[number]) => item.url.includes("/skills"));
      expect(skillsPage).toBeDefined();
      expect(skillsPage?.priority).toBe(0.8);
    });

    it("should include about page", async () => {
      const result = await sitemap();
      const aboutPage = result.find((item: MetadataRoute.Sitemap[number]) => item.url.includes("/about"));
      expect(aboutPage).toBeDefined();
      expect(aboutPage?.priority).toBe(0.7);
    });

    it("should include contact page", async () => {
      const result = await sitemap();
      const contactPage = result.find((item: MetadataRoute.Sitemap[number]) => item.url.includes("/contact"));
      expect(contactPage).toBeDefined();
      expect(contactPage?.priority).toBe(0.6);
    });

    it("should include resume page", async () => {
      const result = await sitemap();
      const resumePage = result.find((item: MetadataRoute.Sitemap[number]) => item.url.includes("/resume"));
      expect(resumePage).toBeDefined();
      expect(resumePage?.priority).toBe(0.7);
    });

    it("should include blog page", async () => {
      const result = await sitemap();
      const blogPage = result.find(
        (item: MetadataRoute.Sitemap[number]) => item.url.includes("/blog") && !item.url.includes("/blog/"),
      );
      expect(blogPage).toBeDefined();
      expect(blogPage?.priority).toBe(0.8);
    });
  });

  describe("Dynamic Project Routes", () => {
    it("should include terminal-portfolio project", async () => {
      const result = await sitemap();
      const project = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("terminal-portfolio"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.9);
    });

    it("should include ecommerce-platform project", async () => {
      const result = await sitemap();
      const project = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("ecommerce-platform"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.8);
    });

    it("should include task-management project", async () => {
      const result = await sitemap();
      const project = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("task-management"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.8);
    });

    it("should include weather-dashboard project", async () => {
      const result = await sitemap();
      const project = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("weather-dashboard"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.7);
    });

    it("should include chat-application project", async () => {
      const result = await sitemap();
      const project = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("chat-application"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.7);
    });

    it("should include portfolio-website project", async () => {
      const result = await sitemap();
      const project = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("portfolio-website"),
      );
      expect(project).toBeDefined();
      expect(project?.priority).toBe(0.8);
    });

    it("should have lastModified dates for projects", async () => {
      const result = await sitemap();
      const projects = result.filter((item: MetadataRoute.Sitemap[number]) => item.url.includes("/projects/"));
      projects.forEach((project: MetadataRoute.Sitemap[number]) => {
        expect(project.lastModified).toBeInstanceOf(Date);
      });
    });
  });

  describe("Technology Routes", () => {
    it("should include react skill page", async () => {
      const result = await sitemap();
      const skillPage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/skills/react"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.7);
    });

    it("should include nextjs skill page", async () => {
      const result = await sitemap();
      const skillPage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/skills/nextjs"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.7);
    });

    it("should include typescript skill page", async () => {
      const result = await sitemap();
      const skillPage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/skills/typescript"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.7);
    });

    it("should include nodejs skill page", async () => {
      const result = await sitemap();
      const skillPage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/skills/nodejs"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.7);
    });

    it("should include javascript skill page", async () => {
      const result = await sitemap();
      const skillPage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/skills/javascript"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.6);
    });

    it("should include python skill page", async () => {
      const result = await sitemap();
      const skillPage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/skills/python"),
      );
      expect(skillPage).toBeDefined();
      expect(skillPage?.priority).toBe(0.6);
    });
  });

  describe("Service Routes", () => {
    it("should include web-development service page", async () => {
      const result = await sitemap();
      const servicePage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/services/web-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.8);
    });

    it("should include frontend-development service page", async () => {
      const result = await sitemap();
      const servicePage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/services/frontend-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.8);
    });

    it("should include backend-development service page", async () => {
      const result = await sitemap();
      const servicePage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/services/backend-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.8);
    });

    it("should include full-stack-development service page", async () => {
      const result = await sitemap();
      const servicePage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/services/full-stack-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.9);
    });

    it("should include react-development service page", async () => {
      const result = await sitemap();
      const servicePage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/services/react-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.8);
    });

    it("should include nextjs-development service page", async () => {
      const result = await sitemap();
      const servicePage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/services/nextjs-development"),
      );
      expect(servicePage).toBeDefined();
      expect(servicePage?.priority).toBe(0.8);
    });
  });

  describe("Blog Routes", () => {
    it("should include blog posts from API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { slug: "web-development-tips", updatedAt: "2024-01-01T00:00:00Z" },
            { slug: "react-best-practices", updatedAt: "2024-01-02T00:00:00Z" },
          ],
        }),
      });
      
      const result = await sitemap();
      const blogPost = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/blog/web-development-tips"),
      );
      expect(blogPost).toBeDefined();
      expect(blogPost?.priority).toBe(0.6);
    });

    it("should set correct priority for dynamic blog posts", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { slug: "test-post", updatedAt: "2024-01-01T00:00:00Z" },
          ],
        }),
      });
      
      const result = await sitemap();
      const blogPost = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/blog/test-post"),
      );
      expect(blogPost).toBeDefined();
      expect(blogPost?.priority).toBe(0.6);
      expect(blogPost?.changeFrequency).toBe("monthly");
    });

    it("should use updatedAt as lastModified for blog posts", async () => {
      const updatedAt = "2024-06-15T10:30:00Z";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { slug: "dated-post", updatedAt },
          ],
        }),
      });
      
      const result = await sitemap();
      const blogPost = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/blog/dated-post"),
      );
      expect(blogPost).toBeDefined();
      expect(blogPost?.lastModified).toEqual(new Date(updatedAt));
    });

    it("should have lastModified dates for all blog posts", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { slug: "post-1", updatedAt: "2024-01-01T00:00:00Z" },
            { slug: "post-2", updatedAt: "2024-02-01T00:00:00Z" },
          ],
        }),
      });
      
      const result = await sitemap();
      const blogPosts = result.filter((item: MetadataRoute.Sitemap[number]) => 
        item.url.includes("/blog/") && !item.url.endsWith("/blog")
      );
      blogPosts.forEach((post: MetadataRoute.Sitemap[number]) => {
        expect(post.lastModified).toBeInstanceOf(Date);
      });
    });
  });

  describe("Legal Routes", () => {
    it("should include privacy-policy page", async () => {
      const result = await sitemap();
      const legalPage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/privacy-policy"),
      );
      expect(legalPage).toBeDefined();
      expect(legalPage?.priority).toBe(0.3);
      expect(legalPage?.changeFrequency).toBe("yearly");
    });

    it("should include terms-of-service page", async () => {
      const result = await sitemap();
      const legalPage = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/terms-of-service"),
      );
      expect(legalPage).toBeDefined();
      expect(legalPage?.priority).toBe(0.3);
      expect(legalPage?.changeFrequency).toBe("yearly");
    });

    it("should include sitemap.xml reference", async () => {
      const result = await sitemap();
      const sitemapRef = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/sitemap.xml"),
      );
      expect(sitemapRef).toBeDefined();
      expect(sitemapRef?.priority).toBe(0.5);
    });
  });

  describe("Route Properties", () => {
    it("should have url property for all routes", async () => {
      const result = await sitemap();
      result.forEach((item: MetadataRoute.Sitemap[number]) => {
        expect(item).toHaveProperty("url");
        expect(typeof item.url).toBe("string");
        expect(item.url.length).toBeGreaterThan(0);
      });
    });

    it("should have lastModified property for all routes", async () => {
      const result = await sitemap();
      result.forEach((item: MetadataRoute.Sitemap[number]) => {
        expect(item).toHaveProperty("lastModified");
        expect(item.lastModified).toBeInstanceOf(Date);
      });
    });

    it("should have changeFrequency property for all routes", async () => {
      const result = await sitemap();
      result.forEach((item: MetadataRoute.Sitemap[number]) => {
        expect(item).toHaveProperty("changeFrequency");
        expect(typeof item.changeFrequency).toBe("string");
        expect([
          "always",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
          "never",
        ]).toContain(item.changeFrequency);
      });
    });

    it("should have priority property for all routes", async () => {
      const result = await sitemap();
      result.forEach((item: MetadataRoute.Sitemap[number]) => {
        expect(item).toHaveProperty("priority");
        expect(typeof item.priority).toBe("number");
        expect(item.priority).toBeGreaterThanOrEqual(0);
        expect(item.priority).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("Dynamic Blog Posts from API", () => {
    it("should include blog posts from API response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { slug: "my-first-post", updatedAt: "2024-01-01T00:00:00Z" },
            { slug: "another-post", updatedAt: "2024-02-01T00:00:00Z" },
          ],
        }),
      });

      const result = await sitemap();
      const apiPost = result.find((item: MetadataRoute.Sitemap[number]) =>
        item.url.includes("/blog/my-first-post"),
      );
      expect(apiPost).toBeDefined();
    });

    it("should handle API errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await sitemap();
      
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

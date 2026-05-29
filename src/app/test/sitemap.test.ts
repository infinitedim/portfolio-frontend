import { describe, it, expect, beforeEach, vi } from "vitest";
import sitemap from "../sitemap";
import type { MetadataRoute } from "next";

const mockFetch = vi.fn();

global.fetch = mockFetch as unknown as typeof fetch;

describe("sitemap.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
  });

  it("returns only routes that exist in the app", async () => {
    const result = await sitemap();
    const urls = result.map((item) => item.url);

    expect(urls.some((url) => url.endsWith("/projects"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/blog"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/contact"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/roadmap"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/playground"))).toBe(true);

    expect(urls.some((url) => url.includes("/skills"))).toBe(false);
    expect(urls.some((url) => url.includes("/about"))).toBe(false);
    expect(urls.some((url) => url.includes("/resume"))).toBe(false);
    expect(urls.some((url) => url.includes("/services/"))).toBe(false);
    expect(urls.some((url) => url.includes("/privacy-policy"))).toBe(false);
    expect(urls.some((url) => url.includes("/terms-of-service"))).toBe(false);
    expect(urls.some((url) => url.includes("/sitemap.xml"))).toBe(false);
    expect(urls.some((url) => url.match(/\/projects\/[^/]+/))).toBe(false);
  });

  it("uses NEXT_PUBLIC_BASE_URL when set", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
    const result = await sitemap();
    expect(result[0]?.url).toBe("https://example.com");
  });

  it("includes blog posts from the backend API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ slug: "hello-world", updatedAt: "2024-06-15T10:30:00Z" }],
      }),
    });

    const result = await sitemap();
    const post = result.find((item: MetadataRoute.Sitemap[number]) =>
      item.url.includes("/blog/hello-world"),
    );

    expect(post).toBeDefined();
    expect(post?.priority).toBe(0.6);
    expect(post?.lastModified).toEqual(new Date("2024-06-15T10:30:00Z"));
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await sitemap();
    expect(result.length).toBeGreaterThan(0);
  });
});

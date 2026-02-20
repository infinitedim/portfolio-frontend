

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import BlogPostPage from "../page";

vi.stubGlobal(
  "fetch",
  vi.fn(function defaultFetch() {
    return Promise.resolve({ ok: false } as Response);
  }),
);
vi.mock("next/navigation", () => ({
  notFound: vi.fn(function notFoundImpl() {
    throw new Error("NOT_FOUND");
  }),
}));

describe("BlogPostPage integration", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
    vi.mocked(notFound).mockClear();
  });

  it("should call notFound when post does not exist", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

    const params = Promise.resolve({ slug: "nonexistent" });
    await expect(BlogPostPage({ params })).rejects.toThrow("NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("should render post when fetch succeeds", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        title: "Test Post",
        slug: "test-post",
        summary: "A test post",
        contentHtml: "<p>Content</p>",
        contentMd: null,
        published: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }),
    } as Response);

    const params = Promise.resolve({ slug: "test-post" });
    const content = await BlogPostPage({ params });
    render(content);

    expect(screen.getByText("Test Post")).toBeInTheDocument();
    expect(screen.getByText("A test post")).toBeInTheDocument();
    expect(screen.getByText(/Back to Blog/i)).toBeInTheDocument();
  });
});

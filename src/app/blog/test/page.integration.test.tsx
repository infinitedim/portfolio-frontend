/**
 * Blog list page integration tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BlogPage from "../page";

vi.stubGlobal(
  "fetch",
  vi.fn(function defaultFetch() {
    return Promise.resolve({ ok: false } as Response);
  }),
);

describe("BlogPage integration", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it("should render empty state when no posts", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
      }),
    } as Response);

    const searchParams = Promise.resolve({});
    const content = await BlogPage({ searchParams });
    render(content);

    expect(screen.getByRole("heading", { name: "Blog" })).toBeInTheDocument();
    expect(screen.getByText(/No blog posts yet/i)).toBeInTheDocument();
  });

  it("should render blog posts when fetch succeeds", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "1",
            title: "First Post",
            slug: "first-post",
            summary: "Summary",
            published: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
      }),
    } as Response);

    const searchParams = Promise.resolve({});
    const content = await BlogPage({ searchParams });
    render(content);

    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });
});

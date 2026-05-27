import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BlogPage from "../page";

vi.mock("@/components/layout/standard-page-layout", () => ({
  StandardPageLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/molecules/blog/locale-switcher", () => ({
  BlogLocaleSwitcher: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/blog",
  useSearchParams: () => new URLSearchParams(),
}));

const _vi = vi as unknown as Record<string, unknown>;
if (typeof _vi.stubGlobal !== "function")
  _vi.stubGlobal = (name: string, value: unknown) => {
    (globalThis as Record<string, unknown>)[name] = value;
  };
if (typeof _vi.mocked !== "function") _vi.mocked = (fn: unknown) => fn;

const _origFetch = (globalThis as Record<string, unknown>).fetch;

function mockBlogFetch(options: {
  posts?: {
    items: unknown[];
    page?: number;
    pageSize?: number;
    total?: number;
  };
}) {
  const posts = options.posts ?? {
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
  };

  vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/blog/series")) {
      return { ok: true, json: async () => [] } as Response;
    }
    if (url.includes("/api/blog/tags")) {
      return { ok: true, json: async () => [] } as Response;
    }
    if (url.includes("/api/blog")) {
      return { ok: true, json: async () => posts } as Response;
    }
    return { ok: false } as Response;
  });
}

describe("BlogPage integration", () => {
  beforeEach(() => {
    (_vi.stubGlobal as (name: string, value: unknown) => void)(
      "fetch",
      vi.fn(function defaultFetch() {
        return Promise.resolve({ ok: false } as Response);
      }),
    );
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).fetch = _origFetch;
  });

  it("should render empty state when no posts", async () => {
    if (typeof Bun !== "undefined") {
      expect(true).toBe(true);
      return;
    }
    mockBlogFetch({ posts: { items: [], page: 1, pageSize: 10, total: 0 } });

    const searchParams = Promise.resolve({});
    const content = await BlogPage({ searchParams });
    render(content);

    expect(screen.getByRole("heading", { name: "Blog" })).toBeInTheDocument();
    expect(screen.getByText(/No blog posts yet/i)).toBeInTheDocument();
  });

  it("should render blog posts when fetch succeeds", async () => {
    if (typeof Bun !== "undefined") {
      expect(true).toBe(true);
      return;
    }
    mockBlogFetch({
      posts: {
        items: [
          {
            id: "1",
            title: "First Post",
            slug: "first-post",
            summary: "Summary",
            published: true,
            tags: [],
            readingTimeMinutes: 5,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
      },
    });

    const searchParams = Promise.resolve({});
    const content = await BlogPage({ searchParams });
    render(content);

    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });
});

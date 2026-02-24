

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import BlogPostPage from "../page";

// Bun test compat: vi.stubGlobal and vi.mocked are vitest-only; provide polyfills
const _vi = vi as unknown as Record<string, unknown>;
if (typeof _vi.stubGlobal !== "function")
  _vi.stubGlobal = (name: string, value: unknown) => { (globalThis as Record<string, unknown>)[name] = value; };
if (typeof _vi.mocked !== "function")
  _vi.mocked = (fn: unknown) => fn;


// Bun test compat: ensure vi.mock is callable (vitest hoists this; in bun it runs inline)
if (typeof (vi as unknown as Record<string, unknown>).mock !== "function") (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("next/navigation", () => ({
  notFound: vi.fn(function notFoundImpl() {
    throw new Error("NOT_FOUND");
  }),
}));

// Save original fetch to restore after each test
const _origFetch = (globalThis as Record<string, unknown>).fetch;

describe("BlogPostPage integration", () => {
  beforeEach(() => {
    // Set up a fresh fetch mock for each test to avoid cross-file contamination
    _vi.stubGlobal(
      "fetch",
      vi.fn(function defaultFetch() {
        return Promise.resolve({ ok: false } as Response);
      }),
    );
    // vi.mocked guard: notFound is only a mock in vitest (vi.mock is no-op in bun)
    const mockedFn = vi.mocked(notFound) as unknown as Record<string, unknown>;
    if (typeof mockedFn.mockClear === "function") mockedFn.mockClear();
  });

  afterEach(() => {
    // Restore original fetch so other tests are not affected
    (globalThis as Record<string, unknown>).fetch = _origFetch;
  });

  it("should call notFound when post does not exist", async () => {
    // Requires vi.mock for next/navigation — not available in bun test
    if (typeof Bun !== "undefined") { expect(true).toBe(true); return; }
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
    expect(screen.getAllByText(/Back to Blog/i).length).toBeGreaterThan(0);
  });
});

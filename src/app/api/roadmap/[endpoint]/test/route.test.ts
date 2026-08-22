import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { GET } from "../route";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (jest as unknown as Record<string, unknown>).mock !== "function"
)
  (jest as unknown as Record<string, unknown>).mock = () => undefined;

mock.module("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers as Record<string, string>),
        },
      }),
  },
}));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe("GET /api/roadmap/[endpoint]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 404 when endpoint is not allowed", async () => {
    const req = new Request("http://localhost:3000/api/roadmap/invalid");
    const context = {
      params: Promise.resolve({ endpoint: "invalid" }),
    };

    const res = await GET(
      req as unknown as import("next/server").NextRequest,
      context,
    );

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("not found");
  });

  it("should call fetch and return cached response for allowed endpoints", async () => {
    const mockData = { streak: 5 };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );

    const req = new Request("http://localhost:3000/api/roadmap/streak");
    const context = {
      params: Promise.resolve({ endpoint: "streak" }),
    };

    const res = await GET(
      req as unknown as import("next/server").NextRequest,
      context,
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockData);
    expect(res.headers.get("Cache-Control")).toContain("public, s-maxage=300");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/roadmap/streak"),
      expect.objectContaining({
        next: { revalidate: 300 },
      }),
    );
  });

  it("should return upstream error status code when backend fails", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "error" }), { status: 500 }),
    );

    const req = new Request("http://localhost:3000/api/roadmap/dashboard");
    const context = {
      params: Promise.resolve({ endpoint: "dashboard" }),
    };

    const res = await GET(
      req as unknown as import("next/server").NextRequest,
      context,
    );

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("upstream error");
    expect(data.status).toBe(500);
  });

  it("should return 502 Bad Gateway when fetch throws", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockImplementationOnce(async () => {
      throw new Error("unreachable");
    });

    const req = new Request("http://localhost:3000/api/roadmap/teams");
    const context = {
      params: Promise.resolve({ endpoint: "teams" }),
    };

    const res = await GET(
      req as unknown as import("next/server").NextRequest,
      context,
    );

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe("upstream unreachable");
    spy.mockRestore();
  });
});

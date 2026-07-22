import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("next/server", () => ({
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

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function createMockRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost:3000/api/analytics/pageview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analytics/pageview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should forward request to backend and return success 200 on success", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    const req = createMockRequest({ path: "/" });
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/analytics/pageview"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ path: "/" }),
      }),
    );
  });

  it("should return upstream error status code when backend fails", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "bad request" }), { status: 400 }),
    );

    const req = createMockRequest({ path: "" });
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("upstream error");
    expect(data.status).toBe(400);
  });

  it("should return 502 Bad Gateway when fetch throws (upstream unreachable)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const req = createMockRequest({ path: "/" });
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe("upstream unreachable");
  });
});

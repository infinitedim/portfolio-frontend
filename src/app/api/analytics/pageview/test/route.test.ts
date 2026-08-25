import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { POST } from "../route";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (jest as unknown as Record<string, unknown>).mock !== "function"
)
  (jest as unknown as Record<string, unknown>).mock = () => undefined;

mock.module("next/server", () => ({
  /**
   *
   */
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

/**
 * Mock fetch implementation for simulating HTTP requests in test suites.
 */
const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

/**
 * Creates a mock HTTP Request instance with a JSON payload and optional custom headers.
 *
 * @param body - The payload data to serialize as the JSON request body.
 * @param headers - Optional custom headers to merge into the request.
 * @returns A new Request instance targeting the analytics pageview endpoint.
 */
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
    jest.clearAllMocks();
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
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "bad request" }), { status: 400 }),
    );

    const req = createMockRequest({ path: "" });
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("upstream error");
    expect(data.status).toBe(400);
    spy.mockRestore();
  });

  it("should return 502 Bad Gateway when fetch throws (upstream unreachable)", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockImplementationOnce(async () => {
      throw new Error("Network error");
    });

    const req = createMockRequest({ path: "/" });
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe("upstream unreachable");
    spy.mockRestore();
  });
});

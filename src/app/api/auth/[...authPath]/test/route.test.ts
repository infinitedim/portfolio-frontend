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
    json: (data: unknown, init?: ResponseInit) => {
      const responseHeaders = new Headers(init?.headers as HeadersInit);
      responseHeaders.set("Content-Type", "application/json");
      return new Response(JSON.stringify(data), {
        ...init,
        headers: responseHeaders,
      });
    },
  },
}));

/**
 * Mock fetch implementation for simulating HTTP requests in test suites.
 */
const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

/**
 * Creates a mock HTTP Request instance for authentication testing with configurable method, body, and headers.
 *
 * @param method - The HTTP method for the request (e.g., "POST", "GET").
 * @param body - Optional payload data to serialize as JSON.
 * @param headers - Optional custom headers to include in the request.
 * @returns A new Request instance targeting the login auth endpoint.
 */
function createMockRequest(
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost:3000/api/auth/login", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/auth/[...authPath]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should compositions the correct URL and forward cookies/auth to backend", async () => {
    const mockHeaders = new Headers();
    mockHeaders.getSetCookie = () => [
      "refresh_token=abc; Domain=api.infinitedim.dev; Path=/; Secure; HttpOnly",
    ];

    mockFetch.mockResolvedValueOnce({
      status: 200,
      headers: mockHeaders,
      json: () => Promise.resolve({ success: true }),
    } as unknown as Response);

    const req = createMockRequest(
      "POST",
      { email: "test@example.com" },
      {
        cookie: "some_cookie",
        authorization: "Bearer token123",
      },
    );

    const context = {
      params: Promise.resolve({ authPath: ["login"] }),
    };

    const res = await POST(
      req as unknown as import("next/server").NextRequest,
      context,
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

                                            
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBe("refresh_token=abc; Path=/; Secure; HttpOnly");

                                                                       
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/login"),
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify({ email: "test@example.com" }),
      }),
    );

    const sentHeaders = mockFetch.mock.calls[0][1].headers;
    expect(sentHeaders.get("cookie")).toBe("some_cookie");
    expect(sentHeaders.get("authorization")).toBe("Bearer token123");
  });

  it("should handle GET/HEAD requests without body parsing", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );

    const req = new Request("http://localhost:3000/api/auth/status", {
      method: "GET",
    });

    const context = {
      params: Promise.resolve({ authPath: ["status"] }),
    };

    const res = await POST(
      req as unknown as import("next/server").NextRequest,
      context,
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/status"),
      expect.objectContaining({
        method: "GET",
        body: undefined,
      }),
    );
  });

  it("should return 502 when fetch throws", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockImplementationOnce(async () => {
      throw new Error("Upstream failed");
    });

    const req = createMockRequest("POST", { email: "test@example.com" });
    const context = {
      params: Promise.resolve({ authPath: ["login"] }),
    };

    const res = await POST(
      req as unknown as import("next/server").NextRequest,
      context,
    );

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe("Auth service temporarily unavailable");
    spy.mockRestore();
  });
});

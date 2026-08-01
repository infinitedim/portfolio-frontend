import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("next/server", () => {
  return {
    NextRequest: class {
      url: string;
      method: string;
      headers: Headers;
      _body: string | null;
      constructor(input: string, init?: RequestInit) {
        this.url = input;
        this.method = init?.method ?? "GET";
        this.headers =
          init?.headers instanceof Headers
            ? init.headers
            : new Headers(init?.headers as Record<string, string>);
        this._body = (init?.body as string) ?? null;
      }
      async text() {
        return this._body ?? "";
      }
    },
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
  };
});

vi.mock("@/lib/gate/gate-proxy", () => ({
  proxyGateRequest: vi.fn(),
}));

describe("POST /api/gate/complete/3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should forward the JSON body to proxyGateRequest", async () => {
    const mockResponse = new Response(JSON.stringify({ passed: true }));
    vi.mocked(proxyGateRequest).mockResolvedValueOnce(mockResponse as never);

    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost:3000/api/gate/complete/3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: "test_secret" }),
    });

    const res = await POST(req);

    expect(res).toBe(mockResponse);
    expect(proxyGateRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        backendPath: "/api/gate/complete/3",
        body: JSON.stringify({ secret: "test_secret" }),
      }),
    );
  });

  it("should forward an empty body without error", async () => {
    const mockResponse = new Response(
      JSON.stringify({ passed: false, attempts: 1 }),
    );
    vi.mocked(proxyGateRequest).mockResolvedValueOnce(mockResponse as never);

    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost:3000/api/gate/complete/3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: "" }),
    });

    const res = await POST(req);

    expect(res).toBe(mockResponse);
    expect(proxyGateRequest).toHaveBeenCalledTimes(1);
  });
});

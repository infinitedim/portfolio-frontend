import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";
import { NextRequest } from "next/server";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("next/server", () => {
  const original = vi.importActual("next/server");
  return {
    ...original,
    NextRequest: class {
      url: string;
      method: string;
      headers: Headers;
      constructor(input: string, init?: RequestInit) {
        this.url = input;
        this.method = init?.method ?? "GET";
        this.headers =
          init?.headers instanceof Headers
            ? init.headers
            : new Headers(init?.headers);
      }
      clone() {
        return new (NextRequest as any)(this.url, {
          method: this.method,
          headers: new Headers(this.headers),
        });
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

vi.mock("@/lib/gate/referer-check", () => ({
  getTerminalRefererUrl: vi.fn(() => "http://localhost:3000/terminal"),
}));

describe("POST /api/gate/complete/3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should modify referer header and call proxyGateRequest when referer contains /gate/3", async () => {
    const mockResponse = new Response(JSON.stringify({ passed: true }));
    vi.mocked(proxyGateRequest).mockResolvedValueOnce(mockResponse as any);

    const req = new NextRequest("http://localhost:3000/api/gate/complete/3", {
      method: "POST",
      headers: {
        referer: "http://localhost:3000/gate/3",
      },
    });

    const res = await POST(req);

    expect(res).toBe(mockResponse);
    expect(proxyGateRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        backendPath: "/api/gate/complete/3",
        body: "{}",
        forwardReferer: true,
      }),
    );

    const callArg = vi.mocked(proxyGateRequest).mock.calls[0][0];
    const modifiedReq = callArg.request;
    expect(modifiedReq.headers.get("referer")).toBe(
      "http://localhost:3000/terminal",
    );
  });

  it("should not modify referer header if it doesn't contain /gate/3", async () => {
    const mockResponse = new Response(JSON.stringify({ passed: true }));
    vi.mocked(proxyGateRequest).mockResolvedValueOnce(mockResponse as any);

    const req = new NextRequest("http://localhost:3000/api/gate/complete/3", {
      method: "POST",
      headers: {
        referer: "http://localhost:3000/other-page",
      },
    });

    await POST(req);

    const callArg = vi.mocked(proxyGateRequest).mock.calls[0][0];
    const modifiedReq = callArg.request;
    expect(modifiedReq.headers.get("referer")).toBe(
      "http://localhost:3000/other-page",
    );
  });
});

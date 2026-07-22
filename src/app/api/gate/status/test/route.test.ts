import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";
import { NextRequest } from "next/server";

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

vi.mock("@/lib/gate/gate-proxy", () => ({
  proxyGateRequest: vi.fn(),
}));

describe("GET /api/gate/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call proxyGateRequest with GET method", async () => {
    const mockResponse = new Response(JSON.stringify({ unlocked: false }));
    vi.mocked(proxyGateRequest).mockResolvedValueOnce(mockResponse as any);

    const req = new NextRequest("http://localhost:3000/api/gate/status");
    const res = await GET(req);

    expect(res).toBe(mockResponse);
    expect(proxyGateRequest).toHaveBeenCalledWith({
      method: "GET",
      backendPath: "/api/gate/status",
      request: req,
    });
  });
});

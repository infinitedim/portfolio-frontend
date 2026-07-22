import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
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

describe("POST /api/gate/unlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call proxyGateRequest with POST method and body", async () => {
    const mockResponse = new Response(JSON.stringify({ unlocked: true }));
    vi.mocked(proxyGateRequest).mockResolvedValueOnce(mockResponse as any);

    const req = new NextRequest("http://localhost:3000/api/gate/unlock");
    const res = await POST(req);

    expect(res).toBe(mockResponse);
    expect(proxyGateRequest).toHaveBeenCalledWith({
      method: "POST",
      backendPath: "/api/gate/unlock",
      request: req,
      body: "{}",
    });
  });
});

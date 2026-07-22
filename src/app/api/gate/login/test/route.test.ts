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
      bodyText: string;
      constructor(input: string, init?: RequestInit) {
        this.url = input;
        this.bodyText = (init?.body as string) ?? "";
      }
      text() {
        return Promise.resolve(this.bodyText);
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

describe("POST /api/gate/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse body text and call proxyGateRequest", async () => {
    const mockResponse = new Response(JSON.stringify({ passed: true }));
    vi.mocked(proxyGateRequest).mockResolvedValueOnce(mockResponse as any);

    const bodyPayload = JSON.stringify({
      level: 1,
      username: "u",
      password: "p",
    });
    const req = new NextRequest("http://localhost:3000/api/gate/login", {
      method: "POST",
      body: bodyPayload,
    });

    const res = await POST(req);

    expect(res).toBe(mockResponse);
    expect(proxyGateRequest).toHaveBeenCalledWith({
      method: "POST",
      backendPath: "/api/gate/login",
      request: req,
      body: bodyPayload,
    });
  });
});

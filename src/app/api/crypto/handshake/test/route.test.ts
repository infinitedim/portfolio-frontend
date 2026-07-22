import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { serverHandshake } from "@/lib/crypto/server";

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

vi.mock("@/lib/crypto/server", () => ({
  serverHandshake: vi.fn(),
}));

function createMockRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/crypto/handshake", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/crypto/handshake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when clientPublicKey is missing or not a string", async () => {
    const req = createMockRequest({});
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("clientPublicKey");
  });
  it("should call serverHandshake and return handshake results on success", async () => {
    const mockResult = {
      serverPublicKey: "server_key",
      sessionId: "session_123",
    };
    vi.mocked(serverHandshake).mockReturnValueOnce(mockResult as any);

    const req = createMockRequest({ clientPublicKey: "client_key" });
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockResult);
    expect(res.headers.get("Cache-Control")).toBe(
      "no-store, no-cache, must-revalidate",
    );

    expect(serverHandshake).toHaveBeenCalledWith("client_key");
  });

  it("should return 500 when serverHandshake throws an error", async () => {
    vi.mocked(serverHandshake).mockImplementationOnce(() => {
      throw new Error("Handshake logic failed");
    });

    const req = createMockRequest({ clientPublicKey: "client_key" });
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("handshake failed");
    expect(data.detail).toBe("Handshake logic failed");
  });
});

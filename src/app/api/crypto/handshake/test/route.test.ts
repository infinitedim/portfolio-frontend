import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { serverHandshake } from "@/lib/crypto/server";

mock.module("@/lib/crypto/server", () => ({
  serverHandshake: jest.fn(),
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

/**
 * Creates a mock NextRequest instance targeting the crypto handshake endpoint with a JSON body.
 *
 * @param body - The payload data to serialize as JSON.
 * @returns A new mock Request instance.
 */
function createMockRequest(body: unknown): Request {
  return new NextRequest("http://localhost:3000/api/crypto/handshake", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }) as unknown as Request;
}

describe("POST /api/crypto/handshake", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    (serverHandshake as unknown as ReturnType<typeof jest.fn>).mockReturnValueOnce(mockResult as unknown as ReturnType<typeof serverHandshake>);

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
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (serverHandshake as unknown as ReturnType<typeof jest.fn>).mockImplementationOnce(() => {
      throw new Error("Handshake logic failed");
    });

    const req = createMockRequest({ clientPublicKey: "client_key" });
    const res = await POST(req as unknown as import("next/server").NextRequest);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("handshake failed");
    expect(data.detail).toBe("Handshake logic failed");
    errSpy.mockRestore();
  });
});

import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

mock.module("@/lib/gate/gate-proxy", () => ({
  proxyGateRequest: jest.fn(),
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

describe("POST /api/gate/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should forward request and body to proxyGateRequest", async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }));
    (proxyGateRequest as unknown as ReturnType<typeof jest.fn>).mockResolvedValueOnce(mockResponse as unknown as Response);

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

    expect(res as unknown as Response).toBe(mockResponse);
    expect(proxyGateRequest).toHaveBeenCalledWith({
      method: "POST",
      backendPath: "/api/gate/login",
      request: req,
      body: bodyPayload,
    });
  });
});

import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";
import { NextRequest } from "next/server";

mock.module("@/lib/gate/gate-proxy", () => ({
  proxyGateRequest: jest.fn(),
}));

import { GET } from "../route";

describe("GET /api/gate/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call proxyGateRequest with GET method", async () => {
    const mockResponse = new Response(JSON.stringify({ unlocked: false }));
    (proxyGateRequest as unknown as ReturnType<typeof jest.fn>).mockResolvedValueOnce(mockResponse as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/gate/status");
    const res = await GET(req);

    expect(res as unknown as Response).toBe(mockResponse);
    expect(proxyGateRequest).toHaveBeenCalledWith({
      method: "GET",
      backendPath: "/api/gate/status",
      request: req,
    });
  });
});

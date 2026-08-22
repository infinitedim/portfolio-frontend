import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

mock.module("@/lib/gate/gate-proxy", () => ({
  proxyGateRequest: jest.fn(),
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

describe("POST /api/gate/unlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call proxyGateRequest with POST method and body", async () => {
    const mockResponse = new Response(JSON.stringify({ unlocked: true }));
    (proxyGateRequest as unknown as ReturnType<typeof jest.fn>).mockResolvedValueOnce(mockResponse as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/gate/unlock");
    const res = await POST(req);

    expect(res as unknown as Response).toBe(mockResponse);
    expect(proxyGateRequest).toHaveBeenCalledWith({
      method: "POST",
      backendPath: "/api/gate/unlock",
      request: req,
      body: "{}",
    });
  });
});

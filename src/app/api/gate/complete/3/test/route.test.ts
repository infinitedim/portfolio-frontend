import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { proxyGateRequest } from "@/lib/gate/gate-proxy";

mock.module("@/lib/gate/gate-proxy", () => ({
  proxyGateRequest: jest.fn(),
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

describe("POST /api/gate/complete/3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should forward the JSON body to proxyGateRequest", async () => {
    const mockResponse = new Response(JSON.stringify({ passed: true }));
    (proxyGateRequest as unknown as ReturnType<typeof jest.fn>).mockResolvedValueOnce(mockResponse as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/gate/complete/3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: "test_secret" }),
    });

    const res = await POST(req);

    expect(res as unknown as Response).toBe(mockResponse);
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
    (proxyGateRequest as unknown as ReturnType<typeof jest.fn>).mockResolvedValueOnce(mockResponse as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/gate/complete/3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: "" }),
    });

    const res = await POST(req);

    expect(res as unknown as Response).toBe(mockResponse);
    expect(proxyGateRequest).toHaveBeenCalledTimes(1);
  });
});

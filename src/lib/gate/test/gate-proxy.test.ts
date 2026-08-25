import { describe, it, expect, mock, spyOn, beforeEach, afterEach } from "bun:test";
import { NextRequest, NextResponse } from "next/server";
import * as nextHeaders from "next/headers";

import {
  buildGateCookieHeader,
  applyBackendGateCookies,
  proxyGateRequest,
} from "../gate-proxy";

describe("gate-proxy", () => {
  let cookiesSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    cookiesSpy = spyOn(nextHeaders, "cookies").mockImplementation(
      async () =>
        ({
          get: (name: string) => {
            if (name === "gate_progress") return { name: "gate_progress", value: "level2" };
            return undefined;
          },
        }) as unknown as Awaited<ReturnType<typeof nextHeaders.cookies>>,
    );
  });

  afterEach(() => {
    cookiesSpy.mockRestore();
  });

  it("buildGateCookieHeader should format gate cookies cleanly", () => {
    const mockCookieStore = {
      get: (name: string) => {
        if (name === "gate_progress") return { name: "gate_progress", value: "level2" };
        if (name === "portfolio_gate") return { name: "portfolio_gate", value: "jwt123" };
        return undefined;
      },
    } as unknown as Parameters<typeof buildGateCookieHeader>[0];

    const header = buildGateCookieHeader(mockCookieStore);
    expect(header).toBe("gate_progress=level2; portfolio_gate=jwt123");
  });

  it("applyBackendGateCookies should copy Set-Cookie headers from backend response", () => {
    const backendResponse = {
      headers: {
        getSetCookie: () => ["gate_progress=level3; Path=/; Max-Age=3600"],
      },
    };

    const nextResponse = new NextResponse();
    applyBackendGateCookies(backendResponse as unknown as Response, nextResponse);
    expect(nextResponse.headers.get("set-cookie")).toContain("gate_progress=level3");
  });

  it("proxyGateRequest should handle 502 backend unreachable error", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async () => {
      throw new Error("Backend offline");
    }) as unknown as typeof fetch;

    try {
      const request = new NextRequest("http://localhost:3000/api/gate/status");
      const response = await proxyGateRequest({
        method: "GET",
        backendPath: "/api/gate/status",
        request,
      });

      expect(response.status).toBe(502);
      const json = await response.json();
      expect(json.error).toBe("Gate backend unreachable");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("proxyGateRequest should proxy request and forward Referer header when requested", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async () => {
      return {
        ok: true,
        status: 200,
        headers: {
          get: () => "application/json",
          getSetCookie: () => ["portfolio_gate=jwt-token-val; Path=/; Max-Age=86400"],
        },
        text: async () => JSON.stringify({ status: "ok" }),
      } as unknown as Response;
    }) as unknown as typeof fetch;

    try {
      const request = new NextRequest("http://localhost:3000/api/gate/unlock", {
        headers: { referer: "http://localhost:3000/gate/3" },
      });
      const response = await proxyGateRequest({
        method: "POST",
        backendPath: "/api/gate/unlock",
        request,
        body: JSON.stringify({ secret: "test" }),
        forwardReferer: true,
      });

      expect(response).toBeDefined();
      expect(response.headers.get("set-cookie")).toContain("portfolio_gate=jwt-token-val");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

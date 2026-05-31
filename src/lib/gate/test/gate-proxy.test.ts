import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import { applyBackendGateCookies } from "@/lib/gate/gate-proxy";

describe("applyBackendGateCookies", () => {
  it("copies gate_progress onto the frontend response", () => {
    const backend = new Response(JSON.stringify({ passed: true }), {
      headers: {
        "Set-Cookie":
          "gate_progress=abc-123; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400; Secure",
      },
    });

    const next = NextResponse.json({ ok: true });
    applyBackendGateCookies(backend, next);

    const setCookie = next.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("gate_progress=abc-123");
    expect(setCookie.toLowerCase()).toContain("httponly");
  });

  it("ignores unrelated backend cookies", () => {
    const backend = new Response("{}", {
      headers: {
        "Set-Cookie": "other=value; Path=/; HttpOnly",
      },
    });

    const next = NextResponse.json({});
    applyBackendGateCookies(backend, next);
    expect(next.headers.get("set-cookie")).toBeNull();
  });
});

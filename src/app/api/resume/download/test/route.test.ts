import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

describe("POST /api/resume/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CF_TURNSTILE_SECRET_KEY;
  });

  it("bypasses Turnstile in dev or unconfigured secret and fetches PDF from backend", async () => {
    const mockPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer;
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(mockPdfBytes, {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      }),
    );

    const req = new NextRequest("http://localhost:3000/api/resume/download", {
      method: "POST",
    });
    (req as any).json = vi.fn().mockResolvedValue({});

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain(
      "Dimas_Saputra_Resume.pdf",
    );
  });
});

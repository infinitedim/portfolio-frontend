import { test, expect } from "@playwright/test";

/** Legacy Cloud Run project id — must not appear in production CSP connect-src. */
const STALE_BACKEND_PROJECT = "1086149692502";

test.describe("Security Headers", () => {
  test("proxy sets CSP + request id headers", async ({ request }) => {
    const response = await request.get("/");

    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    expect(headers["content-security-policy"]).toBeTruthy();
    expect(headers["x-request-id"]).toBeTruthy();
  });

  test("CSP is PPR-compatible (no strict-dynamic or nonce)", async ({
    request,
  }) => {
    const response = await request.get("/roadmap");
    expect(response.ok()).toBeTruthy();

    const csp = response.headers()["content-security-policy"] ?? "";
    expect(csp).not.toContain("strict-dynamic");
    expect(csp).not.toContain("nonce-");
    expect(csp).toContain("'unsafe-inline'");
  });

  test("connect-src must not reference stale backend project", async ({
    request,
  }) => {
    const response = await request.get("/roadmap");
    expect(response.ok()).toBeTruthy();

    const csp = response.headers()["content-security-policy"] ?? "";
    const connectMatch = csp.match(/connect-src[^;]*/);
    expect(connectMatch).toBeTruthy();
    expect(connectMatch![0]).not.toContain(STALE_BACKEND_PROJECT);
  });

  test("Next.js chunk scripts are not blocked by CSP", async ({ page }) => {
    const cspViolations: Array<string> = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Content Security Policy")) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto("/roadmap", { waitUntil: "domcontentloaded" });

    const chunkResponse = await page.waitForResponse(
      (res) =>
        res.url().includes("/_next/static/chunks/") &&
        res.url().endsWith(".js"),
      { timeout: 15_000 },
    );
    expect(chunkResponse.status()).toBe(200);
    expect(cspViolations).toEqual([]);
  });
});

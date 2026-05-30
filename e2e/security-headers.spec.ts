import { test, expect } from "@playwright/test";

test.describe("Security Headers", () => {
  test("proxy sets CSP + request id headers", async ({ request }) => {
    const response = await request.get("/");

    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    expect(headers["content-security-policy"]).toBeTruthy();
    expect(headers["x-request-id"] || headers["x-nonce"]).toBeTruthy();
  });
});

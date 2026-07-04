import { test, expect } from "@playwright/test";

test.describe("Gate", () => {
  test("redirects /terminal to /gate without unlock cookie", async ({
    request,
  }) => {
    test.skip(
      process.env.NEXT_PUBLIC_GATE_ENABLED === "false",
      "Gate disabled in this environment",
    );

    const response = await request.get("/terminal", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    const location = response.headers()["location"] ?? "";
    expect(location).toContain("/gate");
  });
});
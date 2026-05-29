import { test, expect } from "@playwright/test";

test.describe("Gate", () => {
  test("shows locked terminal without unlock cookie", async ({ page }) => {
    test.skip(
      process.env.NEXT_PUBLIC_GATE_ENABLED === "false",
      "Gate disabled in this environment",
    );

    await page.goto("/terminal");
    await expect(page.getByText("Terminal locked")).toBeVisible({
      timeout: 10000,
    });
  });
});

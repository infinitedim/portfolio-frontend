import { test, expect } from "@playwright/test";

const isPlaywright =
  typeof process !== "undefined" &&
  (process.env.PLAYWRIGHT_WORKER_ID !== undefined ||
    process.env.TEST_WORKER_INDEX !== undefined);

if (isPlaywright) {
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
}

import { test, expect } from "@playwright/test";

// Guard: Playwright Test's test.describe() throws when invoked outside its
// runner. Bun's test runner picks up *.spec.ts files, so we skip the
// definitions entirely when a Playwright worker ID is absent.
const isPlaywright =
  typeof process !== "undefined" &&
  (process.env.PLAYWRIGHT_WORKER_ID !== undefined ||
    process.env.TEST_WORKER_INDEX !== undefined);

if (isPlaywright) {
  test.describe("Home page", () => {
    test("should load and show main content", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveTitle(/Terminal Portfolio|Full-Stack Developer/i);
      await expect(page.locator("#main-content")).toBeVisible({ timeout: 10000 });
    });

    test("should have terminal or loading state", async ({ page }) => {
      await page.goto("/");
      const terminalOrLoading = page.locator(
        '[data-testid="terminal"], [data-testid="terminal-loading-progress"], [id="main-content"]',
      );
      await expect(terminalOrLoading.first()).toBeVisible({ timeout: 15000 });
    });
  });
}

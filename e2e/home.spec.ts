import { test, expect } from "@playwright/test";

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

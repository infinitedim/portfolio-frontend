import { test, expect } from "@playwright/test";

test.describe("Terminal page", () => {
  test("should load terminal route when gate bypassed or unlocked", async ({
    page,
  }) => {
    test.skip(
      process.env.NEXT_PUBLIC_GATE_ENABLED !== "false",
      "Gate enabled — /terminal redirects without cookie; use gate e2e instead",
    );

    await page.goto("/terminal");
    await expect(page).toHaveTitle(/Terminal Portfolio|Full-Stack Developer/i);
    await expect(page.locator("#main-content")).toBeVisible({
      timeout: 10000,
    });
  });

  test("landing at / should not be the terminal", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dimas Saputra|Full-Stack Developer/i);
    const terminalOrLoading = page.locator(
      '[data-testid="terminal"], [data-testid="terminal-client"]',
    );
    await expect(terminalOrLoading).toHaveCount(0);
  });
});

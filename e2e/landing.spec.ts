import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("should load hero and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dimas Saputra|Full-Stack Developer/i);
    await expect(page.locator("#main-content")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("navigation", { name: /main/i })).toBeVisible();
  });

  test("should not show terminal testid on home", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="terminal"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="terminal-client"]')).toHaveCount(
      0,
    );
  });

  test("should have nav links to shared routes", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: /main/i });
    await expect(
      nav.getByRole("link", { name: "Projects", exact: true }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: "Blog", exact: true }),
    ).toBeVisible();
  });
});

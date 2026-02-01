import { test, expect } from "@playwright/test";

test.describe("Blog page", () => {
  test("should load blog list", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveTitle(/Blog/i);
    await expect(page.getByRole("heading", { name: /Blog/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show empty state or posts", async ({ page }) => {
    await page.goto("/blog");
    const emptyOrPosts = page.getByText(
      /No blog posts yet|Latest articles|Read more/i,
    );
    await expect(emptyOrPosts.first()).toBeVisible({ timeout: 10000 });
  });
});

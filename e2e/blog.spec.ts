import { test, expect } from "@playwright/test";

// Guard: Playwright Test's test.describe() throws when invoked outside its
// runner. Bun's test runner picks up *.spec.ts files, so we skip the
// definitions entirely when a Playwright worker ID is absent.
const isPlaywright =
  typeof process !== "undefined" &&
  (process.env.PLAYWRIGHT_WORKER_ID !== undefined ||
    process.env.TEST_WORKER_INDEX !== undefined);

if (isPlaywright) {
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
}

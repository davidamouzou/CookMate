import { test, expect } from "@playwright/test";

test("home page renders hero heading", async ({ page }) => {
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { name: /Explore/i })
  ).toBeVisible();
});

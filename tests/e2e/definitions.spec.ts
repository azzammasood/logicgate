import { test, expect } from "@playwright/test";

test.describe("definitions", () => {
  test.skip("create definition flow requires auth", async ({ page }) => {
    await page.goto("/app/definitions");
    await expect(page.getByText("New Definition")).toBeVisible();
  });
});

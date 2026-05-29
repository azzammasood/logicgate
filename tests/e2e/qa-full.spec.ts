import { test, expect } from "@playwright/test";
import { loginAsQaUser } from "./helpers/auth";

const email = process.env.QA_EMAIL ?? "";
const password = process.env.QA_PASSWORD ?? "";

test.describe.configure({ mode: "serial" });

test.describe("full QA", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!email || !password, "Set QA_EMAIL and QA_PASSWORD env vars");
    await loginAsQaUser(page);
  });

  test("definitions layout: list + empty center", async ({ page }) => {
    await page.goto("/app/definitions");
    await expect(page.getByText("All Definitions")).toBeVisible();
    await expect(page.getByRole("button", { name: "New" })).toBeVisible();
    await expect(page.getByPlaceholder("Search definitions...")).toBeVisible();
  });

  test("create definition with new group", async ({ page }) => {
    await page.goto("/app/definitions");
    await page.getByRole("button", { name: "New" }).click();
    const name = `QA Metric ${Date.now()}`;
    await page.getByPlaceholder("Name *").fill(name);
    await page.getByPlaceholder(/create new group/i).fill("QA Revenue");
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/\/app\/definitions\/.+/, { timeout: 20_000 });
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText("Visual Builder")).toBeVisible();
    await expect(page.getByText("Auto-compiled Pseudocode")).toBeVisible({ timeout: 15_000 });
  });

  test("profile menu and account dialog", async ({ page }) => {
    await page.goto("/app/definitions");
    const avatar = page.locator('[data-slot="avatar"]').last();
    await avatar.click();
    await expect(page.getByText(email)).toBeVisible();
    await page.getByRole("menuitem", { name: "Account" }).click();
    await expect(page.getByRole("dialog", { name: "Account" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Browse photo" })).toBeVisible();
    await page.getByRole("button", { name: "Save changes" }).click();
  });

  test("preferences dialog opens", async ({ page }) => {
    await page.goto("/app/definitions");
    await page.locator('[data-slot="avatar"]').last().click();
    await page.getByRole("menuitem", { name: "Preferences" }).click();
    await expect(page.getByRole("dialog", { name: "Preferences" })).toBeVisible();
    await expect(page.getByText("Colour mode")).toBeVisible();
  });

  test("settings appearance tab", async ({ page }) => {
    await page.goto("/app/settings");
    await page.getByRole("tab", { name: "Appearance" }).click();
    await expect(page.getByText("Theme")).toBeVisible();
  });

  test("nav pages load", async ({ page }) => {
    for (const path of ["/app/history", "/app/changes", "/app/team", "/app/export"]) {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("Application error");
    }
  });

  test("definition detail keeps list panel and pseudocode", async ({ page }) => {
    await page.goto("/app/definitions");
    const firstDef = page.locator('a[href^="/app/definitions/"]').first();
    await expect(firstDef).toBeVisible({ timeout: 10_000 });
    await firstDef.click();
    await expect(page.getByText("All Definitions")).toBeVisible();
    await expect(page.getByText("Visual Builder")).toBeVisible();
    await expect(page.getByText("Auto-compiled Pseudocode")).toBeVisible();
  });

  test("account: update title and role", async ({ page }) => {
    await page.goto("/app/definitions");
    await page.locator('[data-slot="avatar"]').last().click();
    await page.getByRole("menuitem", { name: "Account" }).click();
    const dialog = page.getByRole("dialog", { name: "Account" });
    await dialog.getByPlaceholder("e.g. Data Engineer").fill("QA Data Engineer");
    await dialog.getByText("Role", { exact: true }).locator("..").getByRole("combobox").click();
    await page.getByRole("option", { name: "Engineer" }).click();
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible({ timeout: 15_000 });
  });
});

import { type Page, expect } from "@playwright/test";

export async function loginAsQaUser(page: Page) {
  const email = process.env.QA_EMAIL ?? "";
  const password = process.env.QA_PASSWORD ?? "";
  if (!email || !password) {
    throw new Error("Set QA_EMAIL and QA_PASSWORD");
  }

  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);

  const syncResponse = page.waitForResponse(
    (r) => r.url().includes("/api/auth/sync") && r.request().method() === "POST",
    { timeout: 60_000 }
  );

  await page.getByRole("button", { name: "Sign in" }).click();

  const res = await syncResponse.catch(() => null);
  if (res && !res.ok()) {
    const body = await res.text();
    throw new Error(`auth/sync failed: ${res.status()} ${body}`);
  }

  await expect(page).toHaveURL(/\/app\//, { timeout: 60_000 });

  // Workspace onboarding modal may appear
  const orgDialog = page.getByRole("dialog", { name: /create your organization/i });
  if (await orgDialog.isVisible().catch(() => false)) {
    await page.getByLabel(/organization name/i).fill(`QA Org ${Date.now()}`);
    await page.getByRole("button", { name: /create organization/i }).click();
    await expect(orgDialog).toBeHidden({ timeout: 30_000 });
  }
}

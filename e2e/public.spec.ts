import { test, expect } from "@playwright/test";

test("landing renders without horizontal overflow or console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Connecting Students");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("protected routes redirect signed-out visitors to onboarding", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  for (const path of ["/dashboard", "/learn", "/profile", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/onboarding/);
  }
  await ctx.close();
});

test("unknown route shows the not-found page", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
});

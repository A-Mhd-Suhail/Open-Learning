import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

// Signed-in journeys. Skipped unless e2e/.auth/state.json exists (a test account's saved session; never commit it).
test.skip(!existsSync("e2e/.auth/state.json"), "no saved test session");

const ROUTES = ["/dashboard", "/learn", "/learn/school", "/learn/school/self-learning/videos", "/learn/school/friends", "/learn/school/community", "/profile"];

for (const route of ROUTES) {
  test(`${route} loads, no overflow, no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("video search narrows results and can be cleared", async ({ page }) => {
  await page.goto("/learn/school/self-learning/videos");
  const status = page.getByRole("status").filter({ hasText: /video/ });
  await expect(status).toContainText(/\d+ videos?/);
  await page.getByLabel("Search videos").fill("zzzz-no-such-video");
  await expect(page.getByText("No results found")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).last().click();
  await expect(page.getByText("No results found")).toBeHidden();
});

test("sidebar navigation moves between pages", async ({ page, isMobile }) => {
  await page.goto("/dashboard");
  if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/profile/);
});

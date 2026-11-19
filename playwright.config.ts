import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const AUTH = "e2e/.auth/state.json"; // create with: npx playwright codegen --save-storage=e2e/.auth/state.json http://localhost:3000/onboarding
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000", channel: "chrome", storageState: existsSync(AUTH) ? AUTH : undefined },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});

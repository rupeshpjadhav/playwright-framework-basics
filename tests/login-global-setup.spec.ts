// Global Setup & Teardown Demo
//
// Global setup runs ONCE before ALL test files (not per-file like beforeAll).
// Global teardown runs ONCE after ALL test files have finished.
//
// Common use cases:
//   - Global Setup:  load env vars, seed databases, start services, authenticate once
//   - Global Teardown: clean up test data, stop services, generate summary reports
//
// Configuration in playwright.config.ts:
//   export default defineConfig({
//     globalSetup: './tests/global/globalSetup.ts',
//     globalTeardown: './tests/global/globalTeardown.ts',
//     ...
//   });
//
// The global setup file exports a default async function that receives FullConfig.
// The global teardown file exports a default async function that receives FullConfig.
//
// This test file demonstrates consuming data prepared by global setup.
// Since global setup loads .env, tests can read process.env directly.
//
// NOTE: To see global setup/teardown in action, add the config lines above
// to playwright.config.ts and run: npx playwright test tests/login_global.spec.ts

import { test, expect } from "@playwright/test";
import { loadEnv, getEnvValue } from "./utils/envLoader";

// In a real setup, globalSetup.ts would have already loaded the env vars.
// For this self-contained demo, we load them here via beforeAll.
// When wired through playwright.config.ts, this beforeAll would be unnecessary.
test.beforeAll(() => {
  loadEnv();
});

test("global setup demo — env vars loaded by setup", async ({ page }) => {
  // These values would normally be loaded by globalSetup.ts before any test runs.
  // Global setup ensures they're available to ALL test files, not just this one.
  const appUrl = getEnvValue("APP_URL");

  await page.goto(appUrl);
  await expect(page).toHaveTitle("Test Login | Practice Test Automation");

  console.log("[Global Demo] APP_URL loaded:", appUrl);
});

test("global setup demo — valid login using global env", async ({ page }) => {
  const appUrl = getEnvValue("APP_URL");
  const username = getEnvValue("VALID_USERNAME");
  const password = getEnvValue("VALID_PASSWORD");

  await page.goto(appUrl);
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
});

test("global setup demo — shared timestamp from setup", async () => {
  // When globalSetup.ts runs, it sets GLOBAL_SETUP_TIMESTAMP in process.env.
  // This demonstrates how global setup can share data with all tests via env vars.
  //
  // Without global setup wired in config, this will be undefined.
  // With global setup: process.env.GLOBAL_SETUP_TIMESTAMP = "2024-01-15T10:30:00.000Z"
  const timestamp = process.env.GLOBAL_SETUP_TIMESTAMP;

  if (timestamp) {
    console.log(`[Global Demo] Setup ran at: ${timestamp}`);
    expect(timestamp).toBeTruthy();
  } else {
    console.log("[Global Demo] GLOBAL_SETUP_TIMESTAMP not set — wire globalSetup in config to see this.");
    // This is expected when running without global setup configured.
  }
});

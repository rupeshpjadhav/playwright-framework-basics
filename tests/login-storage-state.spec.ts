// Storage State / Auth Reuse Demo
//
// Storage State saves the browser's cookies and localStorage to a JSON file
// after logging in once. Subsequent tests load that file to skip the login step entirely.
//
// Why use it:
//   - Login is slow (navigating, filling forms, waiting for redirects).
//   - Most tests need an authenticated user but don't test the login itself.
//   - Storage state lets you log in ONCE and reuse that session across many tests.
//
// How it works:
//   1. A "setup" test logs in and calls context.storageState({ path }) to save cookies/localStorage.
//   2. Other tests create a new browser context with { storageState: path } to restore the session.
//
// In a real project, you'd configure this in playwright.config.ts:
//   projects: [
//     { name: 'setup', testMatch: /.*\.setup\.ts/ },
//     {
//       name: 'chromium',
//       dependencies: ['setup'],
//       use: { storageState: './tests/data/.auth/state.json' },
//     },
//   ]
//
// This file demonstrates the concept in a self-contained way using test.describe.serial().

import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// Path where the auth state will be saved.
const authDir = path.resolve(process.cwd(), "tests", "data", ".auth");
const authStatePath = path.join(authDir, "state.json");

// serial() ensures tests run in order — the setup test must run first.
test.describe.serial("Storage State Demo", () => {
  test("step 1: login and SAVE storage state", async ({ page, context }) => {
    // Create the .auth directory if it doesn't exist.
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Perform the login flow.
    await page.goto("https://practicetestautomation.com/practice-test-login/");
    await page.getByRole("textbox", { name: "Username" }).fill("student");
    await page.getByRole("textbox", { name: "Password" }).fill("Password123");
    await page.getByRole("button", { name: "Submit" }).click();

    // Verify we're logged in.
    await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();

    // SAVE the browser context's storage state (cookies + localStorage) to a JSON file.
    // This captures the authenticated session so other tests can reuse it.
    await context.storageState({ path: authStatePath });

    console.log(`[Storage State] Auth state saved to: ${authStatePath}`);
  });

  test("step 2: REUSE storage state — skip login", async ({ browser }) => {
    // Create a NEW browser context pre-loaded with the saved storage state.
    // This restores cookies and localStorage from the previous login.
    const context = await browser.newContext({ storageState: authStatePath });
    const page = await context.newPage();

    // Navigate directly to the post-login page.
    // In a real app with proper session management, you'd already be authenticated.
    await page.goto("https://practicetestautomation.com/practice-test-login/");

    // Verify the page loaded (demonstrates that the context was created with saved state).
    await expect(page).toHaveTitle(/Test Login/);

    console.log("[Storage State] New context created with saved auth state.");

    // Always close contexts you create manually.
    await context.close();
  });

  test("step 3: verify saved state file exists", async () => {
    // The state.json file should exist after step 1.
    // It contains cookies and localStorage entries in JSON format.
    const stateExists = fs.existsSync(authStatePath);
    expect(stateExists).toBeTruthy();

    // Read and inspect the saved state structure.
    const stateContent = JSON.parse(fs.readFileSync(authStatePath, "utf8"));

    // Storage state has two main sections: cookies and origins (localStorage).
    console.log(`[Storage State] Cookies saved: ${stateContent.cookies?.length || 0}`);
    console.log(`[Storage State] Origins saved: ${stateContent.origins?.length || 0}`);
  });
});

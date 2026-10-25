// Test Tagging & Filtering Demo — @smoke, @sanity, @regression
//
// Playwright supports tagging tests so you can run a targeted subset.
// Tags are defined using the second argument of test():
//
//   test("name", { tag: "@smoke" }, async ({ page }) => { ... })
//   test("name", { tag: ["@smoke", "@regression"] }, async ({ page }) => { ... })
//
// Running tagged subsets:
//   npx playwright test --grep "@smoke"           # only smoke tests
//   npx playwright test --grep "@sanity"          # only sanity tests
//   npx playwright test --grep "@regression"      # only regression tests
//   npx playwright test --grep "@smoke|@sanity"   # smoke OR sanity
//   npx playwright test --grep-invert "@regression" # everything EXCEPT regression
//
// Tag Definitions Used in This Project:
//
//   @smoke      — Minimal set of tests that verify the app is alive and the most
//                 critical path works. Run these first after every deployment.
//                 If any smoke test fails, stop — the app is broken.
//
//   @sanity     — Broader than smoke. Verify a specific feature end-to-end after
//                 a code change or bug fix. Faster than a full regression run.
//
//   @regression — Complete test coverage. Run before every release to ensure
//                 no existing functionality has broken. Includes all edge cases.
//
// A test can carry multiple tags when it belongs to more than one category.
// For example, a critical login test is part of smoke, sanity, AND regression.
//
// ─────────────────────────────────────────────────────────────
// REAL-WORLD USAGE NOTE
// ─────────────────────────────────────────────────────────────
//
// In a real project you do NOT create a separate file for tagged tests.
// Instead, you add the { tag } option directly to your EXISTING tests.
//
// This is equivalent to pytest markers:
//
//   Python/pytest:
//     @pytest.mark.smoke
//     @pytest.mark.regression
//     def test_valid_login(page):     ← existing test, just decorated
//         ...
//
//   Playwright/Node.js equivalent:
//     test(                           ← same existing test
//       "valid login test",
//       { tag: ["@smoke", "@regression"] },   ← just add this option
//       async ({ page }) => {
//         // test body unchanged
//       }
//     );
//
// Example of how existing tests in THIS project would be tagged in real life:
//
//   login-basic.spec.ts
//     "title test"           → { tag: "@smoke" }
//     "valid login test"     → { tag: ["@smoke", "@sanity", "@regression"] }
//     "invalid username test"→ { tag: ["@sanity", "@regression"] }
//     "invalid password test"→ { tag: ["@sanity", "@regression"] }
//
//   login-page-object-model.spec.ts
//     "POM valid login test"     → { tag: "@regression" }
//     "POM invalid username test"→ { tag: "@regression" }
//     "POM invalid password test"→ { tag: "@regression" }
//
//   login-data-env.spec.ts
//     "env-based valid login test"   → { tag: "@regression" }
//     "env-based invalid username test" → { tag: "@regression" }
//     "env-based invalid password test" → { tag: "@regression" }
//
// This file exists purely as a LEARNING DEMO to show:
//   1. The tag syntax in Playwright
//   2. What smoke / sanity / regression mean and when to run each
//   3. How multi-tagging works
//
// In your actual test suite, delete this file and tag your existing tests instead.

import { test, expect } from "@playwright/test";
import { loadEnv, getEnvValue } from "./utils/envLoader";

const LOGIN_URL = "https://practicetestautomation.com/practice-test-login/";

test.beforeAll(() => {
  loadEnv();
});

// ─────────────────────────────────────────────────────────────
// SMOKE TESTS
// Purpose: Prove the app is up and the single most critical
//          user flow (login) works. Fast — 2-3 tests max.
// Run after: every deployment to any environment.
// ─────────────────────────────────────────────────────────────

test(
  "smoke: login page loads successfully",
  { tag: "@smoke" },
  async ({ page }) => {
    // Simplest possible check — can the page load at all?
    await page.goto(LOGIN_URL);
    await expect(page).toHaveTitle("Test Login | Practice Test Automation");
  }
);

test(
  "smoke: valid login works",
  // This test belongs to all three categories — it is the single most
  // important scenario and must always pass regardless of what changed.
  { tag: ["@smoke", "@sanity", "@regression"] },
  async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
    await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
  }
);

// ─────────────────────────────────────────────────────────────
// SANITY TESTS
// Purpose: Verify the login feature works correctly end-to-end,
//          including both success and error scenarios.
// Run after: a bug fix or change related to the login feature.
// ─────────────────────────────────────────────────────────────

test(
  "sanity: login form has all required elements",
  { tag: "@sanity" },
  async ({ page }) => {
    // Verify the page renders all the expected UI elements before interacting.
    await page.goto(LOGIN_URL);
    await expect(page.getByRole("textbox", { name: "Username" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  }
);

test(
  "sanity: invalid username shows correct error",
  { tag: ["@sanity", "@regression"] },
  async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("INVALID_USERNAME"));
    await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.locator("#error").getByText("Your username is invalid!")).toBeVisible();
  }
);

test(
  "sanity: invalid password shows correct error",
  { tag: ["@sanity", "@regression"] },
  async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
    await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("INVALID_PASSWORD"));
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.locator("#error").getByText("Your password is invalid!")).toBeVisible();
  }
);

// ─────────────────────────────────────────────────────────────
// REGRESSION TESTS
// Purpose: Full coverage — every scenario, every edge case.
//          Ensures nothing that worked before has been broken.
// Run before: every release / sprint sign-off.
// ─────────────────────────────────────────────────────────────

test(
  "regression: valid login and logout flow",
  { tag: "@regression" },
  async ({ page }) => {
    // Full end-to-end flow: login → verify success → logout → verify back on login page.
    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
    await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();

    // Verify logout link appears after login.
    await expect(page.getByRole("link", { name: "Log out" })).toBeVisible();
    await page.getByRole("link", { name: "Log out" }).click();

    // After logout, the login form should be visible again.
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  }
);

test(
  "regression: empty username is rejected",
  { tag: "@regression" },
  async ({ page }) => {
    // Submitting with no username should show a validation error.
    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.locator("#error")).toBeVisible();
  }
);

test(
  "regression: empty password is rejected",
  { tag: "@regression" },
  async ({ page }) => {
    // Submitting with no password should show a validation error.
    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.locator("#error")).toBeVisible();
  }
);

test(
  "regression: both fields empty is rejected",
  { tag: "@regression" },
  async ({ page }) => {
    // Submitting the form with no input at all should show an error.
    await page.goto(LOGIN_URL);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.locator("#error")).toBeVisible();
  }
);

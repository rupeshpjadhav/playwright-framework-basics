// Soft Assertions — expect.soft()
//
// By default a Playwright assertion STOPS the test immediately when it fails.
// The test does not execute any code after the failed expect().
//
// Soft assertions are DIFFERENT:
//   - The test continues running even when a soft assertion fails.
//   - All soft assertion failures are collected throughout the test.
//   - At the end of the test, Playwright reports ALL failures together.
//
// WHY USE SOFT ASSERTIONS?
//   Imagine a form with 10 fields. If you use regular assertions and field 3
//   fails, you never know whether fields 4-10 are correct — you have to fix
//   field 3, re-run, discover field 7 fails, fix it, re-run... many cycles.
//
//   With soft assertions, one test run reveals ALL failures at once.
//
// SYNTAX
//   Regular:  expect(locator).toBeVisible()       ← stops on failure
//   Soft:     expect.soft(locator).toBeVisible()  ← continues on failure
//
// IMPORTANT
//   The test still FAILS overall if any soft assertion failed —
//   soft assertions do not suppress failures, they only delay reporting.
//
// RUNNING THESE TESTS
//   npx playwright test tests/soft-assertions.spec.ts --project=chromium

import { test, expect } from "@playwright/test";

const PRACTICE_URL = "https://testautomationpractice.blogspot.com/";
const LOGIN_URL     = "https://practicetestautomation.com/practice-test-login/";

// ─────────────────────────────────────────────────────────────
// TEST 1: Regular assertion (hard) vs soft assertion — concept demo
//
// Shows the fundamental difference in behaviour.
// ─────────────────────────────────────────────────────────────

test("soft assertions: verify multiple page elements at once", async ({ page }) => {
  await page.goto(PRACTICE_URL);
  await page.waitForLoadState("networkidle");

  // ── SOFT ASSERTIONS ─────────────────────────────────────────
  // Each `expect.soft()` continues the test even if it fails.
  // All failures are collected and reported together at the end.

  // Verify page title
  await expect.soft(page).toHaveTitle(/Automation/i);

  // Verify key form elements exist
  await expect.soft(page.locator("#name")).toBeVisible();
  await expect.soft(page.locator("#email")).toBeVisible();
  await expect.soft(page.getByRole("button", { name: "Submit" }).first()).toBeVisible();

  // Verify dialog buttons exist
  await expect.soft(page.locator("#alertBtn")).toBeVisible();
  await expect.soft(page.locator("#confirmBtn")).toBeVisible();
  await expect.soft(page.locator("#promptBtn")).toBeVisible();

  // Verify drag and drop elements exist
  await expect.soft(page.locator("#draggable")).toBeVisible();
  await expect.soft(page.locator("#droppable")).toBeVisible();

  // Verify New Tab button exists
  await expect.soft(page.getByRole("button", { name: "New Tab" })).toBeVisible();

  // ── INTENTIONAL NEAR-MISS (comment in to see collected failures) ─────
  // Uncomment the line below to see how soft assertions report ALL failures:
  // await expect.soft(page).toHaveTitle("This title does not exist");
  // await expect.soft(page.locator("#nonExistentElement")).toBeVisible();
  //
  // Without soft assertions, only the first failure would be reported.
  // With soft assertions, both failures would appear in the test report.
});

// ─────────────────────────────────────────────────────────────
// TEST 2: Soft assertions for form field validation
//
// Real-world use: after submitting a form, verify all error
// messages appear correctly — not just the first one.
// ─────────────────────────────────────────────────────────────

test("soft assertions: validate all login form error messages", async ({ page }) => {
  await page.goto(LOGIN_URL);

  // Submit with invalid credentials — this should trigger an error.
  await page.getByRole("textbox", { name: "Username" }).fill("wronguser");
  await page.getByRole("textbox", { name: "Password" }).fill("wrongpassword");
  await page.getByRole("button",  { name: "Submit" }).click();

  // Use soft assertions to verify ALL aspects of the error state.
  // If any one fails, we still check the rest and get a full picture.

  // 1. Error message must be visible.
  await expect.soft(page.locator("#error")).toBeVisible();

  // 2. Error message must contain the expected text.
  await expect.soft(page.locator("#error")).toContainText("Your username is invalid!");

  // 3. The success heading must NOT be visible.
  await expect.soft(page.getByRole("heading", { name: "Logged In Successfully" })).not.toBeVisible();

  // 4. The form must still be visible (user can retry).
  await expect.soft(page.getByRole("textbox", { name: "Username" })).toBeVisible();
  await expect.soft(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  await expect.soft(page.getByRole("button",  { name: "Submit" })).toBeVisible();
});

// ─────────────────────────────────────────────────────────────
// TEST 3: Mixing hard and soft assertions
//
// A common pattern: use a hard assertion for a critical prerequisite
// (if the page didn't even load, no point checking anything),
// then soft assertions for the detailed checks.
// ─────────────────────────────────────────────────────────────

test("soft assertions: mixed hard and soft in one test", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  // HARD assertion — prerequisite. If this fails the test stops immediately.
  // There is no point checking page elements if the page didn't load.
  await expect(page).toHaveTitle(/Automation/i);

  // SOFT assertions — details. All checked regardless of individual failures.
  await expect.soft(page.locator("#name")).toBeVisible();
  await expect.soft(page.locator("#email")).toBeVisible();

  // Verify text content of draggable element.
  await expect.soft(page.locator("#draggable")).toContainText("Drag me");
  await expect.soft(page.locator("#droppable")).toContainText("Drop here");

  // Verify heading sections exist.
  await expect.soft(page.getByRole("heading", { name: /Alerts/i })).toBeVisible();
  await expect.soft(page.getByRole("heading", { name: /Drag and Drop/i })).toBeVisible();
  await expect.soft(page.getByRole("heading", { name: /Upload/i })).toBeVisible();
});

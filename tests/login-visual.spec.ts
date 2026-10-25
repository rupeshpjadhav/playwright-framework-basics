// Visual / Screenshot Testing — toHaveScreenshot()
//
// Visual testing compares what the browser renders against a previously
// saved "baseline" screenshot, pixel by pixel. If any pixel differs beyond
// a configurable threshold, the test fails.
//
// This catches visual regressions that functional tests miss:
//   - A CSS change shifts a button 2px to the left.
//   - A font upgrade changes text rendering.
//   - A color was accidentally changed from #0077FF to #0077EE.
//   - An element overlaps another element due to a layout bug.
//
// HOW BASELINES WORK
//   First run:   Playwright creates a baseline image in
//                tests/login-visual.spec.ts-snapshots/
//                The test PASSES on first run (baseline is created).
//
//   Next runs:   Playwright renders the page fresh and compares it
//                to the baseline pixel-by-pixel.
//                If pixels differ above the threshold → test FAILS.
//                A diff image is saved to test-results/ showing the differences.
//
//   Updating:    When you intentionally change the UI and need to update baselines:
//                npx playwright test tests/login-visual.spec.ts --update-snapshots
//
// SNAPSHOT LOCATION
//   tests/login-visual.spec.ts-snapshots/
//   Each snapshot is named: <test-name>-<browser>-<platform>.png
//   Example: login-page-default-look-chromium-darwin.png
//
// RUNNING THESE TESTS
//   npx playwright test tests/login-visual.spec.ts
//   npx playwright test tests/login-visual.spec.ts --project=chromium
//   npx playwright test tests/login-visual.spec.ts --update-snapshots  (regenerate baselines)

import { test, expect } from "@playwright/test";

// Baselines are committed for Chromium/macOS only
// (tests/login-visual.spec.ts-snapshots/*-chromium-darwin.png).
// Skip the other engines so a full `npx playwright test` run does not fail
// on missing Firefox/WebKit snapshots. Regenerate with:
//   npx playwright test tests/login-visual.spec.ts --update-snapshots
test.beforeEach(async ({ browserName }) => {
  test.skip(browserName !== "chromium", "Visual baselines are Chromium-only");
});

const LOGIN_URL = "https://practicetestautomation.com/practice-test-login/";

// ─────────────────────────────────────────────────────────────
// TEST 1: Full-page screenshot — default look
//
// Captures the entire page (including content below the fold)
// and compares it to the saved baseline.
// ─────────────────────────────────────────────────────────────

test("visual: login page default appearance", async ({ page }) => {
  await page.goto(LOGIN_URL);

  // Wait for the page to be fully loaded before screenshotting.
  // Animations or lazy-loaded images can cause flakiness if you screenshot too early.
  await page.waitForLoadState("networkidle");

  // toHaveScreenshot() captures the page and compares it to the baseline.
  // On first run: creates the baseline file. On subsequent runs: compares.
  await expect(page).toHaveScreenshot("login-page-default.png", {
    // fullPage: true captures content below the visible viewport.
    fullPage: true,

    // maxDiffPixels: how many pixels are allowed to differ before the test fails.
    // A small value (e.g., 50) makes the test very strict.
    // A larger value (e.g., 500) allows for minor rendering differences across
    // machines (font anti-aliasing, sub-pixel rendering vary by OS/GPU).
    maxDiffPixels: 100,
  });
});

// ─────────────────────────────────────────────────────────────
// TEST 2: Element-level screenshot — just the form
//
// Instead of capturing the whole page, you can screenshot a specific
// element (a component, a card, a button, etc.).
// This is more focused and less prone to failures from
// unrelated parts of the page changing.
// ─────────────────────────────────────────────────────────────

test("visual: login form component appearance", async ({ page }) => {
  await page.goto(LOGIN_URL);
  await page.waitForLoadState("networkidle");

  // Locate the login section.
  // On this site the login form lives inside <section id="login">.
  const form = page.locator("#login");

  // toHaveScreenshot() on a locator captures only that element.
  await expect(form).toHaveScreenshot("login-form-component.png", {
    maxDiffPixels: 50,
  });
});

// ─────────────────────────────────────────────────────────────
// TEST 3: Screenshot with fields filled
//
// Capture the form in its "filled" state — after entering credentials.
// Useful for verifying the filled state looks correct:
//   - Password field shows dots (•••), not plain text.
//   - Username field shows the correct text.
//   - No unexpected validation styling appeared.
// ─────────────────────────────────────────────────────────────

test("visual: login form filled state", async ({ page }) => {
  await page.goto(LOGIN_URL);
  await page.waitForLoadState("networkidle");

  // Fill the form fields to put it in the "filled" state.
  await page.getByRole("textbox", { name: "Username" }).fill("student");
  await page.getByRole("textbox", { name: "Password" }).fill("Password123");

  // Screenshot the login section — password should show as dots, username as text.
  const form = page.locator("#login");
  await expect(form).toHaveScreenshot("login-form-filled.png", {
    maxDiffPixels: 50,
  });
});

// ─────────────────────────────────────────────────────────────
// TEST 4: Screenshot after login — success state
//
// Capture the post-login success page.
// If a UI change accidentally moves the heading, changes its color,
// or adds unexpected content, this test will catch it.
// ─────────────────────────────────────────────────────────────

test("visual: post-login success page", async ({ page }) => {
  await page.goto(LOGIN_URL);

  await page.getByRole("textbox", { name: "Username" }).fill("student");
  await page.getByRole("textbox", { name: "Password" }).fill("Password123");
  await page.getByRole("button",  { name: "Submit"   }).click();

  // Wait for the success heading before screenshotting.
  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();

  // Allow any animations to settle before capturing.
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveScreenshot("login-success-page.png", {
    fullPage: true,
    maxDiffPixels: 150,
  });
});

// ─────────────────────────────────────────────────────────────
// TEST 5: Screenshot error state
//
// Capture what the page looks like after a failed login attempt.
// Verifies the error message is styled correctly (color, position, font).
// ─────────────────────────────────────────────────────────────

test("visual: login error state appearance", async ({ page }) => {
  await page.goto(LOGIN_URL);

  await page.getByRole("textbox", { name: "Username" }).fill("wronguser");
  await page.getByRole("textbox", { name: "Password" }).fill("wrongpassword");
  await page.getByRole("button",  { name: "Submit"   }).click();

  // Wait for the error message to appear before screenshotting.
  await expect(page.locator("#error")).toBeVisible();

  // Screenshot just the error message element.
  await expect(page.locator("#error")).toHaveScreenshot("login-error-message.png", {
    maxDiffPixels: 30,
  });
});

// ─────────────────────────────────────────────────────────────
// TEST 6: Mask dynamic content before comparing
//
// Some page areas change on every render (timestamps, ad banners,
// random profile pictures). If you screenshot them they will always
// differ from the baseline and cause false failures.
//
// The `mask` option replaces specified elements with a solid colour
// before comparison, so dynamic content is ignored.
// ─────────────────────────────────────────────────────────────

test("visual: full page with dynamic content masked", async ({ page }) => {
  await page.goto(LOGIN_URL);
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveScreenshot("login-page-masked.png", {
    fullPage: true,
    maxDiffPixels: 100,

    // `mask` accepts an array of locators.
    // Each matched element is replaced by a magenta rectangle in the screenshot.
    // Use this for: timestamps, user avatars, ad slots, animated banners.
    mask: [
      // Mask the page footer if it contains dynamic content.
      page.locator("footer"),
    ],

    // `maskColor` sets the colour of the mask rectangle. Default is magenta.
    maskColor: "#FF00FF",
  });
});

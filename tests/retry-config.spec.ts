// Per-Test Retry Configuration — test.describe.configure({ retries })
//
// Playwright retries are normally configured globally in playwright.config.ts:
//   retries: process.env.CI ? 2 : 0
//
// But you can also configure retries at a finer granularity:
//
//   test.describe.configure({ retries: N })  → applies to all tests in this describe
//   test.retries(N)                           → applies to a single test only
//
// These LOCAL settings OVERRIDE the global config for that specific test/group.
//
// WHY USE PER-TEST RETRIES?
//   - Some tests are inherently flaky (external dependencies, animations,
//     network timing) and need retries while others are solid and shouldn't.
//   - A smoke suite should NEVER retry — if it fails, it's a real failure.
//   - A test hitting an external API should retry because the API may hiccup.
//   - You don't want to inflate the global retry count just for a few tests.
//
// HOW RETRIES WORK
//   - Playwright re-runs the ENTIRE test from the beginning, not from where it failed.
//   - Each retry gets a fresh browser context (no state from the previous attempt).
//   - The test PASSES as long as ONE attempt succeeds.
//   - If all attempts fail, the test is marked as FAILED.
//   - Retried tests are tagged in the HTML report with attempt numbers.
//
// IDENTIFYING RETRY ATTEMPTS IN CODE
//   testInfo.retry       → which attempt this is (0 = first run, 1 = first retry)
//   testInfo.retries     → total retries configured for this test
//
// RUNNING THESE TESTS
//   npx playwright test tests/retry-config.spec.ts --project=chromium

import { test, expect } from "@playwright/test";

const PRACTICE_URL = "https://testautomationpractice.blogspot.com/";
const LOGIN_URL     = "https://practicetestautomation.com/practice-test-login/";

// ─────────────────────────────────────────────────────────────
// BLOCK 1: Retries configured at describe level
//
// ALL tests in this describe block get 2 retries.
// This overrides the global config just for this group.
// ─────────────────────────────────────────────────────────────

test.describe("retry at describe level: 2 retries for all tests", () => {
  // This applies to every test inside this describe block.
  test.describe.configure({ retries: 2 });

  test("retry-describe: valid login succeeds", async ({ page }, testInfo) => {
    // testInfo.retry tells you which attempt this is (0 = first run).
    // This is useful for logging or for skipping expensive setup on retries.
    console.log(`[Retry Demo] Attempt ${testInfo.retry + 1} of ${testInfo.retries + 1}`);

    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill("student");
    await page.getByRole("textbox", { name: "Password" }).fill("Password123");
    await page.getByRole("button",  { name: "Submit" }).click();
    await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
  });

  test("retry-describe: practice page loads", async ({ page }, testInfo) => {
    console.log(`[Retry Demo] Attempt ${testInfo.retry + 1} of ${testInfo.retries + 1}`);

    await page.goto(PRACTICE_URL);
    await expect(page).toHaveTitle(/Automation/i);
    await expect(page.locator("#alertBtn")).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// BLOCK 2: test.retries(N) on individual tests
//
// Each test can have its own retry count, independent of others.
// ─────────────────────────────────────────────────────────────

// Per-test retry configuration in Playwright is set at the DESCRIBE level,
// not inside individual test bodies. To give different tests different retry
// counts, place them in separate describe blocks with different configure() calls.
//
// HOW TO SET RETRIES PER TEST (correct approach):
//   test.describe("critical — no retries", () => {
//     test.describe.configure({ retries: 0 });
//     test("...", async () => { ... });
//   });
//
//   test.describe("flaky — 3 retries", () => {
//     test.describe.configure({ retries: 3 });
//     test("...", async () => { ... });
//   });

test.describe("individual: stable tests — 0 retries", () => {
  // 0 retries: any failure is a real bug, stop immediately.
  test.describe.configure({ retries: 0 });

  test("individual retry 0: smoke — no retries (stable test)", async ({ page }, testInfo) => {
    console.log(`[Retry Demo] Running with ${testInfo.retries} retries configured`);

    await page.goto(LOGIN_URL);
    await expect(page).toHaveTitle("Test Login | Practice Test Automation");
  });
});

test.describe("individual: network-dependent tests — 2 retries", () => {
  // 2 retries: external resource may hiccup; give it more chances.
  test.describe.configure({ retries: 2 });

  test("individual retry 2: external page — extra retries for resilience", async ({ page }, testInfo) => {
    console.log(`[Retry Demo] Attempt ${testInfo.retry + 1} of ${testInfo.retries + 1}`);

    await page.goto(PRACTICE_URL);
    await expect(page).toHaveTitle(/Automation/i);
  });
});

// ─────────────────────────────────────────────────────────────
// BLOCK 3: Using testInfo.retry to change behaviour per attempt
//
// Sometimes you want to do something differently on a retry:
//   - Take a screenshot only on failure attempts
//   - Clear cookies or cache before a retry
//   - Log extra debug info on retry attempts
//   - Skip expensive data setup on retries (use cached state)
// ─────────────────────────────────────────────────────────────

test.describe("retry-aware logic: different behaviour per attempt", () => {
  test.describe.configure({ retries: 1 });

  test("retry-aware: log extra info on retry attempts", async ({ page }, testInfo) => {
    const isRetry = testInfo.retry > 0;

    if (isRetry) {
      // On a retry, log additional context to help diagnose why the first attempt failed.
      console.log(`[Retry Demo] This is a RETRY (attempt ${testInfo.retry + 1})`);
      console.log(`[Retry Demo] Previous attempt failed — capturing extra diagnostics`);
    } else {
      console.log(`[Retry Demo] First attempt — running normally`);
    }

    await page.goto(LOGIN_URL);

    // On a retry, attach a screenshot for debugging.
    if (isRetry) {
      const screenshot = await page.screenshot();
      await testInfo.attach(`retry-${testInfo.retry}-screenshot.png`, {
        body: screenshot,
        contentType: "image/png",
      });
    }

    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
    await expect(page).toHaveTitle("Test Login | Practice Test Automation");
  });

  test("retry-aware: valid login with retry context", async ({ page }, testInfo) => {
    console.log(`[Retry Demo] Attempt ${testInfo.retry + 1} / Retries configured: ${testInfo.retries}`);

    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill("student");
    await page.getByRole("textbox", { name: "Password" }).fill("Password123");
    await page.getByRole("button",  { name: "Submit" }).click();
    await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
  });
});

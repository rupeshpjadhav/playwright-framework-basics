// Parallel vs Serial Test Execution
//
// By default Playwright runs test FILES in parallel but tests WITHIN a file
// sequentially. This file demonstrates how to control execution order at
// the describe-block level using test.describe.serial() and
// test.describe.configure().
//
// ─────────────────────────────────────────────────────────────
// DEFAULT BEHAVIOUR (no modifier)
//   - Files run in parallel across workers
//   - Tests WITHIN a describe block run sequentially
//   - Tests are isolated — each gets a fresh browser context
//
// test.describe.serial()
//   - Tests run strictly one after another IN ORDER
//   - If one test fails, ALL remaining tests in the block are SKIPPED
//   - Use when tests have a dependency chain (step 1 must pass for step 2)
//
// test.describe.configure({ mode: "parallel" })
//   - Tests within the describe block run IN PARALLEL
//   - Each test gets its own worker
//   - Faster, but tests must be fully independent (no shared state)
//
// test.describe.configure({ mode: "serial" })
//   - Same as test.describe.serial() but uses the newer API
//
// RUNNING THESE TESTS
//   npx playwright test tests/parallel-serial.spec.ts --project=chromium
//   npx playwright test tests/parallel-serial.spec.ts --project=chromium --workers=4

import { test, expect } from "@playwright/test";

const PRACTICE_URL = "https://testautomationpractice.blogspot.com/";
const LOGIN_URL     = "https://practicetestautomation.com/practice-test-login/";

// ─────────────────────────────────────────────────────────────
// BLOCK 1: Default — sequential within a describe block
//
// Tests run one after another. Each test is independent —
// a failure in test 1 does NOT skip test 2.
// ─────────────────────────────────────────────────────────────

test.describe("default: sequential independent tests", () => {
  test("default 1: verify login page title", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page).toHaveTitle("Test Login | Practice Test Automation");
  });

  test("default 2: verify practice page title", async ({ page }) => {
    await page.goto(PRACTICE_URL);
    await expect(page).toHaveTitle(/Automation/i);
  });

  test("default 3: verify alert button exists", async ({ page }) => {
    await page.goto(PRACTICE_URL);
    await expect(page.locator("#alertBtn")).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// BLOCK 2: test.describe.serial() — strict ordered execution
//
// Tests run in the ORDER they are defined. If test 1 fails,
// tests 2 and 3 are SKIPPED automatically.
//
// Use when tests form a dependency chain:
//   Step 1: Set up state (e.g., log in)
//   Step 2: Perform action that requires logged-in state
//   Step 3: Verify result (only meaningful if step 2 ran)
//
// This is common in end-to-end flows where later steps
// depend on earlier steps completing successfully.
// ─────────────────────────────────────────────────────────────

test.describe.serial("serial: ordered dependent steps", () => {
  // Step 1: Navigate and verify page loads.
  // If this fails, there's no point running steps 2 and 3.
  test("serial step 1: navigate to login page", async ({ page }) => {
    await page.goto(LOGIN_URL);

    // Hard assertion — if the page doesn't load, stop the serial chain.
    await expect(page).toHaveTitle("Test Login | Practice Test Automation");
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  // Step 2: Fill the form. Only useful if step 1 (navigation) succeeded.
  test("serial step 2: fill login form", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill("student");
    await page.getByRole("textbox", { name: "Password" }).fill("Password123");

    // Verify fields have the correct values after filling.
    await expect(page.getByRole("textbox", { name: "Username" })).toHaveValue("student");
    await expect(page.getByRole("textbox", { name: "Password" })).toHaveValue("Password123");
  });

  // Step 3: Submit and verify success. Only useful if steps 1 and 2 ran.
  test("serial step 3: submit and verify success", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill("student");
    await page.getByRole("textbox", { name: "Password" }).fill("Password123");
    await page.getByRole("button",  { name: "Submit" }).click();
    await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// BLOCK 3: test.describe.configure({ mode: "parallel" })
//
// Tests within this describe block run IN PARALLEL, each on its
// own browser context and worker.
//
// Requirements: tests must be completely independent.
//   - No shared variables between tests
//   - No assumption about execution order
//   - Each test sets up its own state
//
// Use when you have many independent tests and want to speed up
// a specific group without enabling parallelism everywhere.
// ─────────────────────────────────────────────────────────────

test.describe("parallel block: independent tests running concurrently", () => {
  // Configure this describe block to run its tests in parallel.
  test.describe.configure({ mode: "parallel" });

  test("parallel 1: check login page loads", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  test("parallel 2: check practice page loads", async ({ page }) => {
    await page.goto(PRACTICE_URL);
    await expect(page.locator("#alertBtn")).toBeVisible();
  });

  test("parallel 3: check drag element exists", async ({ page }) => {
    await page.goto(PRACTICE_URL);
    await expect(page.locator("#draggable")).toBeVisible();
  });

  test("parallel 4: check confirm button exists", async ({ page }) => {
    await page.goto(PRACTICE_URL);
    await expect(page.locator("#confirmBtn")).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// KEY DIFFERENCES SUMMARY (in comments for reference)
//
//   Mode          | Order guaranteed | Skip on failure | Speed
//   ------------- | ---------------- | --------------- | -----
//   default       | Yes (sequential) | No              | Moderate
//   serial        | Yes (sequential) | Yes (skips)     | Same as default
//   parallel      | No               | No              | Fastest
// ─────────────────────────────────────────────────────────────

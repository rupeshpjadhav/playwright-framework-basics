// Parameterized Tests
//
// Parameterized testing means running the SAME test logic with DIFFERENT
// input data, generating one separate test case per data set.
//
// Instead of writing:
//   test("valid login",   async () => { ...hardcoded valid data... })
//   test("invalid user",  async () => { ...hardcoded invalid data... })
//   test("empty fields",  async () => { ...hardcoded empty data... })
//
// You define the data in one place and let a loop generate the tests:
//   for (const scenario of scenarios) {
//     test(scenario.name, async () => { ...same logic, different data... })
//   }
//
// BENEFITS
//   - Adding a new test case = adding one object to a data array, no code change.
//   - All variations are visible at a glance in the data array.
//   - Each generated test runs independently (can be re-run, retried separately).
//   - Test names are dynamic — they describe the specific scenario.
//
// NOTE: The loop runs at FILE PARSE TIME (before tests execute).
//       Playwright discovers and registers all test cases from the loop
//       before running any of them.
//
// RUNNING THESE TESTS
//   npx playwright test tests/login-parameterized.spec.ts
//   npx playwright test tests/login-parameterized.spec.ts --project=chromium

import { test, expect } from "@playwright/test";

const LOGIN_URL = "https://practicetestautomation.com/practice-test-login/";

// ─────────────────────────────────────────────────────────────
// APPROACH 1: Simple array of objects
//
// The most straightforward pattern. Define an array of scenario objects,
// loop over it with for...of, and call test() inside the loop.
//
// Each object defines everything the test needs:
//   - A descriptive name (used as the test title)
//   - Input data (username, password)
//   - Expected outcome (what to assert after submission)
// ─────────────────────────────────────────────────────────────

// STRUCTURING TEST DATA VIA INTERFACES
// LoginScenario defines the exact shape every scenario object must follow.
// `expectedStatus: "success" | "error"` is a union type — only those two
// string values are allowed. Writing "fail" or "pass" causes a compile-time error.
interface LoginScenario {
  name: string;
  username: string;
  password: string;
  expectedStatus: "success" | "error";
  expectedMessage: string;
}

// TYPE ASSIGNMENT & VALIDATION
// `: LoginScenario[]` binds this array to the interface contract.
// TypeScript now validates every object inside the array:
//   - A missing field (e.g. forgot `expectedMessage`) → compile error
//   - A wrong type (e.g. `expectedStatus: "fail"`) → compile error
//   - A typo in a field name (e.g. `usernme`) → compile error
// This catches data mistakes before any test runs, not during execution.
const loginScenarios: LoginScenario[] = [
  {
    name: "valid credentials",
    username: "student",
    password: "Password123",
    expectedStatus: "success",
    expectedMessage: "Logged In Successfully",
  },
  {
    name: "invalid username",
    username: "wronguser",
    password: "Password123",
    expectedStatus: "error",
    expectedMessage: "Your username is invalid!",
  },
  {
    name: "invalid password",
    username: "student",
    password: "wrongpassword",
    expectedStatus: "error",
    expectedMessage: "Your password is invalid!",
  },
  {
    name: "both fields invalid",
    username: "wronguser",
    password: "wrongpassword",
    expectedStatus: "error",
    expectedMessage: "Your username is invalid!",
  },
];

// The for...of loop registers one test() call per scenario.
// Result: 4 separate, independently runnable test cases.
for (const scenario of loginScenarios) {
  test(`parameterized login: ${scenario.name}`, async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill(scenario.username);
    await page.getByRole("textbox", { name: "Password" }).fill(scenario.password);
    await page.getByRole("button",  { name: "Submit"   }).click();

    if (scenario.expectedStatus === "success") {
      await expect(
        page.getByRole("heading", { name: scenario.expectedMessage })
      ).toBeVisible();
    } else {
      await expect(
        page.locator("#error").getByText(scenario.expectedMessage)
      ).toBeVisible();
    }
  });
}

// ─────────────────────────────────────────────────────────────
// APPROACH 2: test.describe + loop
//
// Wrapping parameterized tests in a describe block groups them
// together in the Playwright HTML report and Allure report.
// All "boundary test" cases appear under a single expandable group,
// making the report easier to navigate.
// ─────────────────────────────────────────────────────────────

const boundaryScenarios = [
  { label: "single char username",   username: "s",          password: "Password123" },
  { label: "very long username",     username: "a".repeat(255), password: "Password123" },
  { label: "username with spaces",   username: "stu dent",   password: "Password123" },
  { label: "username with symbols",  username: "stud@nt!",   password: "Password123" },
  { label: "empty username",         username: "",            password: "Password123" },
  { label: "empty password",         username: "student",    password: ""            },
];

test.describe("boundary: username and password edge cases", () => {
  for (const scenario of boundaryScenarios) {
    // Use template literal to make the test name descriptive.
    test(`boundary: ${scenario.label}`, async ({ page }) => {
      await page.goto(LOGIN_URL);

      if (scenario.username) {
        await page.getByRole("textbox", { name: "Username" }).fill(scenario.username);
      }
      if (scenario.password) {
        await page.getByRole("textbox", { name: "Password" }).fill(scenario.password);
      }

      await page.getByRole("button", { name: "Submit" }).click();

      // All boundary inputs are invalid — an error should always appear.
      // This verifies the app handles edge cases without crashing.
      await expect(page.locator("#error")).toBeVisible();
    });
  }
});

// ─────────────────────────────────────────────────────────────
// APPROACH 3: Nested parameterization
//
// Run every combination of two data sets.
// In this example: 2 usernames × 2 passwords = 4 test combinations.
//
// Useful for: testing all browser × device combinations,
// all user roles × features, or all locales × currencies.
// ─────────────────────────────────────────────────────────────

const usernames = ["student", "invaliduser"];
const passwords = ["Password123", "wrongpassword"];

test.describe("nested: all username and password combinations", () => {
  for (const username of usernames) {
    for (const password of passwords) {
      test(`nested: ${username} + ${password}`, async ({ page }) => {
        await page.goto(LOGIN_URL);
        await page.getByRole("textbox", { name: "Username" }).fill(username);
        await page.getByRole("textbox", { name: "Password" }).fill(password);
        await page.getByRole("button",  { name: "Submit"   }).click();

        // student + Password123 → success. All others → error.
        if (username === "student" && password === "Password123") {
          await expect(
            page.getByRole("heading", { name: "Logged In Successfully" })
          ).toBeVisible();
        } else {
          await expect(page.locator("#error")).toBeVisible();
        }
      });
    }
  }
});

// ─────────────────────────────────────────────────────────────
// APPROACH 4: Data table pattern
//
// When test data has many columns (a table), use a header array
// plus value rows to make the structure clear at a glance.
// Each row maps positionally to the header names.
//
// This mirrors how pytest's @pytest.mark.parametrize works
// with multiple arguments:
//   @pytest.mark.parametrize("username,password,expected", [
//     ("student", "Password123", "success"),
//     ("bad",     "Password123", "error"),
//   ])
// ─────────────────────────────────────────────────────────────

// Data table: each row is [username, password, expectedOutcome, expectedText]
const dataTable: [string, string, string, string][] = [
  ["student",     "Password123",  "success", "Logged In Successfully"],
  ["invaliduser", "Password123",  "error",   "Your username is invalid!"],
  ["student",     "badpassword",  "error",   "Your password is invalid!"],
];

test.describe("data-table: login scenarios", () => {
  for (const [username, password, outcome, expectedText] of dataTable) {
    test(`table: [${username}] [${password}] → ${outcome}`, async ({ page }) => {
      await page.goto(LOGIN_URL);
      await page.getByRole("textbox", { name: "Username" }).fill(username);
      await page.getByRole("textbox", { name: "Password" }).fill(password);
      await page.getByRole("button",  { name: "Submit"   }).click();

      if (outcome === "success") {
        await expect(
          page.getByRole("heading", { name: expectedText })
        ).toBeVisible();
      } else {
        await expect(
          page.locator("#error").getByText(expectedText)
        ).toBeVisible();
      }
    });
  }
});

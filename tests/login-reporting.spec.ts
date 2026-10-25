// Reporting Demo — Custom Reporter + Allure Reporter
//
// This file demonstrates how test structure, metadata, and attachments
// flow into Playwright's built-in reporters AND external reporters like Allure.
//
// ─────────────────────────────────────────────────────────────
// REPORTERS IN THIS PROJECT
// ─────────────────────────────────────────────────────────────
//
//   1. HTML Reporter (built-in)
//      Output : playwright-report/index.html
//      View   : npx playwright show-report
//      Config : reporter: [['html']]
//
//   2. Custom Reporter (this project)
//      File   : tests/reporters/customReporter.ts
//      Output : test-results/custom-report.json
//               test-results/custom-report.txt
//      Config : reporter: [['./tests/reporters/customReporter.ts']]
//
//   3. Allure Reporter
//      Output : allure-results/ (raw data files, one per test)
//      Config : reporter: [['allure-playwright']]
//      Generate report : npx allure generate allure-results --clean -o allure-report
//      Open report     : npx allure open allure-report
//      One command     : npx allure serve allure-results
//
// ─────────────────────────────────────────────────────────────
// REGISTERING ALL THREE IN playwright.config.ts
// ─────────────────────────────────────────────────────────────
//
//   reporter: [
//     ['html'],
//     ['./tests/reporters/customReporter.ts'],
//     ['allure-playwright', { detail: true, outputFolder: 'allure-results' }],
//   ],
//
// ─────────────────────────────────────────────────────────────
// ALLURE METADATA ANNOTATIONS
// ─────────────────────────────────────────────────────────────
//
// Allure enriches test reports with metadata about what each test covers.
// These annotations are imported from 'allure-js-commons' and called
// inside the test body (they are async functions).
//
//   label(name, value)    — arbitrary key-value label on the test
//   feature(name)         — the product feature being tested (e.g., "Authentication")
//   story(name)           — the user story (e.g., "Login with valid credentials")
//   severity(level)       — "blocker" | "critical" | "normal" | "minor" | "trivial"
//   description(text)     — human-readable description of the test's purpose
//   link(url, name, type) — attach a URL (e.g., Jira ticket, docs page)
//   attachment(name, content, type) — embed data in the report
//
// In the Allure HTML report you can then:
//   - Filter by severity to see only critical test failures
//   - Filter by feature/story to see the login feature coverage
//   - Click on a failed test to see its description, steps, and attachments

import { test, expect, TestInfo } from "@playwright/test";
import {
  label,
  feature,
  story,
  severity,
  description,
  link,
  attachment,
} from "allure-js-commons";
import { loadEnv, getEnvValue } from "./utils/envLoader";

const LOGIN_URL = "https://practicetestautomation.com/practice-test-login/";

test.beforeAll(() => {
  loadEnv();
});

// ─────────────────────────────────────────────────────────────
// TEST 1: Valid Login — Allure metadata + test.step()
//
// This test is annotated with full Allure metadata.
// Every annotation call enriches the entry in the Allure report:
//   - Feature panel groups tests by product area
//   - Story groups tests by user story
//   - Severity highlights critical failures in the dashboard
//   - Links connect the test to a ticket or documentation
// ─────────────────────────────────────────────────────────────

test("reporting: valid login — full allure metadata", async ({ page }, testInfo: TestInfo) => {
  // ── Allure annotations ───────────────────────────────────────
  // These calls register metadata visible in the Allure report sidebar.
  await feature("Authentication");
  await story("User logs in with valid credentials");
  await severity("critical");          // "blocker" | "critical" | "normal" | "minor" | "trivial"
  await description(
    "Verifies that a registered user can log in successfully using valid " +
    "username and password, and that the success heading is displayed."
  );
  await label("component", "LoginPage");
  await label("team", "QA");
  // Link to a hypothetical Jira ticket or test case
  await link("https://practicetestautomation.com", "Application under test", "tms");

  // ── Test steps (visible in BOTH Playwright HTML report and Allure) ───────
  await test.step("Navigate to login page", async () => {
    await page.goto(LOGIN_URL);
    await expect(page).toHaveTitle("Test Login | Practice Test Automation");
  });

  await test.step("Fill login form with valid credentials", async () => {
    await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
    await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
  });

  await test.step("Submit the form", async () => {
    await page.getByRole("button", { name: "Submit" }).click();
  });

  await test.step("Verify success heading is visible", async () => {
    await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
  });

  // ── Allure attachment — screenshot embedded in the report ────────────────
  // Capture a screenshot at the end of the test and attach it.
  // In the Allure report, clicking the test shows this screenshot inline.
  const screenshotBytes = await page.screenshot();
  await attachment("Login success screenshot", screenshotBytes, "image/png");

  // ── testInfo.attach() — same screenshot also in the Playwright HTML report
  await testInfo.attach("login-success.png", {
    body: screenshotBytes,
    contentType: "image/png",
  });
});

// ─────────────────────────────────────────────────────────────
// TEST 2: Invalid Username — severity minor, different story
// ─────────────────────────────────────────────────────────────

test("reporting: invalid username — error message shown", async ({ page }) => {
  await feature("Authentication");
  await story("User sees error on invalid username");
  await severity("normal");
  await description(
    "Verifies that entering an unrecognised username shows the " +
    "'Your username is invalid!' error message."
  );
  await label("component", "LoginPage");

  await test.step("Navigate to login page", async () => {
    await page.goto(LOGIN_URL);
  });

  await test.step("Submit form with invalid username", async () => {
    await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("INVALID_USERNAME"));
    await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
    await page.getByRole("button", { name: "Submit" }).click();
  });

  await test.step("Verify error message", async () => {
    await expect(page.locator("#error").getByText("Your username is invalid!")).toBeVisible();
  });

  const screenshotBytes = await page.screenshot();
  await attachment("Error message screenshot", screenshotBytes, "image/png");
});

// ─────────────────────────────────────────────────────────────
// TEST 3: Invalid Password — severity minor
// ─────────────────────────────────────────────────────────────

test("reporting: invalid password — error message shown", async ({ page }) => {
  await feature("Authentication");
  await story("User sees error on invalid password");
  await severity("normal");
  await description(
    "Verifies that entering the wrong password for a valid user shows " +
    "'Your password is invalid!' and does not log the user in."
  );
  await label("component", "LoginPage");

  await test.step("Navigate to login page", async () => {
    await page.goto(LOGIN_URL);
  });

  await test.step("Submit form with invalid password", async () => {
    await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
    await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("INVALID_PASSWORD"));
    await page.getByRole("button", { name: "Submit" }).click();
  });

  await test.step("Verify error message", async () => {
    await expect(page.locator("#error").getByText("Your password is invalid!")).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// TEST 4: Allure JSON attachment
//
// You can attach ANY content type — JSON, CSV, HTML, plain text.
// This test attaches the test data as JSON so it's visible in the report.
// ─────────────────────────────────────────────────────────────

test("reporting: attach test data as JSON to allure report", async ({ page }) => {
  await feature("Authentication");
  await story("Test data is visible in the report");
  await severity("trivial");
  await description(
    "Demonstrates attaching structured test data (JSON) to an Allure report entry. " +
    "The attachment appears in the report so reviewers can see exactly what data was used."
  );

  const testData = {
    url: LOGIN_URL,
    username: getEnvValue("VALID_USERNAME"),
    password: "***",          // never log real passwords — mask them
    timestamp: new Date().toISOString(),
    browser: "chromium",
  };

  // Attach the JSON data — visible in the Allure report attachments panel.
  await attachment(
    "test-data.json",
    JSON.stringify(testData, null, 2),
    "application/json"
  );

  await test.step("Run login with attached test data", async () => {
    await page.goto(testData.url);
    await page.getByRole("textbox", { name: "Username" }).fill(testData.username);
    await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
  });
});

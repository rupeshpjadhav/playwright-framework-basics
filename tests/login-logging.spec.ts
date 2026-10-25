// Logging Demo — Winston Logger + Playwright Built-in Logging Features
//
// This file demonstrates ALL logging mechanisms available in a Playwright framework:
//
//   1. Custom logger (winston)         — structured, leveled, multi-destination logging
//   2. test.step()                     — group actions into named steps in the HTML report
//   3. page.on("console")              — capture browser-side console.log/warn/error
//   4. page.on("pageerror")            — capture uncaught JavaScript errors in the browser
//   5. page.on("request/response")     — log every network request and response
//   6. testInfo.attach()               — attach custom data/logs to the HTML report
//   7. DEBUG env var                   — Playwright's own internal verbose logging
//
// ─────────────────────────────────────────────────────────────
// RUNNING WITH DIFFERENT LOG LEVELS
// ─────────────────────────────────────────────────────────────
//
//   Default (info and above):
//     npx playwright test tests/login-logging.spec.ts
//
//   Debug level (more detail):
//     LOG_LEVEL=debug npx playwright test tests/login-logging.spec.ts
//
//   Playwright internal logs (very verbose — shows browser protocol messages):
//     DEBUG=pw:api npx playwright test tests/login-logging.spec.ts
//     DEBUG=pw:browser npx playwright test tests/login-logging.spec.ts
//     DEBUG=pw:* npx playwright test tests/login-logging.spec.ts  (everything)
//
// ─────────────────────────────────────────────────────────────
// LOG OUTPUT LOCATIONS
// ─────────────────────────────────────────────────────────────
//
//   Terminal          → real-time during the test run (colorized)
//   logs/test-run.log → all messages from the run (plain text, persists)
//   logs/errors.log   → only error-level messages (quick failure scan)
//   HTML report       → test.step() structure + testInfo.attach() content

import { test, expect, TestInfo } from "@playwright/test";
import { logger } from "./utils/logger";
import { loadEnv, getEnvValue } from "./utils/envLoader";

const LOGIN_URL = "https://practicetestautomation.com/practice-test-login/";

test.beforeAll(() => {
  loadEnv();

  // Log the test session start with key configuration details.
  // This is the first thing written to logs/test-run.log.
  logger.info("═══════════════════════════════════════════════");
  logger.info("Test session started");
  logger.info(`Target URL : ${process.env.APP_URL}`);
  logger.info(`Log level  : ${process.env.LOG_LEVEL || "info (default)"}`);
  logger.info("═══════════════════════════════════════════════");
});

test.afterAll(() => {
  // Log the session end. Useful for measuring suite duration in the log file.
  logger.info("Test session completed");
  logger.info("═══════════════════════════════════════════════");
});

// ─────────────────────────────────────────────────────────────
// TEST 1: Custom Logger (winston)
//
// Demonstrates all log levels and how they appear in terminal
// and in the log files under /logs/.
// ─────────────────────────────────────────────────────────────

test("logging: winston logger levels demo", async ({ page }) => {
  logger.info("--- Test started: winston logger levels demo ---");

  // error — something went wrong (we simulate it here; normally thrown by catch blocks)
  logger.error("DEMO error: this is what an error log looks like");

  // warn — unexpected but non-fatal (e.g., slow response, deprecated feature)
  logger.warn("DEMO warn: response took longer than expected");

  // info — normal test flow events (most common level in test automation)
  logger.info("Navigating to login page");
  await page.goto(LOGIN_URL);
  logger.info("Navigation complete");

  // debug — detailed intermediate values (run with LOG_LEVEL=debug to see these)
  const title = await page.title();
  logger.debug(`Page title resolved to: "${title}"`);

  // verbose — fine-grained tracing (run with LOG_LEVEL=verbose to see these)
  logger.verbose("About to fill username field");

  await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
  logger.verbose("Username field filled");

  await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
  logger.verbose("Password field filled");

  logger.info("Submitting login form");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
  logger.info("Login verified — success heading visible");
  logger.info("--- Test completed: winston logger levels demo ---");
});

// ─────────────────────────────────────────────────────────────
// TEST 2: test.step()
//
// test.step() groups a block of actions under a named step.
// Steps appear as a collapsible tree in the Playwright HTML report,
// making it easy to see WHERE in the test a failure occurred.
//
// This is Playwright's own built-in structured logging — no extra library needed.
// ─────────────────────────────────────────────────────────────

test("logging: test.step() structured steps", async ({ page }) => {
  logger.info("--- Test started: test.step() structured steps ---");

  // Step 1: Navigation — groups the goto action under a labelled step.
  // In the HTML report, you will see "Step 1: Navigate to login page" as a node.
  await test.step("Step 1: Navigate to login page", async () => {
    logger.info("[step] Navigating to login page");
    await page.goto(LOGIN_URL);
    await expect(page).toHaveTitle("Test Login | Practice Test Automation");
    logger.info("[step] Page loaded and title verified");
  });

  // Step 2: Fill form — all fill actions are grouped under one step.
  await test.step("Step 2: Fill login form", async () => {
    logger.info("[step] Filling username");
    await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));

    logger.info("[step] Filling password");
    await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
  });

  // Step 3: Submit — isolated so any click failure is pinpointed here.
  await test.step("Step 3: Submit form", async () => {
    logger.info("[step] Clicking submit button");
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // Step 4: Verify — assertion is its own step for clear pass/fail reporting.
  await test.step("Step 4: Verify login success", async () => {
    logger.info("[step] Asserting success heading is visible");
    await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
    logger.info("[step] Assertion passed");
  });

  logger.info("--- Test completed: test.step() structured steps ---");
});

// ─────────────────────────────────────────────────────────────
// TEST 3: Browser Console Capture — page.on("console")
//
// The browser (Chrome/Firefox/WebKit) has its own developer console.
// JavaScript running inside the page can call console.log(), console.warn(),
// console.error(), etc. Normally these are invisible to your test code.
//
// page.on("console") lets you listen to every browser console message
// and log it via winston so it appears in your test output and log files.
// ─────────────────────────────────────────────────────────────

test("logging: capture browser console messages", async ({ page }) => {
  logger.info("--- Test started: browser console capture ---");

  // Register the listener BEFORE navigating, so you don't miss any messages.
  // The callback receives a ConsoleMessage object with type(), text(), and location().
  page.on("console", (msg) => {
    const type = msg.type();   // "log", "warn", "error", "info", "debug"
    const text = msg.text();   // the actual message text

    // Map browser console types to winston log levels.
    if (type === "error") {
      logger.error(`[browser console] ${text}`);
    } else if (type === "warning" || type === "warn") {
      logger.warn(`[browser console] ${text}`);
    } else {
      logger.debug(`[browser console] ${type}: ${text}`);
    }
  });

  logger.info("Browser console listener registered");
  await page.goto(LOGIN_URL);
  logger.info("Page loaded — any browser console output will appear above");

  await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
  await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
  logger.info("--- Test completed: browser console capture ---");
});

// ─────────────────────────────────────────────────────────────
// TEST 4: Browser Page Errors — page.on("pageerror")
//
// A "page error" is an uncaught JavaScript exception thrown inside the browser.
// For example: a missing function, null reference error, or a failed import.
// These are different from console.error() — they are actual runtime crashes.
//
// page.on("pageerror") fires whenever such an exception occurs.
// Capturing these helps you detect silent browser-side failures that
// would otherwise be invisible to your test.
// ─────────────────────────────────────────────────────────────

test("logging: capture browser page errors", async ({ page }) => {
  logger.info("--- Test started: browser page error capture ---");

  // Collect page errors into an array so we can assert on them after the test.
  const pageErrors: string[] = [];

  page.on("pageerror", (error) => {
    // `error` is a standard JavaScript Error object from the browser.
    const message = `[page error] ${error.name}: ${error.message}`;
    logger.error(message);
    pageErrors.push(message);
  });

  logger.info("Page error listener registered");
  await page.goto(LOGIN_URL);

  await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
  await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();

  // Assert that no uncaught JavaScript errors occurred during the test.
  // If there were any, they will be listed in the failure message.
  if (pageErrors.length > 0) {
    logger.error(`${pageErrors.length} browser error(s) detected:`);
    pageErrors.forEach((e) => logger.error(`  ${e}`));
  } else {
    logger.info("No browser-side JavaScript errors detected");
  }
  expect(pageErrors, "No uncaught browser errors expected").toHaveLength(0);

  logger.info("--- Test completed: browser page error capture ---");
});

// ─────────────────────────────────────────────────────────────
// TEST 5: Network Request / Response Logging — page.on("request/response")
//
// Playwright can intercept every HTTP request the browser makes and every
// response it receives. This is useful for:
//   - Verifying the correct API endpoints are called during a user flow.
//   - Logging slow responses for performance investigation.
//   - Detecting unexpected 4xx/5xx status codes.
// ─────────────────────────────────────────────────────────────

test("logging: network request and response logging", async ({ page }) => {
  logger.info("--- Test started: network request/response logging ---");

  // page.on("request") fires for every outgoing HTTP request.
  page.on("request", (request) => {
    // Log only the method and URL — body/headers can be accessed if needed.
    logger.debug(`[network →] ${request.method()} ${request.url()}`);
  });

  // page.on("response") fires when each response arrives.
  page.on("response", (response) => {
    const status = response.status();
    const url    = response.url();

    // Warn on 4xx/5xx — these indicate client or server errors.
    if (status >= 400) {
      logger.warn(`[network ←] ${status} ${url}`);
    } else {
      logger.debug(`[network ←] ${status} ${url}`);
    }
  });

  logger.info("Network listeners registered — all requests/responses will be logged at debug level");
  logger.info("Run with LOG_LEVEL=debug to see the full network log");

  await page.goto(LOGIN_URL);
  logger.info("Page loaded — check debug output for network activity");

  await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
  await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();

  logger.info("--- Test completed: network request/response logging ---");
});

// ─────────────────────────────────────────────────────────────
// TEST 6: Attaching Logs to the HTML Report — testInfo.attach()
//
// testInfo is Playwright's metadata object for the current test.
// testInfo.attach() lets you embed custom content directly into the
// HTML report alongside screenshots and traces.
//
// Useful for attaching:
//   - A summary of what the test logged
//   - API response bodies
//   - Custom JSON state
// ─────────────────────────────────────────────────────────────

test("logging: attach log summary to HTML report", async ({ page }, testInfo: TestInfo) => {
  logger.info("--- Test started: attach log summary to report ---");

  // Build an in-memory log for this test that we will attach to the report.
  const testLog: string[] = [];

  const log = (level: string, message: string) => {
    const entry = `[${new Date().toISOString()}] ${level}: ${message}`;
    testLog.push(entry);
    logger.info(message);    // also send to winston for file output
  };

  log("INFO", "Navigating to login page");
  await page.goto(LOGIN_URL);

  log("INFO", `Page title: ${await page.title()}`);

  log("INFO", "Filling login form");
  await page.getByRole("textbox", { name: "Username" }).fill(getEnvValue("VALID_USERNAME"));
  await page.getByRole("textbox", { name: "Password" }).fill(getEnvValue("VALID_PASSWORD"));
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
  log("INFO", "Login verified — success heading visible");

  // Attach the collected log as a plain text file inside the HTML report.
  // Open the report (npx playwright show-report) and click this test
  // to see the "test-execution-log.txt" attachment in the details panel.
  await testInfo.attach("test-execution-log.txt", {
    body: testLog.join("\n"),
    contentType: "text/plain",
  });

  logger.info(`Log attached to report: ${testLog.length} entries`);
  logger.info("--- Test completed: attach log summary to report ---");
});

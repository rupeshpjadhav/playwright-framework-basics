// Custom Fixtures Demo — test.extend()
//
// This test file uses a CUSTOM FIXTURE instead of creating page objects manually.
//
// Without custom fixtures (old way):
//   test("login", async ({ page }) => {
//     const loginPage = new LoginPage(page);  // repeated in every test
//     ...
//   });
//
// With custom fixtures (this file):
//   test("login", async ({ loginPage }) => {
//     // loginPage is already created and injected — no manual setup!
//     ...
//   });
//
// The fixture is defined in tests/fixtures/loginFixture.ts using test.extend().
// We import `test` and `expect` from our fixture file instead of @playwright/test.

import { test, expect } from "./fixtures/loginFixture";
import { loadEnv, getEnvValue } from "./utils/envLoader";

// Load environment variables before all tests.
test.beforeAll(() => {
  loadEnv();
});

// Notice: we destructure { loginPage } directly — the fixture creates it for us.
// No need for `const loginPage = new LoginPage(page)` in each test.
test("fixture-based valid login test", async ({ loginPage }) => {
  const appUrl = getEnvValue("APP_URL");
  const validUsername = getEnvValue("VALID_USERNAME");
  const validPassword = getEnvValue("VALID_PASSWORD");

  await loginPage.navigateTo(appUrl);
  await loginPage.login(validUsername, validPassword);

  // Verify login succeeded using the page object method.
  await loginPage.verifyLoginSuccess();
});

test("fixture-based invalid username test", async ({ loginPage }) => {
  const appUrl = getEnvValue("APP_URL");
  const invalidUsername = getEnvValue("INVALID_USERNAME");
  const validPassword = getEnvValue("VALID_PASSWORD");

  await loginPage.navigateTo(appUrl);
  await loginPage.login(invalidUsername, validPassword);

  await loginPage.verifyErrorMessage("Your username is invalid!");
});

test("fixture-based invalid password test", async ({ loginPage }) => {
  const appUrl = getEnvValue("APP_URL");
  const validUsername = getEnvValue("VALID_USERNAME");
  const invalidPassword = getEnvValue("INVALID_PASSWORD");

  await loginPage.navigateTo(appUrl);
  await loginPage.login(validUsername, invalidPassword);

  await loginPage.verifyErrorMessage("Your password is invalid!");
});

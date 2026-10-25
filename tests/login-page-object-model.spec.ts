import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { loadEnv, getEnvValue } from "./utils/envLoader";

// Load environment variables before any tests run.
// This ensures APP_URL, VALID_USERNAME, VALID_PASSWORD, and invalid credentials are available.
test.beforeAll(() => {
  loadEnv();
});

test("POM valid login test", async ({ page }) => {
  // Create a page object for the login page.
  const loginPage = new LoginPage(page);

  // Read test data from environment variables.
  const appUrl = getEnvValue("APP_URL");
  const validUsername = getEnvValue("VALID_USERNAME");
  const validPassword = getEnvValue("VALID_PASSWORD");

  // Perform the login flow using the page object.
  await loginPage.navigateTo(appUrl);
  await loginPage.login(validUsername, validPassword);

  // Verify login success through the page object method.
  await loginPage.verifyLoginSuccess();
});

test("POM invalid username test", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const appUrl = getEnvValue("APP_URL");
  const invalidUsername = getEnvValue("INVALID_USERNAME");
  const validPassword = getEnvValue("VALID_PASSWORD");

  await loginPage.navigateTo(appUrl);
  await loginPage.login(invalidUsername, validPassword);

  // Check the error message after invalid username login.
  await loginPage.verifyErrorMessage("Your username is invalid!");
});

test("POM invalid password test", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const appUrl = getEnvValue("APP_URL");
  const validUsername = getEnvValue("VALID_USERNAME");
  const invalidPassword = getEnvValue("INVALID_PASSWORD");

  await loginPage.navigateTo(appUrl);
  await loginPage.login(validUsername, invalidPassword);

  // Check the error message after invalid password login.
  await loginPage.verifyErrorMessage("Your password is invalid!");
});

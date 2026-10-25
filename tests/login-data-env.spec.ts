import { test, expect } from "@playwright/test";
import { loadEnv, getEnvValue } from "./utils/envLoader";

// Load environment variables before tests run.
// This ensures the .env values are available in every test.
test.beforeAll(() => {
  loadEnv();
});

test("env-based valid login test", async ({ page }) => {
  const appUrl = getEnvValue("APP_URL");
  const validUsername = getEnvValue("VALID_USERNAME");
  const validPassword = getEnvValue("VALID_PASSWORD");

  await page.goto(appUrl);
  await page.getByRole("textbox", { name: "Username" }).fill(validUsername);
  await page.getByRole("textbox", { name: "Password" }).fill(validPassword);
  await page.getByRole("button", { name: "Submit" }).click();

  // Assert the page shows the successful login heading.
  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
});

test("env-based invalid username test", async ({ page }) => {
  const appUrl = getEnvValue("APP_URL");
  const invalidUsername = getEnvValue("INVALID_USERNAME");
  const validPassword = getEnvValue("VALID_PASSWORD");

  await page.goto(appUrl);
  await page.getByRole("textbox", { name: "Username" }).fill(invalidUsername);
  await page.getByRole("textbox", { name: "Password" }).fill(validPassword);
  await page.getByRole("button", { name: "Submit" }).click();

  // Verify error shown for invalid username.
  await expect(page.locator("#error").getByText("Your username is invalid!"))
    .toBeVisible();
});

test("env-based invalid password test", async ({ page }) => {
  const appUrl = getEnvValue("APP_URL");
  const validUsername = getEnvValue("VALID_USERNAME");
  const invalidPassword = getEnvValue("INVALID_PASSWORD");

  await page.goto(appUrl);
  await page.getByRole("textbox", { name: "Username" }).fill(validUsername);
  await page.getByRole("textbox", { name: "Password" }).fill(invalidPassword);
  await page.getByRole("button", { name: "Submit" }).click();

  // Verify error shown for invalid password.
  await expect(page.locator("#error").getByText("Your password is invalid!"))
    .toBeVisible();
});

import { test, expect } from "@playwright/test";
import * as path from "path";
import { readProperties } from "./utils/propertyReader";

// Data-driven test that reads login scenarios from a properties file.
// This keeps test data separate from test logic.

test("data driven valid login test", async ({ page }) => {
  const propertiesPath = path.resolve(process.cwd(), "tests", "data", "login-data.properties");
  const config = readProperties(propertiesPath);

  await page.goto(config.url);

  // Use values from the properties file to fill the login form.
  await page.getByRole("textbox", { name: "Username" }).fill(config["valid.username"]);
  await page.getByRole("textbox", { name: "Password" }).fill(config["valid.password"]);
  await page.getByRole("button", { name: "Submit" }).click();

  // Assert that the success message text is visible.
  await expect(page.getByRole("heading", { name: config["valid.expectedMessage"] })).toBeVisible();
});

test("data driven invalid username test", async ({ page }) => {
  const propertiesPath = path.resolve(process.cwd(), "tests", "data", "login-data.properties");
  const config = readProperties(propertiesPath);

  await page.goto(config.url);

  await page.getByRole("textbox", { name: "Username" }).fill(config["invalid.username"]);
  await page.getByRole("textbox", { name: "Password" }).fill(config["valid.password"]);
  await page.getByRole("button", { name: "Submit" }).click();

  // Assert the invalid username error message is shown.
  await expect(page.locator("#error").getByText(config["invalid.expectedMessage"]))
    .toBeVisible();
});

test("data driven invalid password test", async ({ page }) => {
  const propertiesPath = path.resolve(process.cwd(), "tests", "data", "login-data.properties");
  const config = readProperties(propertiesPath);

  await page.goto(config.url);

  await page.getByRole("textbox", { name: "Username" }).fill(config["valid.username"]);
  await page.getByRole("textbox", { name: "Password" }).fill(config["invalid.password"]);
  await page.getByRole("button", { name: "Submit" }).click();

  // Assert the invalid password error message is shown.
  await expect(page.locator("#error").getByText("Your password is invalid!"))
    .toBeVisible();
});

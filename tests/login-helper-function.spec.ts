import { test, expect } from "@playwright/test";
import * as path from "path";
import { readProperties } from "./utils/propertyReader";

// Reusable helper function for the login flow.
// This keeps login logic centralized and the tests focused on assertions.
async function login(page: any, config: Record<string, string>) {
  await page.goto(config.url);
  await page.getByRole("textbox", { name: "Username" }).fill(config.username);
  await page.getByRole("textbox", { name: "Password" }).fill(config.password);
  await page.getByRole("button", { name: "Submit" }).click();
}

test("helper-based valid login test", async ({ page }) => {
  const propertiesPath = path.resolve(process.cwd(), "tests", "data", "login-data.properties");
  const config = readProperties(propertiesPath);

  await login(page, {
    url: config.url,
    username: config["valid.username"],
    password: config["valid.password"],
  });

  // Verify the successful login heading is visible after submitting valid credentials.
  await expect(page.getByRole("heading", { name: config["valid.expectedMessage"] })).toBeVisible();
});

test("helper-based invalid login test", async ({ page }) => {
  const propertiesPath = path.resolve(process.cwd(), "tests", "data", "login-data.properties");
  const config = readProperties(propertiesPath);

  await login(page, {
    url: config.url,
    username: config["invalid.username"],
    password: config["valid.password"],
  });

  // Verify the invalid username error message is displayed.
  await expect(page.locator("#error").getByText(config["invalid.expectedMessage"]))
    .toBeVisible();
});

// JSON Test Data Reader Demo
//
// This test reads login credentials from a JSON file instead of .properties or .env.
// JSON supports nested objects and arrays, making it ideal for structured test data.
//
// Data file: tests/data/login-data.json
// Utility:   tests/utils/jsonReader.ts — generic readJson<T>() function
//
// JSON vs .properties:
//   - JSON supports nested structures: { "valid": { "username": "..." } }
//   - .properties is flat: valid.username=...
//   - JSON is natively supported in JavaScript/TypeScript (no custom parser needed)
//   - .properties needs a custom reader utility

import { test, expect } from "@playwright/test";
import * as path from "path";
import { readJson } from "./utils/jsonReader";

// Define a TypeScript interface matching the JSON file structure.
// This gives us type safety and auto-complete when accessing data.
interface LoginData {
  url: string;
  valid: {
    username: string;
    password: string;
    expectedMessage: string;
  };
  invalid: {
    username: string;
    password: string;
    expectedUsernameError: string;
    expectedPasswordError: string;
  };
}

// Read the JSON file once and use it across all tests.
const dataPath = path.resolve(process.cwd(), "tests", "data", "login-data.json");
const data = readJson<LoginData>(dataPath);

test("json-based valid login test", async ({ page }) => {
  await page.goto(data.url);
  await page.getByRole("textbox", { name: "Username" }).fill(data.valid.username);
  await page.getByRole("textbox", { name: "Password" }).fill(data.valid.password);
  await page.getByRole("button", { name: "Submit" }).click();

  // Assert using the expected message from JSON data.
  await expect(page.getByRole("heading", { name: data.valid.expectedMessage })).toBeVisible();
});

test("json-based invalid username test", async ({ page }) => {
  await page.goto(data.url);
  await page.getByRole("textbox", { name: "Username" }).fill(data.invalid.username);
  await page.getByRole("textbox", { name: "Password" }).fill(data.valid.password);
  await page.getByRole("button", { name: "Submit" }).click();

  // Assert the error message from JSON data.
  await expect(page.locator("#error").getByText(data.invalid.expectedUsernameError)).toBeVisible();
});

test("json-based invalid password test", async ({ page }) => {
  await page.goto(data.url);
  await page.getByRole("textbox", { name: "Username" }).fill(data.valid.username);
  await page.getByRole("textbox", { name: "Password" }).fill(data.invalid.password);
  await page.getByRole("button", { name: "Submit" }).click();

  // Assert the error message from JSON data.
  await expect(page.locator("#error").getByText(data.invalid.expectedPasswordError)).toBeVisible();
});

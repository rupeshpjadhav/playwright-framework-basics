// Test Data Factory Demo — @faker-js/faker
//
// This test uses the faker library to generate RANDOM test data on each run.
// Unlike hardcoded or file-based data, faker creates unique values every time.
//
// Benefits:
//   - Tests different input variations on each run (catches edge cases)
//   - No need to maintain static test data files for negative scenarios
//   - Generates realistic data: names, emails, passwords, addresses, phone numbers
//
// Utility: tests/utils/testDataFactory.ts
//   - generateUserData()      → { firstName, lastName, username, email, password, phone }
//   - generateAddressData()   → { street, city, state, zipCode, country }
//   - generateRandomString(n) → random alphanumeric string of length n
//   - generateRandomNumber(min, max) → random integer in range

import { test, expect } from "@playwright/test";

// EXPORTING DATA MODULES — consumer side
// Named imports pull exactly what this file needs from the data module.
// testDataFactory.ts owns the UserData interface and data-generation logic;
// this test file just uses the results without knowing how they are generated.
// TypeScript also carries the UserData interface type through the import, so
// `fakeUser.username` gets autocomplete and type-checking here automatically.
import {
  generateUserData,
  generateRandomString,
} from "./utils/testDataFactory";

const LOGIN_URL = "https://practicetestautomation.com/practice-test-login/";

test("faker-based invalid login — random username", async ({ page }) => {
  // Generate a random user — the username will be different every time this test runs.
  const fakeUser = generateUserData();

  console.log(`[Faker] Testing with random username: ${fakeUser.username}`);

  await page.goto(LOGIN_URL);
  await page.getByRole("textbox", { name: "Username" }).fill(fakeUser.username);
  await page.getByRole("textbox", { name: "Password" }).fill("Password123");
  await page.getByRole("button", { name: "Submit" }).click();

  // Random usernames should always fail — verifies the app rejects unknown users.
  await expect(page.locator("#error").getByText("Your username is invalid!")).toBeVisible();
});

test("faker-based invalid login — random password", async ({ page }) => {
  // Use valid username but a randomly generated password.
  const fakeUser = generateUserData();

  console.log(`[Faker] Testing with random password: ${fakeUser.password}`);

  await page.goto(LOGIN_URL);
  await page.getByRole("textbox", { name: "Username" }).fill("student");
  await page.getByRole("textbox", { name: "Password" }).fill(fakeUser.password);
  await page.getByRole("button", { name: "Submit" }).click();

  // Random passwords should always fail — verifies the app rejects wrong passwords.
  await expect(page.locator("#error").getByText("Your password is invalid!")).toBeVisible();
});

test("faker-based invalid login — random string boundary test", async ({ page }) => {
  // Test with a very long random string to check input boundary handling.
  const longUsername = generateRandomString(100);
  const longPassword = generateRandomString(100);

  console.log(`[Faker] Testing with ${longUsername.length}-char random strings`);

  await page.goto(LOGIN_URL);
  await page.getByRole("textbox", { name: "Username" }).fill(longUsername);
  await page.getByRole("textbox", { name: "Password" }).fill(longPassword);
  await page.getByRole("button", { name: "Submit" }).click();

  // Long random strings should be rejected — verifies app handles edge cases.
  await expect(page.locator("#error")).toBeVisible();
});

test("faker-based demo — log generated data", async () => {
  // This test demonstrates the variety of data faker can generate.
  // Useful to understand what's available for your test scenarios.
  const user = generateUserData();

  console.log("[Faker] Generated User Data:");
  console.log(`  First Name: ${user.firstName}`);
  console.log(`  Last Name:  ${user.lastName}`);
  console.log(`  Username:   ${user.username}`);
  console.log(`  Email:      ${user.email}`);
  console.log(`  Password:   ${user.password}`);
  console.log(`  Phone:      ${user.phone}`);

  // Verify all fields are non-empty strings.
  expect(user.firstName).toBeTruthy();
  expect(user.lastName).toBeTruthy();
  expect(user.username).toBeTruthy();
  expect(user.email).toContain("@");
  expect(user.password.length).toBeGreaterThanOrEqual(12);
  expect(user.phone).toBeTruthy();
});

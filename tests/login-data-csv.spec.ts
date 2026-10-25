// CSV Test Data Reader Demo
//
// This test reads login scenarios from a CSV file — one row per test case.
// CSV is useful when test data is managed in spreadsheets (Excel, Google Sheets).
//
// Data file: tests/data/login-data.csv
// Utility:   tests/utils/csvReader.ts
//
// CSV format:
//   username,password,expectedResult,expectedMessage
//   student,Password123,success,Logged In Successfully
//   invaliduser,Password123,error,Your username is invalid!
//
// Each row becomes a Record<string, string> object:
//   { username: "student", password: "Password123", expectedResult: "success", expectedMessage: "..." }

import { test, expect } from "@playwright/test";
import * as path from "path";
import { readCsv } from "./utils/csvReader";

const LOGIN_URL = "https://practicetestautomation.com/practice-test-login/";

// Read all rows from the CSV file.
const csvPath = path.resolve(process.cwd(), "tests", "data", "login-data.csv");
const testRows = readCsv(csvPath);

// Loop through each CSV row and create a separate test for each.
// This is a form of PARAMETERIZED TESTING — one data file drives multiple tests.
for (const row of testRows) {
  test(`csv-based login: ${row.username} / ${row.expectedResult}`, async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.getByRole("textbox", { name: "Username" }).fill(row.username);
    await page.getByRole("textbox", { name: "Password" }).fill(row.password);
    await page.getByRole("button", { name: "Submit" }).click();

    if (row.expectedResult === "success") {
      // For success rows, verify the success heading is visible.
      await expect(
        page.getByRole("heading", { name: row.expectedMessage })
      ).toBeVisible();
    } else {
      // For error rows, verify the error message is displayed.
      await expect(
        page.locator("#error").getByText(row.expectedMessage)
      ).toBeVisible();
    }
  });
}

// Custom Fixture using test.extend()
//
// Playwright fixtures are objects created for each test run.
// `test.extend()` lets you define your own fixtures on top of the built-in ones.
// This avoids repeating setup code (like creating page objects) in every test.
//
// How it works:
// 1. We import the base `test` and `expect` from Playwright.
// 2. We call `test.extend<{ loginPage: LoginPage }>()` to declare a new fixture named `loginPage`.
// 3. Inside the fixture definition, we create the LoginPage instance and pass it to the test via `use()`.
// 4. Any test that imports this custom `test` can destructure `{ loginPage }` directly — no manual setup needed.

import { test as base, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

// Define a custom type for our extended fixtures.
// This tells TypeScript that `loginPage` is of type `LoginPage`.
type LoginFixtures = {
  loginPage: LoginPage;
};

// Extend the base test with our custom fixture.
// The fixture function receives `{ page }` (the built-in page fixture) and `use` (to pass the fixture value to the test).
export const test = base.extend<LoginFixtures>({
  loginPage: async ({ page }, use) => {
    // Create the LoginPage instance using the built-in page fixture.
    const loginPage = new LoginPage(page);

    // `use()` hands the loginPage to the test.
    // Code before `use()` runs as SETUP, code after runs as TEARDOWN.
    await use(loginPage);

    // Teardown: any cleanup after the test finishes would go here.
    // Example: await page.close();
  },
});

// Re-export expect so tests only need one import.
export { expect };

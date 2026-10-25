// Import the Playwright Test helpers.
// `test` defines test cases and `expect` is the assertion library.
const { test, expect } = require('@playwright/test');

// Each `test()` call creates a separate test.
// The first argument is the test name, the second is an async callback.

test('has title', async ({ page }) => {
  // `async` allows us to use `await` inside the test body.
  // `page` is a Playwright fixture representing a browser tab.

  // Navigate to the target URL.
  await page.goto('https://playwright.dev/');

  // `expect(page).toHaveTitle()` asserts the page title.
  // The assertion is async, so we `await` it.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  // Load the page that contains the UI under test.
  await page.goto('https://playwright.dev/');

  // Find a link by ARIA role and visible name, then click it.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Verify the expected heading appears after clicking.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();

  // `toBeVisible()` waits until the element is visible before passing.
});

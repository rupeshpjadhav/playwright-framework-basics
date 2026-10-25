import { test, expect } from '@playwright/test';

// `test` is the Playwright Test function used to define a test case.
// Each call to `test()` creates one independent test.
// The first argument is the test name, and the second argument is an async function.

// `expect` is the assertion library provided by Playwright Test.
// It is used to verify application behavior, such as page titles, visibility,
// text content, and many other browser state conditions.

test('has title', async ({ page }) => {
  // `async` marks the function as asynchronous.
  // It allows us to use `await` inside the test body.
  // This makes it easier to write sequential browser actions and assertions.

  // The `page` fixture is injected by Playwright Test.
  // It represents a single browser tab or page context.
  // Fixtures like `page` are created automatically for each test run.

  // Navigate the browser page to the target URL.
  // `page.goto()` returns a promise that resolves after navigation finishes.
  await page.goto('https://playwright.dev/');

  // `await` waits for the promise returned by `expect(...).toHaveTitle()`.
  // Without `await`, the test may finish before the check completes.
  // `expect(page)` is a Playwright locator-based assertion.
  // `toHaveTitle()` verifies the current page title.
  // It accepts a string, RegExp, or exact title text.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  // Start by loading the page to test with.
  await page.goto('https://playwright.dev/');

  // `page.getByRole()` is a selector helper that finds elements by ARIA role.
  // This is accessible and stable compared to brittle CSS selectors.
  // It returns a locator object for the link with the visible name "Get started".
  await page.getByRole('link', { name: 'Get started' }).click();

  // After navigation, verify the page contains the expected heading.
  // `page.getByRole('heading', { name: 'Installation' })` locates a heading element.
  // `toBeVisible()` waits until that element is visible in the DOM.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();

  // Note: `expect` assertions in Playwright are typically auto-waiting.
  // This means Playwright retries the assertion for a short time until it passes or times out.
});

/**
 * TUTORIAL 1 — THE STANDARD WAY (Playwright Test Runner)
 * =========================================================
 * This is how ~95% of real-world Playwright test suites are written.
 * You use the `@playwright/test` package, which is a full TEST RUNNER
 * (like Jest/Mocha) built on top of the lower-level Playwright Library.
 *
 * It gives you, for free:
 *   - test isolation (new browser context per test)
 *   - fixtures (page, context, browser handed to you — you never create them)
 *   - parallel execution across files/workers
 *   - auto-retries, tracing, screenshots/video on failure
 *   - built-in assertions with auto-waiting/auto-retrying (`expect`)
 *   - HTML/Allure/custom reporters (see playwright.config.ts)
 *
 * HOW TO RUN THIS FILE:
 *   npx playwright test tutorials/01-standard-way.spec.ts
 *   npx playwright test tutorials/01-standard-way.spec.ts --headed   (see the browser)
 *   npx playwright test tutorials/01-standard-way.spec.ts --ui       (interactive mode)
 */

// `test`  -> the function used to declare a test case.
// `expect` -> Playwright's own assertion library (auto-waits/retries, unlike Node's assert).
import { test, expect } from '@playwright/test';

/**
 * `test.describe` groups related tests together (optional).
 * It shows up as a section header in the HTML report and lets you
 * scope hooks (beforeEach/afterEach) to just the tests inside it.
 */
test.describe('Playwright Test Runner — anatomy walkthrough', () => {
  /**
   * `test.beforeEach` runs before EVERY test in this describe block.
   * Common use: navigate to a starting page so every test begins from
   * the same known state. Receives the same fixtures as the test itself.
   */
  test.beforeEach(async ({ page }) => {
    await page.goto('https://playwright.dev/');
  });

  /**
   * `test(title, testFunction)` declares a single test case.
   *
   * The test function receives an object of FIXTURES as its only argument.
   * `{ page }` here uses object destructuring to pull out the `page` fixture.
   * You never write `new Page()` or `browser.launch()` yourself — the test
   * runner has already launched a Browser, opened a fresh isolated
   * BrowserContext, and created this Page before your test body runs.
   */
  test('homepage has the correct title', async ({ page }) => {
    // `page` is the tab. `.goto()` navigates it to a URL and waits for load.
    // (Redundant here because of beforeEach — shown for clarity/completeness.)
    await page.goto('https://playwright.dev/');

    // `expect(actual).matcher(expected)` — Playwright's web-first assertion.
    // Unlike a plain `assert`, `toHaveTitle` RETRIES for a few seconds until
    // it passes or times out — so you don't need manual waits for the title
    // to update after navigation.
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('can navigate to the docs page via a link click', async ({ page }) => {
    // LOCATE: `getByRole` finds elements the way a screen reader/user would —
    // by their accessible role + accessible name. This is the RECOMMENDED
    // way to locate elements (more resilient than CSS selectors).
    const getStartedLink = page.getByRole('link', { name: 'Get started' });

    // ACT: `.click()` — Playwright auto-waits for the element to be
    // visible, enabled, and stable (not animating) before clicking.
    // No manual `sleep()`/`waitFor()` needed for the common case.
    await getStartedLink.click();

    // ASSERT: confirms the click actually caused a navigation.
    // `toHaveURL` also retries, so it tolerates the brief moment
    // between click and the URL actually changing.
    await expect(page).toHaveURL(/.*intro/);
  });

  test('search box accepts input', async ({ page }) => {
    // Open the search dialog (Playwright's own docs site uses Algolia search).
    await page.getByRole('button', { name: 'Search' }).click();

    // `getByPlaceholder` locates an <input> by its placeholder text.
    const searchInput = page.getByPlaceholder('Search docs');

    // `.fill()` sets the input's value directly (clears it first).
    // Use `.pressSequentially()` instead if you need to simulate real
    // keystroke-by-keystroke typing (e.g. to trigger a JS keyup handler).
    await searchInput.fill('locators');

    // Assert the value actually landed in the input.
    await expect(searchInput).toHaveValue('locators');
  });

  /**
   * `test.afterEach` runs after EVERY test in this block, pass or fail.
   * Common use: extra logging/cleanup. The test runner already closes
   * the page/context/browser for you automatically — you rarely need
   * to do that manually here.
   */
  test.afterEach(async ({ page }, testInfo) => {
    // `testInfo` is a fixture describing the test that just ran
    // (title, status: 'passed'/'failed', duration, etc.).
    console.log(`Finished "${testInfo.title}" with status: ${testInfo.status}`);
  });
});

/**
 * KEY TAKEAWAY — THE STANDARD WAY:
 * You describe WHAT to test. The test runner handles the HOW:
 * launching browsers, creating isolated contexts/pages per test,
 * tearing them down, retrying assertions, and generating reports.
 * This is why almost every real framework (including the rest of this
 * repo's `tests/` folder) is built this way.
 */

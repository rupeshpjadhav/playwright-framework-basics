/**
 * TUTORIAL 2 — THE MANUAL WAY (Playwright Library API)
 * =========================================================
 * `@playwright/test` (tutorial 1) is actually a wrapper around the lower
 * level `playwright` LIBRARY. This file uses that library directly, with
 * NO test runner involved — just a plain Node.js script.
 *
 * You'd reach for this style for things that aren't "tests" at all:
 * web scraping scripts, one-off automation, PDF generation, or when
 * embedding browser automation inside your own app/CLI.
 *
 * The trade-off: YOU are now responsible for everything the test runner
 * used to do automatically — launching the browser, creating a context,
 * opening/closing pages, and closing the browser at the end. Nothing is
 * injected as a "fixture"; every object is created explicitly, line by line.
 *
 * HOW TO RUN THIS FILE (it's plain JS — no compiler/ts-node needed):
 *   node tutorials/02-manual-way.js
 */

// Import the raw Playwright library. `chromium` here is a "BrowserType"
// object — the launcher for the Chromium browser engine.
// (Swap for `firefox` or `webkit` to launch a different engine — same API.)
const { chromium } = require('playwright');

// IMPORTANT: `expect()` is a feature of the `@playwright/test` TEST RUNNER,
// not the underlying library — so it doesn't exist here. The raw library
// gives you data-fetching methods instead (e.g. `.title()`, `.url()`),
// and you assert on the results yourself. Node's built-in `assert` module
// is enough for that — no auto-retrying, just a plain one-shot check.
const assert = require('node:assert');

// Manual scripts have no built-in test structure, so we wrap our steps
// in a plain async function and run it ourselves at the bottom of the file.
async function main() {
  // ---------------------------------------------------------------------
  // STEP 1: Launch a Browser.
  // This actually starts a Chromium OS process. In the standard way, the
  // test runner does this once and reuses it across many tests for speed;
  // here, we control that lifecycle ourselves.
  // ---------------------------------------------------------------------
  const browser = await chromium.launch({
    headless: false, // show the browser window so you can watch it work
  });

  // ---------------------------------------------------------------------
  // STEP 2: Create a BrowserContext.
  // A context is like an incognito profile: its own cookies, localStorage,
  // cache — fully isolated from other contexts in the same browser process.
  // The test runner normally creates a fresh one per test automatically;
  // here we create exactly one, explicitly.
  // ---------------------------------------------------------------------
  const context = await browser.newContext();

  // ---------------------------------------------------------------------
  // STEP 3: Open a Page (tab) inside that context.
  // This is the same `page` object type you used in tutorial 1 — the API
  // for locating/acting/asserting is IDENTICAL either way. Only how the
  // page gets created differs.
  // ---------------------------------------------------------------------
  const page = await context.newPage();

  try {
    // LOCATE + ACT + ASSERT below use the exact same API as the standard way.
    // Everything you learned in tutorial 1 about `.getByRole()`, `.click()`,
    // `.fill()`, and `expect(...)` applies unchanged here.

    await page.goto('https://playwright.dev/');

    // No `expect(page).toHaveTitle()` here — that auto-retrying matcher
    // belongs to the test runner. Manually, you just read the current
    // value with `.title()` and check it yourself, once, right now.
    const title = await page.title();
    assert.match(title, /Playwright/);
    console.log('✔ Title assertion passed:', title);

    const getStartedLink = page.getByRole('link', { name: 'Get started' });
    await getStartedLink.click();

    // Same idea for the URL: `.url()` reads it right now — no retrying
    // while the navigation settles, so if the click and the check race,
    // this could read a stale URL. In practice `.click()`'s auto-waiting
    // plus the navigation being fast makes this fine for a demo script,
    // but it's a real gap the test runner's `expect(page).toHaveURL()`
    // exists to close.
    const url = page.url();
    assert.match(url, /.*intro/);
    console.log('✔ Navigation assertion passed:', url);

    // Take a manual screenshot — in the standard way, this happens
    // automatically on failure via config; here you must call it yourself.
    await page.screenshot({ path: 'tutorials/manual-way-result.png' });
    console.log('✔ Screenshot saved to tutorials/manual-way-result.png');
  } catch (error) {
    // No built-in retry/reporting here — if something throws, YOU catch it.
    console.error('✘ Script failed:', error);
  } finally {
    // ---------------------------------------------------------------------
    // STEP 4: Manual cleanup — CRITICAL in the manual way.
    // If you forget to close the browser, the OS process keeps running in
    // the background (a leak). The test runner does this for you
    // automatically after every single test; here it's your job, and only
    // needs to happen once since we're managing one browser for the whole
    // script rather than one per test.
    // ---------------------------------------------------------------------
    await context.close();
    await browser.close();
  }
}

// Nothing runs until we actually invoke the function — there's no test
// runner discovering and executing this file for us.
main();

/**
 * KEY TAKEAWAY — THE MANUAL WAY:
 * You are responsible for the full lifecycle: launch -> context -> page
 * -> ...your logic... -> close context -> close browser. The locate/act/
 * assert API is identical to the standard way — what changes is WHO
 * manages setup, teardown, isolation, and error handling: you, instead
 * of the test runner.
 */

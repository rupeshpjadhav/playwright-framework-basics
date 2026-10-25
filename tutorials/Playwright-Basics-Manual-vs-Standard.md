---
title: "Playwright Basics: The Manual Way vs. The Standard Way"
author: "Playwright Framework Basics — Tutorials"
date: "2026-08-31"
---

# Playwright Basics: The Manual Way vs. The Standard Way

This document walks through the two ways to drive a browser with Playwright — the low-level **Library API** ("the manual way") and the **Test Runner** ("the standard way") — line by line, then explains why every real framework ends up using the standard way, and how the two `example.spec` files already in this project fit in.

---

## 1. The Big Picture

Playwright ships as two layers:

| Layer | Package | What it gives you |
|---|---|---|
| **Library** | `playwright` | Raw browser automation primitives: launch a browser, open a context, open a page, act on it. Nothing else. |
| **Test Runner** | `@playwright/test` | Everything in the Library, **plus** test structure, fixtures, isolation, auto-retrying assertions, parallel workers, retries, and reporting — built *on top of* the Library. |

Every real Playwright test suite (including everything in this project's `tests/` folder) is written using the Test Runner. But understanding the Library underneath is what makes the Test Runner's design make sense — it isn't magic, it's the Library with the repetitive, error-prone parts automated away.

---

## 2. The Manual Way — Playwright Library API

**File:** `tutorials/02-manual-way.js`
**Run with:** `node tutorials/02-manual-way.js`

This is a plain Node.js script. There is no test runner discovering or executing it — you run it like any other script, and you are responsible for the entire lifecycle: launching the browser, creating an isolated session, opening a tab, acting on it, checking results, and cleaning up.

```js
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
  // -----------------------------------------------------------------
  // STEP 1: Launch a Browser.
  // This actually starts a Chromium OS process. In the standard way,
  // the test runner does this once and reuses it across many tests
  // for speed; here, we control that lifecycle ourselves.
  // -----------------------------------------------------------------
  const browser = await chromium.launch({
    headless: false, // show the browser window so you can watch it work
  });

  // -----------------------------------------------------------------
  // STEP 2: Create a BrowserContext.
  // A context is like an incognito profile: its own cookies,
  // localStorage, cache — fully isolated from other contexts in the
  // same browser process. The test runner normally creates a fresh
  // one per test automatically; here we create exactly one, explicitly.
  // -----------------------------------------------------------------
  const context = await browser.newContext();

  // -----------------------------------------------------------------
  // STEP 3: Open a Page (tab) inside that context.
  // This is the same `page` object type used in the standard way —
  // the API for locating/acting/asserting is IDENTICAL either way.
  // Only how the page gets created differs.
  // -----------------------------------------------------------------
  const page = await context.newPage();

  try {
    // LOCATE + ACT + ASSERT below use the exact same API as the
    // standard way: `.getByRole()`, `.click()`, `.fill()` all work
    // unchanged here.

    await page.goto('https://playwright.dev/');

    // No `expect(page).toHaveTitle()` here — that auto-retrying matcher
    // belongs to the test runner. Manually, you just read the current
    // value with `.title()` and check it yourself, once, right now.
    const title = await page.title();
    assert.match(title, /Playwright/);
    console.log('Title assertion passed:', title);

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
    console.log('Navigation assertion passed:', url);

    // Take a manual screenshot — in the standard way, this happens
    // automatically on failure via config; here you must call it yourself.
    await page.screenshot({ path: 'tutorials/manual-way-result.png' });
    console.log('Screenshot saved to tutorials/manual-way-result.png');
  } catch (error) {
    // No built-in retry/reporting here — if something throws, YOU catch it.
    console.error('Script failed:', error);
  } finally {
    // -----------------------------------------------------------------
    // STEP 4: Manual cleanup — CRITICAL in the manual way.
    // If you forget to close the browser, the OS process keeps running
    // in the background (a leak). The test runner does this for you
    // automatically after every single test; here it's your job, and
    // only needs to happen once since we're managing one browser for
    // the whole script rather than one per test.
    // -----------------------------------------------------------------
    await context.close();
    await browser.close();
  }
}

// Nothing runs until we actually invoke the function — there's no test
// runner discovering and executing this file for us.
main();
```

### Line-by-line reasoning

| Code | What it does | Why it matters |
|---|---|---|
| `require('playwright')` | Imports the raw library. | No test structure, no fixtures — just automation primitives. |
| `require('node:assert')` | Node's built-in assertion module. | `expect()` doesn't exist outside the test runner, so plain `assert` is the fallback. |
| `chromium.launch({ headless: false })` | Starts an actual Chromium process. | You now own this process's lifetime. |
| `browser.newContext()` | Creates an isolated "incognito" session. | Without it, everything would share the browser's default profile (cookies, storage) — no isolation. |
| `context.newPage()` | Opens one tab. | Same `page` object/API as the standard way — this is the part that doesn't change. |
| `try { ... }` | Wraps the actual test logic. | Manual scripts need explicit error handling — nothing catches for you. |
| `page.title()` + `assert.match()` | Reads a value once, checks it once. | No retry — races against async UI updates. This is a real limitation, not a stylistic choice. |
| `page.screenshot(...)` | Manually captures a screenshot. | The standard way does this automatically on failure; here, only if you remember to call it. |
| `catch (error)` | Logs the failure. | No structured pass/fail report is produced — just console output. |
| `finally { context.close(); browser.close(); }` | Manual teardown. | Forgetting this leaks a browser process. This is the #1 mistake in manual scripts. |
| `main();` | Manually invokes the function. | Nothing "discovers" this file the way a test runner discovers `*.spec.ts` files. |

---

## 3. The Standard Way — Playwright Test Runner

**File:** `tutorials/01-standard-way.spec.ts`
**Run with:** `npx playwright test --config=tutorials/playwright.config.ts`

This uses `@playwright/test`, the full test runner. You describe *what* to test; the runner handles *how*: launching browsers, isolating contexts, retrying assertions, running things in parallel, and generating reports.

```ts
// `test`  -> the function used to declare a test case.
// `expect` -> Playwright's own assertion library (auto-waits/retries,
// unlike Node's assert).
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
   * The test function receives an object of FIXTURES as its only
   * argument. `{ page }` here uses object destructuring to pull out
   * the `page` fixture. You never write `new Page()` or
   * `browser.launch()` yourself — the test runner has already launched
   * a Browser, opened a fresh isolated BrowserContext, and created this
   * Page before your test body runs.
   */
  test('homepage has the correct title', async ({ page }) => {
    await page.goto('https://playwright.dev/');

    // `expect(actual).matcher(expected)` — Playwright's web-first
    // assertion. Unlike a plain `assert`, `toHaveTitle` RETRIES for a
    // few seconds until it passes or times out — so you don't need
    // manual waits for the title to update after navigation.
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('can navigate to the docs page via a link click', async ({ page }) => {
    // LOCATE: `getByRole` finds elements the way a screen
    // reader/user would — by their accessible role + accessible name.
    const getStartedLink = page.getByRole('link', { name: 'Get started' });

    // ACT: `.click()` — Playwright auto-waits for the element to be
    // visible, enabled, and stable before clicking.
    await getStartedLink.click();

    // ASSERT: confirms the click actually caused a navigation.
    await expect(page).toHaveURL(/.*intro/);
  });

  test('search box accepts input', async ({ page }) => {
    await page.getByRole('button', { name: 'Search' }).click();
    const searchInput = page.getByPlaceholder('Search docs');
    await searchInput.fill('locators');
    await expect(searchInput).toHaveValue('locators');
  });

  /**
   * `test.afterEach` runs after EVERY test in this block, pass or fail.
   * The test runner already closes the page/context/browser for you
   * automatically — you rarely need to do that manually here.
   */
  test.afterEach(async ({ page }, testInfo) => {
    console.log(`Finished "${testInfo.title}" with status: ${testInfo.status}`);
  });
});
```

### Line-by-line reasoning

| Code | What it does | Why it matters |
|---|---|---|
| `import { test, expect } from '@playwright/test'` | Pulls in the runner's DSL and its assertion library. | `expect` here is *auto-retrying* — fundamentally different from Node's `assert`. |
| `test.describe(name, fn)` | Groups tests. | Organizes reports and scopes hooks — matters once you have dozens of tests. |
| `test.beforeEach(async ({ page }) => {...})` | Shared setup before every test. | Removes duplicated setup code across tests. |
| `test(title, async ({ page }) => {...})` | Declares one test case. | `{ page }` is fixture injection — browser, context, and page already exist by the time your code runs. |
| `page.getByRole(...)` | Locates an element by accessible role/name. | Same API as the manual way — locators don't change between the two approaches. |
| `.click()` / `.fill()` | Acts on the element. | Auto-waits for actionability — identical behavior to the manual way. |
| `expect(page).toHaveTitle(...)` | Asserts, with retries. | This is the key upgrade over `assert.match()` — tolerates async timing. |
| `test.afterEach(async ({ page }, testInfo) => {...})` | Runs after every test. | `testInfo` gives you structured pass/fail/duration data for free. |

---

## 4. The Transition: From Manual to Standard, and Why

The standard way isn't a different tool — it's the manual way with every recurring pain point automated. Here is the transition, mapped pain point by pain point.

### 4.1 Repeated launch/close boilerplate → Fixtures

```js
// Manual: every script repeats this
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
// ... test logic ...
await context.close();
await browser.close();
```
```ts
// Standard: injected, torn down automatically
test('...', async ({ page }) => {
  // just use page
});
```
**Why:** removes an entire class of bugs — the forgotten `.close()` that leaks a browser process — multiplied across hundreds of test files.

### 4.2 One shared page → Isolated context per test

In the manual script, writing a second scenario right after the first on the same `page` means the second scenario inherits whatever cookies, localStorage, or navigation state the first left behind. The runner instead gives **every `test()` its own fresh BrowserContext**, automatically.

**Why:** this is the single biggest source of flaky, order-dependent suites — a test that only passes when run after another test, or only fails when run in parallel. Isolation removes that class of flakiness entirely.

### 4.3 One-shot `assert` → Auto-retrying `expect`

```js
// Manual: reads the value once, right now
const title = await page.title();
assert.match(title, /Playwright/);
```
```ts
// Standard: retries for a few seconds until it's true, or times out
await expect(page).toHaveTitle(/Playwright/);
```
**Why:** the UI updates asynchronously — JS re-renders, network responses land after a delay. A one-shot check races against that; a retrying assertion doesn't. This is what removes the need for most manual `sleep()`/`waitFor()` calls.

### 4.4 Manual `try/catch` → Automatic capture and reporting

The manual script must catch its own errors and `console.log` them — nothing structured comes out. The runner automatically captures a screenshot, video, and full execution trace on failure, and feeds every pass/fail result into the reporters already configured in this project's `playwright.config.ts` (HTML, a custom reporter, and Allure).

**Why:** at 5 tests you can read console output; at 500 tests you need a report you can click through, filter by status, and attach to a CI build.

### 4.5 Sequential execution → Parallel workers

The manual script runs its one scenario start to finish, alone. Nothing about it expresses "run 50 of these at once." The runner spins up multiple **workers**, each running full test files in parallel (`workers` in `playwright.config.ts`).

**Why:** a suite that takes two minutes running serially might take fifteen seconds across eight workers. This is only *safe* because of 4.2 — isolation is what makes parallel execution not corrupt shared state.

### 4.6 Ad-hoc structure → `describe` / `beforeEach` / tags / `.only` / `.skip`

A pile of independent manual scripts has no shared vocabulary for "run just the login scenarios," "skip this one for now," or "set up this common precondition once, for many tests." `test.describe`, `test.beforeEach`, the `--grep` CLI flag, and `test.skip()` provide that vocabulary for free.

**Why:** maintainability — as a suite grows from 5 tests to 500, you need to organize and selectively run subsets without copy-pasting setup code into every file.

### 4.7 Hardcoded `chromium.launch()` → Config-driven cross-browser matrix

The manual script is locked to whatever engine and options were hardcoded at `chromium.launch(...)`. The runner's `projects` configuration lets the *same* test file run against Chromium, Firefox, WebKit, or specific device emulations, without duplicating a single line of test code.

**Why:** cross-browser coverage without maintaining N near-identical copies of every script.

### 4.8 The underlying reason, in one sentence

> The Library API answers *"how do I drive a browser?"* The Test Runner answers *"how do I drive a browser reliably, in isolation, at scale, with visibility into what failed and why?"*

You reach for the manual way for a one-off script (scraping, a quick automation, generating a PDF). You reach for the standard way the moment "a script" becomes "a suite" — which is why every real test file in this project's `tests/` folder is written the standard way.

---

## 5. `tests/example.spec.js` vs. `tests/example.spec.ts` — and how they relate

Both files live in the actual framework's `tests/` directory (not the `tutorials/` folder) and were generated by `npm init playwright@latest` as the framework's starter examples. They are functionally **identical** — same two test cases, same assertions, same behavior — differing only in language and in how much explanatory detail their comments carry.

### `tests/example.spec.js` (JavaScript / CommonJS)

```js
// Import the Playwright Test helpers.
// `test` defines test cases and `expect` is the assertion library.
const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
```

- Uses `require('@playwright/test')` — CommonJS syntax, matching this project's `package.json` (`"type": "commonjs"`).
- No type annotations — plain JavaScript, runs directly on Node with no compile step.
- Functionally the plain-JS twin of the `.ts` file below.

### `tests/example.spec.ts` (TypeScript / ES Modules)

```ts
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
```

- Uses `import`/ES module syntax, type-checked against the `types` declared in this project's `tsconfig.json` (`"@playwright/test"`, `"node"`).
- Playwright's test runner transpiles TypeScript on the fly — no separate build step needed to run it, but your editor gets full autocomplete and type errors (e.g. it will flag a typo like `.toHaveTtile()` before you ever run the test).

### How they relate to each other, and to the rest of this document

1. **Both use the Standard Way.** They import from `@playwright/test`, use `{ page }` fixture injection, and call `expect(...)` with auto-retrying matchers — exactly the pattern shown in Section 3 (`tutorials/01-standard-way.spec.ts`).
2. **They are the "hello world" scaffold.** These two files are what `npm init playwright@latest` generates automatically to prove the install works. `tutorials/01-standard-way.spec.ts` in this project expands on the exact same idea (`has title`, click a link, assert navigation) with heavier comments for teaching purposes.
3. **`.js` vs. `.ts` is a project convention choice, not a Playwright requirement.** Playwright's test runner accepts both. This project keeps `.js` as a leftover/reference from the default scaffold while the rest of `tests/` (all the `login-*.spec.ts`, `interactions-*.spec.ts`, etc.) is written in TypeScript — the convention this framework has standardized on for the type safety benefit described above.
4. **Neither uses the Manual Way.** There is no `chromium.launch()` anywhere in either file — confirming that even the simplest, most "basic" Playwright examples in this project are already built on the Test Runner, not the raw Library. The Library only shows up in this project inside `tutorials/02-manual-way.js`, written specifically to illustrate what the Test Runner is saving you from.

---

## 6. Summary

| Aspect | Manual Way (`playwright` library) | Standard Way (`@playwright/test`) |
|---|---|---|
| Browser/context/page lifecycle | You manage it explicitly | Injected via fixtures, torn down automatically |
| Isolation between test cases | None by default — you'd have to build it | A fresh context per test, automatically |
| Assertions | One-shot (`assert`), no retry | Auto-retrying (`expect(...).toHave...()`) |
| Error handling & reporting | Manual `try/catch`, console logs | Automatic screenshots/video/trace on failure, HTML/Allure/custom reports |
| Parallelism | None — one script runs alone | Multiple workers run test files in parallel |
| Test organization | None built-in | `describe`, `beforeEach`/`afterEach`, `--grep`, `.only`/`.skip` |
| Cross-browser coverage | Hardcode a new script per engine | One test file, multiple `projects` in config |
| When to use it | One-off scripts, scraping, custom automation tooling | Any real, growing test suite — which is why this entire project's `tests/` folder is written this way |

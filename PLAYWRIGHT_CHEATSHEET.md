# 🎭 Playwright Cheatsheet — Basics

> A quick reference for Playwright fundamentals, with inline comments explaining each line.

## Installation
```bash
npm init playwright@latest    # Scaffold a new Playwright test project
# or
npm i -D @playwright/test     # Install the test runner and browsers
npx playwright install chromium # Download Chromium only (this project runs Chrome-only)
```

## Your first test
```ts
import { test, expect } from '@playwright/test';   // Import test and expect APIs

test('should have title', async ({ page }) => {     // Define a test, receive a page object
  await page.goto('https://playwright.dev/');      // Go to the Playwright homepage
  await expect(page).toHaveTitle(/Playwright/);    // Assert the page title contains 'Playwright'
});
```

## Config: `playwright.config.ts`
```ts
import { defineConfig } from '@playwright/test';   // Import the config helper

export default defineConfig({                     // Export a config object
  testDir: './tests',                             // Directory where test files live
  timeout: 30_000,                                // Default timeout (ms) for each test
  retries: process.env.CI ? 2 : 0,                // Retry failed tests 2× in CI, 0 locally
  workers: process.env.CI ? 1 : undefined,        // Run 1 worker locally, adjust in CI
  reporter: [                                       // Output reporters
    ['list'],                                     // Compact list reporter
    ['html', { outputFolder: 'playwright-report', open: 'never' }] // HTML report, don't auto-open
  ],
  use: {                                          // Default settings for all tests
    baseURL: 'http://localhost:3000',             // Base URL so you can use relative paths
    trace: 'on-first-retry',                      // Trace on first retry to help debugging
    screenshot: 'only-on-failure',                // Screenshot only when a test fails
    video: 'retain-on-failure',                   // Video only on failure
    actionTimeout: 10_000,                        // Timeout for each action (click, fill, etc.)
    navigationTimeout: 30_000                     // Timeout for navigation (goto, wait)
  },
  projects: [                                     // Matrix of browser projects to run
    { name: 'chromium' }                          // This project: Chromium only
    // { name: 'firefox' },                       // Firefox removed (100% CPU / hangs)
    // { name: 'webkit' }                         // Re-enable for Safari coverage
  ],
  webServer: {                                    // Auto-start a dev server before tests
    command: 'npm run start',                     // Command to start the server
    url: 'http://localhost:3000',                 // URL the server will be reachable at
    reuseExistingServer: !process.env.CI         // Reuse the same server across tests (CI: fresh)
  }
});
```

## Navigation
```ts
await page.goto('https://example.com');           // Open a page in the browser
await page.goto('/login', { waitUntil: 'networkidle' }); // Navigate & wait for all network idle
await page.waitForLoadState('networkidle');       // Wait until no pending network requests
await page.waitForURL('https://example.com/dashboard'); // Wait until URL matches exactly
await page.waitForURL(/\/dashboard/);             // Wait until URL matches regex
await page.goBack();                              // Go to the previous page in browser history
await page.goForward();                           // Go forward one step in history
await page.reload();                              // Reload the current page
```

## Locators

```ts
// By role (recommended — resilient to DOM changes)
page.getByRole('button', { name: 'Sign in', exact: true }); // Find a button with exact text 'Sign in'
page.getByRole('heading', { name: 'Dashboard' });         // Find a heading with that text
page.getByRole('textbox', { name: 'Email' });             // Find a textbox by accessible name
page.getByRole('link', { name: /pricing/i });             // Find a link matching regex

// By text (partial or exact)
page.getByText('Welcome back');                         // Exact text match
page.getByText('Sign in', { exact: true });              // Exact match, fails if substring

// Friendly shortcuts
page.getByLabel('Email address');                        // Input labeled by <label> or aria-label
page.getByPlaceholder('you@example.com');                // Input with placeholder text
page.getByTestId('email-input');                        // Element with data-testid attribute
page.getByAltText('Company logo');                      // <img alt="Company logo">
page.getByTitle('Close dialog');                        // Element with title attribute

// CSS / XPath fallback (less preferred)
page.locator('button[type="submit"]');                  // CSS attribute selector
page.locator('#login-form');                            // CSS ID selector
page.locator('css=button.primary');                     // CSS class selector (alias for locator)
page.locator('xpath=//button[@type="submit"]');         // Full XPath expression
```

**Quick selector map** (choose the most resilient option):

| Need | Locator |
|---|---|
| Button by name | `getByRole('button', { name: 'Save' })` |
| Heading | `getByRole('heading', { name: 'Dashboard' })` |
| Text | `getByText('Hello world')` |
| Label | `getByLabel('Email')` |
| Placeholder | `getByPlaceholder('Email')` |
| Test id | `getByTestId('submit')` |
| Image alt | `getByAltText('Logo')` |
| Title attr | `getByTitle('Close')` |
| CSS class | `locator('.btn-primary')` |

## Actions
```ts
await page.getByRole('button', { name: 'Sign in' }).click(); // Click a button (auto-waits)
await page.getByRole('button').dblclick();                  // Double-click
await page.getByLabel('Email').fill('user@example.com');   // Type into an input
await page.getByLabel('Password').fill('secret');          // Fill password
await page.getByLabel('Password').clear();                 // Clear the input value
await page.getByRole('checkbox').check();                  // Check a checkbox
await page.getByRole('checkbox').uncheck();                // Uncheck
await page.getByLabel('Country').selectOption('US');       // Select dropdown option by value
await page.getByLabel('Country').selectOption({ label: 'United States' }); // By label text
await page.getByLabel('Tags').selectOption(['a', 'b']);    // Multi-select
await page.getByLabel('Resume').setInputFiles([           // Upload a file
  { name: 'resume.pdf', mimeType: 'application/pdf', buffer: fs.readFileSync('resume.pdf') }
]); // Provide file meta + buffer
await page.getByRole('button', { name: 'Open' }).hover();  // Hover over element (reveals menus)
await page.getByLabel('Name').focus();                     // Move focus to element
await page.getByLabel('Name').blur();                      // Remove focus
await page.getByLabel('Name').press('Tab');                // Simulate pressing Tab key
await page.keyboard.press('Enter');                        // Low-level key press
```

## Assertions (`expect`)
> All assertions are auto-retrying (default 5s timeout) until the condition is met or timeout.

```ts
// Page-level
await expect(page).toHaveURL('https://example.com/dashboard'); // URL matches exactly
await expect(page).toHaveURL(/\/dashboard/);                    // URL matches regex
await expect(page).toHaveTitle(/Dashboard/);                    // Page title matches regex
await expect(page).toHaveScreenshot('dashboard.png');           // Screenshot comparison

// Visibility / state
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible(); // Element is visible
await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();       // Enabled (not disabled)
await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();       // Disabled
await expect(page.getByRole('checkbox')).toBeChecked();                         // Checked state
await expect(page.getByRole('checkbox')).not.toBeChecked();                      // Unchecked
await expect(page.getByText('Saved!')).toBeVisible();                           // Text visible
await expect(page.getByText('Saving...')).toBeHidden();                         // Text hidden

// Text / value / count / attribute
await expect(page.getByLabel('Email')).toHaveValue('user@example.com');          // Input value matches
await expect(page.getByText('Hello world')).toHaveText('Hello world');          // Exact text match
await expect(page.getByText('Hello')).toContainText('Hello world');             // Substring exists
await expect(page.getByTestId('list')).toHaveCount(3);                         // Number of descendants
await expect(page.getByTestId('list')).toContainText('item');                   // List contains text
await expect(page.getByTestId('output')).toBeEmpty();                           // No child elements
await expect(page.getByLabel('Email')).toHaveAttribute('type', 'email');        // Attribute value
await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused();       // Element has focus
await expect(page.getByRole('button', { name: 'Submit' })).toHaveFocus();       // (alias)
```

## Chaining, filtering, nth
> Refine or narrow down locator results.

```ts
// Filter by descendant text
const row = page.getByRole('row').filter({ hasText: 'John Doe' }); // Find row containing 'John Doe'
await row.getByRole('button', { name: 'Delete' }).click();          // Click delete inside that row

// has / hasNot — filter by presence/absence of another element
await page.locator('ul').filter({ has: page.getByText('Important') }); // ul that contains 'Important'
await page.locator('ul').filter({ hasNot: page.getByText('Deprecated') }); // ul without 'Deprecated'

// and / or — combine conditions
await page.getByText('Sign in').or(page.getByText('Log in')).click(); // Click either text
await page.getByRole('button').and(page.getByRole('button', { name: 'Save' })); // Must match both

// nth / first / last — pick a specific index
await page.locator('tr').nth(2).getByRole('button').click(); // 3rd row (0-indexed)
await page.getByRole('row').last().getByText('John').click();   // Last row matching
```

## Auto-waiting & web-first assertions
> Playwright automatically waits for elements before performing actions, and retries `expect` assertions.

```ts
const submit = page.getByRole('button', { name: 'Submit' });
await expect(submit).toBeEnabled(); // Retries until button becomes enabled, then proceeds
await submit.click();               // Click only after assertion passes
```

```ts
await page.locator('#spinner').waitFor({ state: 'visible' }); // Wait for spinner to appear
await expect.poll(async () => page.evaluate(() => window.userId)).toEqual(42); // Poll until value changes
```

## Fixtures, hooks, structure
> Organize test logic, share setup, control test order.

```ts
import { test as base, expect, type Page } from '@playwright/test'; // Import test base and types

export const test = base.extend<{ authenticatedPage: Page }>({       // Create a custom test fixture
  authenticatedPage: async ({ page }, use) => {                     // before each test using this fixture
    await page.goto('/login');                                       // Go to login page
    await page.getByLabel('Email').fill('user@example.com');        // Fill email
    await page.getByLabel('Password').fill('secret');               // Fill password
    await page.getByRole('button', { name: 'Sign in' }).click();    // Submit login
    await use(page);                                                 // Run the actual test with the page
  },
});

test('dashboard visible', async ({ authenticatedPage }) => {         // Test that uses the fixture
  await authenticatedPage.goto('/dashboard');                       // Navigate to dashboard
  await expect(authenticatedPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible(); // Assert heading visible
});
```

```ts
test.describe('Login', () => {                                       // Group of related tests
  test.beforeEach(async ({ page }) => {                              // Run before each test in this group
    await page.goto('/login');                                       // Ensure we start on login page
  });

  test('shows error on bad credentials', async ({ page }) => { /* ... */ });
});

test.describe.configure({ mode: 'serial' }); // Run tests in this describe serially (order matters, stops on first failure)
```

## Test options
> Control which tests run, skipping, focusing, or tagging.

```ts
test.skip('legacy flow', async ({ page }) => {}); // Skip this test entirely
test.fixme('flaky spec', async ({ page }) => {});  // Mark as known flaky (still runs)
test.only('focused test', async ({ page }) => {}); // Run ONLY this test (others skipped)

test('user can log in @smoke', async ({ page }) => { /* ... */ }); // Tag: can filter with `--grep @smoke`
```

Retries / parallelism in config:
```ts
retries: process.env.CI ? 2 : 0,   // 2 retries in CI, 0 locally
workers: 1,                        // Number of workers (processes) to run tests in parallel
fullyParallel: true,               // Run each test in its own worker (default: true)
```

## Screenshots / video / traces
> Capture evidence when things go wrong.

```ts
await page.screenshot({ path: 'screenshot.png' });           // Full-page screenshot
await page.screenshot({ path: 'full.png', fullPage: true }); // Screenshot of the whole scrollable page
await page.screenshot({ path: 'clip.png', clip: { x: 0, y: 0, width: 800, height: 600 } }); // Region crop
```

Configured via `playwright.config.ts`:
- `screenshot: 'only-on-failure'` — only save when test fails
- `video: 'retain-on-failure'` — record video, keep only on failure
- `trace: 'on-first-retry'` — capture trace on first retry (helps debug flakes)

## Network / console / errors / dialogs
> Hook into browser events.

```ts
page.on('console', (msg) => console.log(msg.type(), msg.text())); // Log all console messages (info/warn/error)
page.on('pageerror', (error) => console.error(error));           // Catch unhandled page JS errors
page.on('dialog', (dialog) => dialog.accept());                 // Auto-accept JS dialogs (alert/prompt/confirm)
```

```ts
await page.waitForRequest('**/api/login');                       // Wait for any request matching pattern
await page.waitForResponse((res) => res.url().includes('/api/login') && res.ok()); // Wait for a successful API response
```

## Auth / storage state
> Reuse authenticated context across tests.

```ts
// Save the current auth state (cookies, storage) to a file
await context.storageState({ path: './auth.json' });

// Restore saved auth state so you don't have to log in each time
const context = await browser.newContext({ storageState: './auth.json' });
const page = await context.newPage();
```

## Devices / viewport / emulation
> Test responsive designs and mobile features.

```ts
import { devices } from '@playwright/test';
test.use(devices['Pixel 7']);                                 // Use predefined Pixel 7 device config

await page.setViewportSize({ width: 375, height: 812 });        // Set custom viewport size
test.use({ viewport: { width: 1280, height: 720 } });          // Configurable viewport in config

await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' }); // Emulate dark mode / reduced motion
await context.grantPermissions(['geolocation'], { origin: 'https://example.com' }); // Grant geolocation permission
```

## API testing via `page.request`
> Playwright’s test runner includes a built-in HTTP client.

```ts
const response = await page.request.get('/api/users');       // GET request
await expect(response.ok()).toBeTruthy();                   // Assert 2xx status
const users = await response.json();                        // Parse JSON body
```

## Common recipes

**Login** (typical flow):
```ts
test('user can log in', async ({ page }) => {
  await page.goto('/login');                                                       // Open login page
  await page.getByLabel('Email').fill('user@example.com');                        // Fill email field
  await page.getByLabel('Password').fill('secret');                               // Fill password field
  await page.getByRole('button', { name: 'Sign in' }).click();                    // Click sign-in button
  await expect(page).toHaveURL(/\/dashboard/);                                   // Wait for redirect
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();   // Verify dashboard appears
});
```

**Dropdown**:
```ts
await page.getByLabel('Country').selectOption('US');           // Single option by value
await page.getByLabel('Country').selectOption({ index: 2 });   // By zero-based index
```

**Modal**:
```ts
const dialog = page.getByRole('dialog');                      // Find the dialog role
await page.getByRole('button', { name: 'Open dialog' }).click(); // Open it
await expect(dialog).toBeVisible();                           // Wait for it to appear
await page.getByRole('button', { name: 'Confirm' }).click();   // Click Confirm
await expect(dialog).toBeHidden();                            // Verify it closed
```

**Toast**:
```ts
await expect(page.getByText('Profile updated')).toBeVisible(); // Wait for toast message
```

**Table row action**:
```ts
const row = page.getByRole('row').filter({ hasText: 'John Doe' }); // Find row with John Doe
await row.getByRole('button', { name: 'Delete' }).click();          // Delete that row
```

## Tips & anti-patterns
- ✅ Prefer `getByRole`, `getByLabel`, `getByText` over raw CSS/IDs — more resilient to DOM changes.
- ✅ Don't use `waitForTimeout` — use web-first assertions or `waitFor` with meaningful conditions.
- ✅ Assert before acting (`expect(...).toBeVisible()`) to avoid flaky clicks/interactions.
- ✅ Use `exact: true` when text is ambiguous or could match multiple elements.
- ✅ Keep tests independent; use `beforeEach`/`afterEach` for setup/teardown, avoid shared state.

---

# 🚀 Advanced Topics

> Deeper patterns, performance, and tooling beyond the basics.

## 1. Test Isolation & Parallelism
- **Workers**: Run tests in separate processes (`workers: 4` in config) to maximize CPU core usage.
- **`test.describe.serial`**: Guarantees execution order within a group (e.g., when earlier tests create resources needed by later ones).
- **Test name uniqueness**: Avoid duplicate test names across files; Playwright runs each test in its own worker, so names must be unique globally when `fullyParallel: true`.

## 2. Tracing & Debugging
- **Trace modes**: `on`, `on-first-retry`, `retain-on-failure`, `off`.
- **View traces**: After a test run, open `playwright-report/` and click the “Trace Viewer” icon, or run `npx playwright show-trace trace.zip`.
- **Auto-collect**: Traces are automatically saved on failure if `trace: 'on-first-retry'` or `trace: 'on'` is set.

## 3. Network Interception & Mocking
- **`route()`**: Intercept and modify requests/responses on the fly.
  ```ts
  await page.route('**/api/*', async route => {
    const body = JSON.stringify({ mocked: true });
    route.fulfill({ status: 200, body, contentType: 'application/json' });
  });
  ```
- **`waitForResponse`**: Pause test execution until a specific network response arrives.
- **Offline mode**: `test.describe('offline', () => { test.use({ offline: true }); ... })` — emulates connection loss.

## 4. Component Testing (@playwright/test vs `@playwright/test` with `@storybook/testing-react`)
- Playwright can test React components rendered via Storybook or directly.
- Use `test.describe.start` / `test.describe.end` for component suites.
- Export a `playwright.config.ts` with `testDir: './src/components'` and `use { viewport: { width: 375, height: 667 } }`.

## 5. Browser Contexts & Persistent Storage
- **`browser.newContext()`**: Create isolated contexts (different storage, cookies, cache) per test — the default pattern.
- **`context.storageState()`**: Persist cookies/localStorage to disk so subsequent tests can restore it without re‑logging in.
- **Multiple contexts**: Useful for testing features like “logged‑in vs. guest” flows in the same test file.

## 6. Fixture Composition & `test.extend`
- Compose multiple fixtures to layer concerns (e.g., `authenticatedPage` + `apiPage`).
- Example:
  ```ts
  const test = base.extend<{
    authPage: Page;
    apiContext: APIRequestContext;
  }>({
    authPage: async ({ page }, use) => { /* … */ },
    apiContext: async ({ }, use) => { use(await request.newContext()); },
  });
  ```
- Each fixture runs its own `setup` hook; teardown is automatic.

## 7. Performance & Auditing
- **`page.metrics()`**: Fetch `LayoutShift`, `FCP`, `LCP`, `CLS` via the Performance API.
- **`page.waitForPerformanceMetric(name, threshold)`**: Wait until a specific metric stays below a threshold.
- **Lighthouse integration**: `npx playwright codegen --target=lighthouse` generates a test that runs Lighthouse and asserts scores.

## 8. CDP (Chrome DevTools Protocol) Access
- `page.context().cdp()` gives direct access to low‑level CDP domains for custom commands, such as enabling performance events or modifying DOM nodes on the fly.

## 9. Visual Regression with Percy or Applitools
- Capture baseline screenshots: `await page.perfCapture('baseline')` (custom helper) or use third‑party SDKs.
- Diff subsequent runs against the baseline; CI can fail on unexpected pixel changes.

## 10. CI/CD Integration Tips
- **Artifacts**: `reporter: [['dot'], ['html', { outputFolder: 'public/playwright', open: 'never' }]]` publishes an HTML report as a CI artifact.
- **Upload traces**: `trace: 'on'` + `use { trace: 'on' }` + `workers: 1` ensures each test’s trace is uploaded; then view in the Playwright Cloud dashboard.
- **Environment isolation**: Use `grep` tags (`@smoke`, `@regression`) and CI matrix to run different suites on pull‑request vs. push events.

---

*Happy testing! 🎉 Keep this sheet handy, and explore the [official Playwright docs](https://playwright.dev/docs/test-intro) for deeper dives.*
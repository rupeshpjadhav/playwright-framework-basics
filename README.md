# Playwright Framework Basics

A study project covering all the fundamental concepts and patterns of the Playwright test automation framework using TypeScript.

---

## Tech Stack

| Package / Tool | Version | Purpose |
|---|---|---|
| `@playwright/test` | ^1.61.1 | Test runner, fixtures, assertions, browser automation |
| TypeScript | ES2020 target, CommonJS modules | Static typing (`tsconfig.json`) |
| Node.js | LTS (developed on v26.12.1) | Runtime |
| `@types/node` | ^26.0.1 | Node API type definitions |
| `dotenv` | ^17.4.2 | Loads `.env` into `process.env` |
| `@faker-js/faker` | ^10.5.0 | Random test data generation |
| `winston` + `@types/winston` | ^3.19.0 / ^2.4.4 | Leveled logging to console and files |
| `allure-playwright` | ^3.10.2 | Allure reporter integration |
| `allure-js-commons` | ^3.10.2 | Allure metadata API (feature, story, severity, links) |
| `allure-commandline` | ^2.43.0 | Generate and open Allure HTML reports |
| Browsers | Chromium, Firefox, WebKit | Configured as Playwright projects |

---

## Project Structure

```
playwright-framework-basics/
├── .env                                  # Local secrets/URLs (gitignored)
├── .env.example                          # Committed template for .env
├── .gitignore
├── .github/
│   └── workflows/
│       └── playwright.yml                # GitHub Actions CI
├── playwright.config.ts                  # 3 browser projects, 3 reporters, global setup/teardown
├── tsconfig.json
├── package.json                          # Dependencies + npm scripts
├── README.md
├── PLAYWRIGHT_CHEATSHEET.md              # One-page command/locator reference
├── Playwright_Framework_Guide.docx        # Long-form study guide (Word)
├── sample.md                             # macOS project-initialisation notes
├── tests/                                # Main test suite (testDir)
│   ├── data/
│   │   ├── .auth/                        # Saved storage state (gitignored)
│   │   ├── login.properties
│   │   ├── login-data.properties
│   │   ├── login-data.json
│   │   └── login-data.csv
│   ├── fixtures/loginFixture.ts
│   ├── global/
│   │   ├── globalSetup.ts                # Runs once before all tests
│   │   └── globalTeardown.ts             # Runs once after all tests
│   ├── pages/LoginPage.ts
│   ├── reporters/customReporter.ts
│   ├── utils/
│   │   ├── envLoader.ts
│   │   ├── propertyReader.ts
│   │   ├── jsonReader.ts
│   │   ├── csvReader.ts
│   │   ├── testDataFactory.ts
│   │   └── logger.ts
│   ├── login-visual.spec.ts-snapshots/   # Chromium/macOS baselines (committed)
│   └── *.spec.ts / example.spec.js       # 29 test files, 134 tests
├── tutorials/                            # Standalone mini-project (own config, outside testDir)
│   ├── playwright.config.ts
│   ├── 01-standard-way.spec.ts
│   ├── 02-manual-way.js
│   ├── Playwright-Basics-Manual-vs-Standard.md
│   └── Playwright-Basics-Manual-vs-Standard.docx
├── test-results/                         # Artifacts + custom-report.json/.txt (gitignored)
├── playwright-report/                    # HTML report (gitignored)
├── allure-results/                       # Raw Allure data (gitignored)
├── allure-report/                        # Generated Allure HTML (gitignored)
├── logs/                                 # Winston logs (gitignored)
└── node_modules/
```

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 18+ | LTS recommended; developed on Node v26.12.1 |
| npm | Bundled with Node |
| Playwright browsers | Installed separately (step 2 below) |
| OS | Any; committed visual baselines are Chromium on macOS only |

---

## Setup & Installation

```bash
# 1. Install dependencies
npm install

# 2. Install browser engines
npx playwright install             # macOS / Windows
npx playwright install --with-deps # Linux / CI (also installs OS libraries)

# 3. Create your local environment file
cp .env.example .env               # then edit with your values
```

`.env` is gitignored; `.env.example` is the committed template.

The suite targets public practice sites — no local app server is required:

| Purpose | Site |
|---|---|
| Login / UI tests | https://practicetestautomation.com/practice-test-login/ |
| Locators, dialogs, drag & drop | https://testautomationpractice.blogspot.com/ |
| iframe tests | https://the-internet.herokuapp.com/iframe |
| API tests | https://jsonplaceholder.typicode.com |

---

## Running Tests

Common commands have npm script aliases; the raw `npx` form is shown alongside.

| Task | npm script | Raw command |
|---|---|---|
| Full suite (3 browsers) | `npm test` | `npx playwright test` |
| Single browser | `npm run test:chromium` | `npx playwright test --project=chromium` |
| Single file | — | `npx playwright test tests/login-page-object-model.spec.ts` |
| Headed mode | `npm run test:headed` | `npx playwright test --headed` |
| UI mode | `npm run test:ui` | `npx playwright test --ui` |
| Smoke / sanity / regression | `npm run test:smoke` · `test:sanity` · `test:regression` | `npx playwright test --grep "@smoke"` |
| Visual tests (Chromium) | `npm run test:visual` | `npx playwright test tests/login-visual.spec.ts --project=chromium` |
| Tutorials mini-project | `npm run test:tutorials` | `npx playwright test --config=tutorials/playwright.config.ts` |
| HTML report | `npm run report` | `npx playwright show-report` |
| Generate Allure report | `npm run allure:generate` | `npx allure generate allure-results --clean -o allure-report` |
| Open Allure report | `npm run allure:open` | `npx allure open allure-report` |
| Serve Allure in one step | `npm run allure:serve` | `npx allure serve allure-results` |
| Install browsers | `npm run install:browsers` | `npx playwright install` |

Generate a test from a browser session:

```bash
npx playwright codegen https://practicetestautomation.com/practice-test-login/
```

`tutorials/` also contains a plain Node.js script that uses the `playwright` library directly, without the test runner:

```bash
node tutorials/02-manual-way.js
```

---

## Configuration

### playwright.config.ts

| Setting | Local | CI |
|---------|-------|----|
| Parallel execution | Yes (`fullyParallel: true`) | No (`workers: 1`) |
| Retries | 0 | 2 |
| `test.only` allowed | Yes | No (`forbidOnly`) |
| Trace collection | On first retry | On first retry |
| Global setup/teardown | `tests/global/*.ts` | Same |
| Reporters | HTML + custom + Allure | Same |
| Browsers | Chromium, Firefox, WebKit | Chromium, Firefox, WebKit |

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "types": ["node", "@playwright/test"]
  }
}
```

### Browser Projects Configured

| Project | Device | Status |
|---------|--------|--------|
| chromium | Desktop Chrome | Active |
| firefox | Desktop Firefox | Active |
| webkit | Desktop Safari | Active |
| Mobile Chrome | Pixel 5 | Commented out |
| Mobile Safari | iPhone 12 | Commented out |
| Microsoft Edge | Desktop Edge | Commented out |
| Google Chrome | Desktop Chrome (branded) | Commented out |

> Visual-regression baselines are committed for Chromium/macOS only, so `login-visual.spec.ts` skips Firefox and WebKit (see §21).

---

## Utilities & Features Summary

| File | Purpose | Key Exports | Used By |
|------|---------|-------------|---------|
| `tests/utils/propertyReader.ts` | Read Java-style `.properties` files | `readProperties(filePath)` | `login-data-properties.spec.ts`, `login-helper-function.spec.ts` |
| `tests/utils/envLoader.ts` | Load `.env` variables with validation | `loadEnv()`, `getEnvValue(key)` | `login-data-env`, `login-page-object-model`, `login-custom-fixture`, `login-global-setup`, `login-tags`, `login-logging`, `login-reporting` |
| `tests/utils/jsonReader.ts` | Read JSON files with TypeScript generics | `readJson<T>(filePath)` | `login-data-json.spec.ts` |
| `tests/utils/csvReader.ts` | Read CSV files into array of objects | `readCsv(filePath)` | `login-data-csv.spec.ts` |
| `tests/utils/testDataFactory.ts` | Generate random test data via faker | `generateUserData()`, `generateAddressData()`, `generateRandomString()`, `generateRandomNumber()` | `login-data-faker.spec.ts` |
| `tests/pages/LoginPage.ts` | Page Object Model for login page | `LoginPage` class | `login-page-object-model.spec.ts`, `login-custom-fixture.spec.ts` |
| `tests/fixtures/loginFixture.ts` | Custom fixture with pre-built LoginPage | `test` (extended), `expect` | `login-custom-fixture.spec.ts` |
| `tests/global/globalSetup.ts` | One-time setup before all tests | `default` function | Wired via `playwright.config.ts` |
| `tests/global/globalTeardown.ts` | One-time cleanup after all tests | `default` function | Wired via `playwright.config.ts` |
| `tests/utils/logger.ts` | Winston logger with console + file transports | `logger` instance | `login-logging.spec.ts` |
| `tests/reporters/customReporter.ts` | Custom Playwright reporter — JSON + text output | `default` class | Registered in `playwright.config.ts` |

---

## Test Patterns Overview

The suite demonstrates **13 test-writing patterns**. Each row links to the detailed section further down.

| # | Pattern | Files | Details |
|---|---------|-------|---------|
| 1 | Basic inline tests | `example.spec.ts`, `example.spec.js`, `login-basic.spec.ts`, `login-codegen.spec.ts` | §5, §6, §8 |
| 2 | Data-driven — `.properties` | `login-data-properties.spec.ts` | §2 |
| 3 | Data-driven — `.env` | `login-data-env.spec.ts` | §1 |
| 4 | Page Object Model | `login-page-object-model.spec.ts` + `pages/LoginPage.ts` | §3 |
| 5 | Helper function | `login-helper-function.spec.ts` | §4 |
| 6 | Role-based locators | `locators-role-based.spec.ts` | §7 |
| 7 | Custom fixtures (`test.extend()`) | `login-custom-fixture.spec.ts` + `fixtures/loginFixture.ts` | §10 |
| 8 | Storage state / auth reuse | `login-storage-state.spec.ts` | §11 |
| 9 | Global setup & teardown | `login-global-setup.spec.ts` + `global/*.ts` | §12 |
| 10 | Data-driven — JSON & CSV | `login-data-json.spec.ts`, `login-data-csv.spec.ts` | §13 |
| 11 | Random data (Faker) | `login-data-faker.spec.ts` + `utils/testDataFactory.ts` | §14 |
| 12 | Test tagging | `login-tags.spec.ts` | §15 |
| 13 | Structured logging | `login-logging.spec.ts` + `utils/logger.ts` | §16 |

Feature demos with their own sections: custom reporter (§17), Allure (§18), API testing (§19), network mocking (§20), visual testing (§21), parameterized tests (§22), soft assertions (§23), parallel vs serial (§24), retries (§25), dialogs (§26), tabs & windows (§27), iframes (§28), drag & drop (§29).

---

## Detailed Topic Coverage

### 1. Environment Variable Loader (`.env`)
**Utility:** `tests/utils/envLoader.ts`

Loads environment variables from a `.env` file using the `dotenv` package. Provides validated access to env values with error handling.

**Exported Functions:**

```typescript
export function loadEnv(): NodeJS.ProcessEnv
// Loads .env file from project root into process.env

export function getEnvValue(key: string): string
// Retrieves a named env variable; throws Error if missing
```

**Environment File:** `.env`

```
APP_URL=https://practicetestautomation.com/practice-test-login/
VALID_USERNAME=student
VALID_PASSWORD=Password123
INVALID_USERNAME=invaliduser
INVALID_PASSWORD=invalidpassword
```

**Test File:** `tests/login-data-env.spec.ts` (3 tests)

Uses `test.beforeAll()` hook to call `loadEnv()` once before all tests, then reads values via `getEnvValue()` in each test.

| Test | Description |
|------|-------------|
| env-based valid login test | Login with valid credentials, assert success heading visible |
| env-based invalid username test | Login with invalid username, assert error message |
| env-based invalid password test | Login with invalid password, assert error message |

---

### 2. Property File Reader (`.properties`)
**Utility:** `tests/utils/propertyReader.ts`

Reads Java-style `.properties` files and returns key-value pairs as a `Record<string, string>`. Supports comments (`#`, `!`), blank lines, and `key=value` format.

**Exported Function:**

```typescript
export function readProperties(filePath: string): Record<string, string>
```

**Features:**
- Parses `key=value` pairs separated by `=`
- Ignores lines starting with `#` or `!` (comments)
- Ignores blank lines
- Handles both CRLF and LF line endings
- Trims whitespace from keys and values

**Data Files:**

`tests/data/login.properties` (basic):
```properties
url=https://practicetestautomation.com/practice-test-login/
username=student
password=Password123
```

`tests/data/login-data.properties` (namespaced):
```properties
url=https://practicetestautomation.com/practice-test-login/
valid.username=student
valid.password=Password123
invalid.username=invaliduser
invalid.password=invalidpassword
valid.expectedMessage=Logged In Successfully
invalid.expectedMessage=Your username is invalid!
```

**Test File:** `tests/login-data-properties.spec.ts` (3 tests)

Reads test data from `login-data.properties` using `readProperties()`. Each test resolves the path via `path.resolve(process.cwd(), "tests", "data", "login-data.properties")`.

| Test | Description |
|------|-------------|
| data driven valid login test | Login with `valid.username` / `valid.password`, assert `valid.expectedMessage` heading |
| data driven invalid username test | Login with `invalid.username`, assert `invalid.expectedMessage` error |
| data driven invalid password test | Login with `invalid.password`, assert "Your password is invalid!" error |

---

### 3. Page Object Model (POM)
**Page Class:** `tests/pages/LoginPage.ts`

Encapsulates all locators and actions for the login page into a reusable class. Uses role-based locators for accessibility and stability.

**Class Definition:**

```typescript
export class LoginPage {
  page: Page;
  usernameField: Locator;    // getByRole("textbox", { name: "Username" })
  passwordField: Locator;    // getByRole("textbox", { name: "Password" })
  submitButton: Locator;     // getByRole("button", { name: "Submit" })
  successHeading: Locator;   // getByRole("heading", { name: "Logged In Successfully" })
  errorMessage: Locator;     // locator("#error")

  constructor(page: Page)
  async navigateTo(url: string)                      // Navigate to login page
  async enterUsername(username: string)               // Fill username field
  async enterPassword(password: string)               // Fill password field
  async clickSubmit()                                 // Click submit button
  async login(username: string, password: string)     // Combined: enter credentials + submit
  async verifyLoginSuccess()                          // Assert success heading is visible
  async verifyErrorMessage(expectedMessage: string)   // Assert error div contains text
}
```

**Test File:** `tests/login-page-object-model.spec.ts` (3 tests)

Combines POM with environment variables. Uses `test.beforeAll()` to load env, then creates `LoginPage` instance per test.

| Test | Description |
|------|-------------|
| POM valid login test | `loginPage.login()` + `loginPage.verifyLoginSuccess()` |
| POM invalid username test | `loginPage.login()` + `loginPage.verifyErrorMessage("Your username is invalid!")` |
| POM invalid password test | `loginPage.login()` + `loginPage.verifyErrorMessage("Your password is invalid!")` |

---

### 4. Helper Function Pattern
**Test File:** `tests/login-helper-function.spec.ts` (2 tests)

Defines a reusable `login()` helper function within the test file to centralize login logic. Combines with property reader for data-driven approach.

**Helper Function:**

```typescript
async function login(page: any, config: Record<string, string>) {
  await page.goto(config.url);
  await page.getByRole("textbox", { name: "Username" }).fill(config.username);
  await page.getByRole("textbox", { name: "Password" }).fill(config.password);
  await page.getByRole("button", { name: "Submit" }).click();
}
```

| Test | Description |
|------|-------------|
| helper-based valid login test | Calls `login()` with valid config, asserts success heading |
| helper-based invalid login test | Calls `login()` with invalid username, asserts error message |

---

### 5. Basic Inline Tests
**Test File:** `tests/login-basic.spec.ts` (4 tests)

Straightforward tests with hardcoded data directly in the test body. No external data sources or abstractions.

| Test | Description |
|------|-------------|
| title test | Navigates to login page, asserts page title matches exactly |
| valid login test | Fills credentials, submits, asserts success heading, clicks logout |
| invalid username test | Fills invalid username, asserts error via `#error` locator |
| invalid password test | Fills invalid password, asserts error via `#error` locator |

---

### 6. Codegen Example
**Test File:** `tests/login-codegen.spec.ts` (1 test)

Auto-generated test using `npx playwright codegen`. Demonstrates the code generation workflow - records browser interactions and produces test code automatically.

```typescript
test('test', async ({ page }) => {
  await page.goto('https://practicetestautomation.com/practice-test-login/');
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('student');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('Password123');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('heading', { name: 'Logged In Successfully' })).toBeVisible();
  await page.getByRole('link', { name: 'Log out' }).click();
});
```

---

### 7. Role-Based Locator Examples
**Test File:** `tests/locators-role-based.spec.ts` (3 tests)

Demonstrates various `getByRole()` locator strategies on an external practice site (`testautomationpractice.blogspot.com`).

| Test | Locators Demonstrated |
|------|----------------------|
| title test | `page.goto()`, `expect(page).toHaveTitle(/regex/)` |
| link test | `getByRole("link", { name })`, `getByRole("heading", { name })` |
| getRoleTest | `getByRole("button")`, `getByRole("textbox")`, `getByRole("checkbox")`, `getByRole("link")`, `getByText()`, chained `locator().getByRole()` |

**Locator types covered in getRoleTest:**

```typescript
// Button
page.getByRole("button", { name: "Primary Action" })
page.getByRole("button", { name: "Toggle Button" })
page.getByRole("button", { name: "Div with button role" })

// Textbox
page.getByRole("textbox", { name: "Username:" })
page.getByRole("textbox", { name: "Password:" })

// Checkbox
page.getByRole("checkbox", { name: "Accept terms" })

// Text
page.getByText("This is an important alert")

// Chained locator (scoped within a parent element)
page.locator("#role-locators").getByRole("link", { name: "Home" })
page.locator("#role-locators").getByRole("link", { name: "Products" })
page.locator("#role-locators").getByRole("link", { name: "Contact" })
```

---

### 8. Basic Examples (JS & TS)
**TypeScript:** `tests/example.spec.ts` (2 tests) - With detailed learning comments explaining `test`, `expect`, `async/await`, `page` fixture, and `getByRole()`.

**JavaScript:** `tests/example.spec.js` (2 tests) - Same tests in CommonJS format using `require()`.

| Test | Description |
|------|-------------|
| has title | Navigate to playwright.dev, assert title matches `/Playwright/` |
| get started link | Click "Get started" link, assert "Installation" heading visible |

---

### 9. CI/CD with GitHub Actions
**Workflow:** `.github/workflows/playwright.yml`

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test
    - uses: actions/upload-artifact@v4
      if: ${{ !cancelled() }}
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

**Key points:**
- Triggers on push and pull request to `main` / `master`
- Uses `npm ci` for clean reproducible installs
- Uploads HTML report as artifact even if tests fail (`!cancelled()`)
- 30-day artifact retention
- 60-minute timeout

---

### 10. Custom Fixtures (`test.extend()`)
**Fixture:** `tests/fixtures/loginFixture.ts`

Custom fixtures extend Playwright's built-in fixtures using `test.extend()`. Instead of manually creating page objects in every test, the fixture injects them automatically.

**How it works:**

```typescript
// Define the fixture type
type LoginFixtures = {
  loginPage: LoginPage;
};

// Extend the base test
export const test = base.extend<LoginFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);  // SETUP: runs before each test
    await use(loginPage);                   // Hands the object to the test
    // TEARDOWN: cleanup code would go here (runs after each test)
  },
});
```

**Before vs After:**

```typescript
// WITHOUT custom fixtures — repeated setup in every test
test("login", async ({ page }) => {
  const loginPage = new LoginPage(page);  // manual setup
  await loginPage.login(username, password);
});

// WITH custom fixtures — loginPage is injected automatically
test("login", async ({ loginPage }) => {
  await loginPage.login(username, password);  // already created!
});
```

**Test File:** `tests/login-custom-fixture.spec.ts` (3 tests)

Imports the custom `test` and `expect` from `fixtures/loginFixture.ts` instead of `@playwright/test`.

| Test | Description |
|------|-------------|
| fixture-based valid login test | Injected `loginPage` → login → verify success |
| fixture-based invalid username test | Injected `loginPage` → login with bad username → verify error |
| fixture-based invalid password test | Injected `loginPage` → login with bad password → verify error |

---

### 11. Storage State / Auth Reuse
**Test File:** `tests/login-storage-state.spec.ts` (3 tests)

Storage state saves the browser's cookies and localStorage to a JSON file after logging in once. Subsequent tests load that file to skip the login step entirely.

**How it works:**

```typescript
// Step 1: Login and SAVE the auth state
await context.storageState({ path: "tests/data/.auth/state.json" });

// Step 2: Create a new context with the SAVED state — already authenticated
const context = await browser.newContext({ storageState: "tests/data/.auth/state.json" });
const page = await context.newPage();
// No login needed — cookies/localStorage are restored
```

**Production setup in playwright.config.ts** (illustrative — this repo self-contains the demo with `test.describe.serial()`):

```typescript
projects: [
  // Setup project logs in and saves state
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  // Test projects depend on setup and reuse the saved state
  {
    name: 'chromium',
    dependencies: ['setup'],
    use: { storageState: 'tests/data/.auth/state.json' },
  },
]
```

**Self-contained demo uses `test.describe.serial()`** to ensure tests run in order:

| Test | Description |
|------|-------------|
| step 1: login and SAVE storage state | Logs in, saves cookies/localStorage to `tests/data/.auth/state.json` |
| step 2: REUSE storage state — skip login | Creates new context from saved state, verifies session restored |
| step 3: verify saved state file exists | Reads the JSON file, inspects cookies and origins arrays |

---

### 12. Global Setup & Teardown
**Setup:** `tests/global/globalSetup.ts`
**Teardown:** `tests/global/globalTeardown.ts`
**Test File:** `tests/login-global-setup.spec.ts` (3 tests)

Global setup runs **once before ALL test files** across ALL projects (unlike `beforeAll` which is per-file). Global teardown runs **once after ALL test files** finish.

**Configuration in playwright.config.ts:**

```typescript
export default defineConfig({
  globalSetup: './tests/global/globalSetup.ts',
  globalTeardown: './tests/global/globalTeardown.ts',
  // ...
});
```

**Global setup function:**

```typescript
import type { FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  // Load .env, seed database, start services, etc.
  dotenv.config({ path: envPath });
  process.env.GLOBAL_SETUP_TIMESTAMP = new Date().toISOString();
  console.log("[Global Setup] Environment loaded successfully.");
}
export default globalSetup;
```

**Comparison: `beforeAll` vs `globalSetup`:**

| Feature | `test.beforeAll()` | `globalSetup` |
|---------|-------------------|---------------|
| Scope | Per test file | Entire test suite |
| Runs | Once per file | Once total |
| Access to | Playwright fixtures | FullConfig object |
| Defined in | Test files | Separate `.ts` file |
| Use case | File-level setup | Suite-level setup |

| Test | Description |
|------|-------------|
| global setup demo — env vars loaded by setup | Reads env vars that global setup would have loaded |
| global setup demo — valid login using global env | Uses global env data for login flow |
| global setup demo — shared timestamp from setup | Checks `GLOBAL_SETUP_TIMESTAMP` set by global setup |

---

### 13. JSON / CSV Test Data Reader
**JSON Utility:** `tests/utils/jsonReader.ts`
**CSV Utility:** `tests/utils/csvReader.ts`
**Data Files:** `tests/data/login-data.json`, `tests/data/login-data.csv`

Two alternative data readers for structured test data.

**JSON Reader — generic typed function:**

```typescript
export function readJson<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content) as T;
}

// Usage with TypeScript interface
interface LoginData {
  url: string;
  valid: { username: string; password: string; expectedMessage: string };
  invalid: { username: string; password: string; expectedUsernameError: string; expectedPasswordError: string };
}
const data = readJson<LoginData>("tests/data/login-data.json");
console.log(data.valid.username); // "student" — with full type safety
```

**JSON data file** (`tests/data/login-data.json`):

```json
{
  "url": "https://practicetestautomation.com/practice-test-login/",
  "valid": {
    "username": "student",
    "password": "Password123",
    "expectedMessage": "Logged In Successfully"
  },
  "invalid": {
    "username": "invaliduser",
    "password": "invalidpassword",
    "expectedUsernameError": "Your username is invalid!",
    "expectedPasswordError": "Your password is invalid!"
  }
}
```

**CSV Reader — header-based parsing:**

```typescript
export function readCsv(filePath: string): Record<string, string>[] {
  // First row = headers, subsequent rows = data
  // Returns array of objects: [{ username: "student", password: "...", ... }, ...]
}
```

**CSV data file** (`tests/data/login-data.csv`):

```csv
username,password,expectedResult,expectedMessage
student,Password123,success,Logged In Successfully
invaliduser,Password123,error,Your username is invalid!
student,invalidpassword,error,Your password is invalid!
```

**Comparison: JSON vs CSV vs .properties:**

| Feature | JSON | CSV | .properties |
|---------|------|-----|-------------|
| Nested data | Yes | No | No (flat only) |
| Arrays | Yes | Rows as array | No |
| Type safety | Via generics | No | No |
| Editing | Text editor | Excel/Sheets | Text editor |
| Best for | Structured config | Tabular test cases | Simple key-value pairs |

**Test File:** `tests/login-data-json.spec.ts` (3 tests)

| Test | Description |
|------|-------------|
| json-based valid login test | Login with `data.valid.username`, assert `data.valid.expectedMessage` |
| json-based invalid username test | Login with `data.invalid.username`, assert error |
| json-based invalid password test | Login with `data.invalid.password`, assert error |

**Test File:** `tests/login-data-csv.spec.ts` (3 tests)

Uses a `for` loop over CSV rows for **parameterized testing** — one data file drives multiple tests.

| Test | Description |
|------|-------------|
| csv-based login: student / success | Row 1: valid login, assert success heading |
| csv-based login: invaliduser / error | Row 2: invalid username, assert error |
| csv-based login: student / error | Row 3: invalid password, assert error |

---

### 14. Test Data Factory (`@faker-js/faker`)
**Utility:** `tests/utils/testDataFactory.ts`
**Test File:** `tests/login-data-faker.spec.ts` (4 tests)

Generates dynamic, random test data on every run using the faker library. Unlike static data files, faker produces unique values each time — catching edge cases and avoiding stale test data.

**Exported Functions:**

```typescript
export function generateUserData(): UserData
// Returns: { firstName, lastName, username, email, password, phone }

export function generateAddressData(): AddressData
// Returns: { street, city, state, zipCode, country }

export function generateRandomString(length: number): string
// Returns: random alphanumeric string of given length

export function generateRandomNumber(min: number, max: number): number
// Returns: random integer within range
```

**Example output (different every run):**

```
Generated User Data:
  First Name: Marcus
  Last Name:  Thompson
  Username:   marcus_thompson_42
  Email:      marcus.thompson@example.com
  Password:   xK9#mP2vLq8n
  Phone:      (555) 123-4567
```

**Test scenarios:**

| Test | Description |
|------|-------------|
| faker-based invalid login — random username | Random username always rejected → tests app rejects unknown users |
| faker-based invalid login — random password | Valid user + random password → tests app rejects wrong passwords |
| faker-based invalid login — random string boundary test | 100-char random strings → tests input boundary handling |
| faker-based demo — log generated data | Generates full user profile, verifies all fields are non-empty |

---

### 15. Test Tagging & Filtering (`@smoke`, `@sanity`, `@regression`)
**Test File:** `tests/login-tags.spec.ts` (9 tests)

Tags let you run a targeted subset of your test suite without creating separate test files for each category. A single test can carry multiple tags if it belongs to more than one category.

**Tag definitions:**

| Tag | Purpose | When to run |
|-----|---------|-------------|
| `@smoke` | Minimal tests verifying the app is alive and the most critical path works | After every deployment — fast gate |
| `@sanity` | End-to-end verification of a specific feature after a change or bug fix | After a targeted code change |
| `@regression` | Full coverage — every scenario and edge case | Before every release / sprint sign-off |

**Syntax — single tag:**

```typescript
test("smoke: login page loads successfully", { tag: "@smoke" }, async ({ page }) => {
  await page.goto(LOGIN_URL);
  await expect(page).toHaveTitle("Test Login | Practice Test Automation");
});
```

**Syntax — multiple tags** (test belongs to more than one category):

```typescript
test(
  "smoke: valid login works",
  { tag: ["@smoke", "@sanity", "@regression"] },
  async ({ page }) => {
    // This is the single most critical test — it must always be in every run.
  }
);
```

**Running filtered subsets:**

```bash
# Run only smoke tests (fastest — 2 tests)
npx playwright test --grep "@smoke"

# Run only sanity tests (4 tests)
npx playwright test --grep "@sanity"

# Run full regression suite (7 tests)
npx playwright test --grep "@regression"

# Run smoke OR sanity
npx playwright test --grep "@smoke|@sanity"

# Run everything EXCEPT regression (quick check)
npx playwright test --grep-invert "@regression"

# Combine with a specific browser
npx playwright test --grep "@smoke" --project=chromium
```

**Tag overlap — how tests are distributed:**

| Test | @smoke | @sanity | @regression |
|------|--------|---------|-------------|
| smoke: login page loads | ✓ | | |
| smoke: valid login works | ✓ | ✓ | ✓ |
| sanity: form elements present | | ✓ | |
| sanity: invalid username error | | ✓ | ✓ |
| sanity: invalid password error | | ✓ | ✓ |
| regression: login and logout flow | | | ✓ |
| regression: empty username rejected | | | ✓ |
| regression: empty password rejected | | | ✓ |
| regression: both fields empty rejected | | | ✓ |
| **Total tests** | **2** | **4** | **7** |

---

### 16. Logger Utility (Winston + Playwright Built-ins)
**Utility:** `tests/utils/logger.ts`
**Test File:** `tests/login-logging.spec.ts` (6 tests)
**Log Output:** `logs/test-run.log`, `logs/errors.log` (auto-created, gitignored)

This topic covers every logging mechanism available in a Playwright framework.

**Log Levels (most to least severe):**

| Level | Use case |
|-------|---------|
| `error` | Something broke — test or app failed critically |
| `warn` | Unexpected but non-fatal — slow response, deprecated feature |
| `info` | Normal test flow — navigation, actions, verifications |
| `debug` | Detailed values and intermediate states |
| `verbose` | Fine-grained tracing — every small step |

**Winston transports (where logs go):**

| Transport | Output | Purpose |
|-----------|--------|---------|
| Console | Terminal (colorized) | Real-time during test run |
| `logs/test-run.log` | Plain text file | Full run history for post-mortem analysis |
| `logs/errors.log` | Plain text file (errors only) | Quick failure scan without reading all noise |

**Controlling verbosity:**

```bash
# Default (info and above)
npx playwright test tests/login-logging.spec.ts

# Show debug and verbose logs
LOG_LEVEL=debug npx playwright test tests/login-logging.spec.ts

# Playwright's own internal protocol logs
DEBUG=pw:api npx playwright test tests/login-logging.spec.ts
DEBUG=pw:browser npx playwright test tests/login-logging.spec.ts
DEBUG=pw:* npx playwright test tests/login-logging.spec.ts
```

**6 logging techniques demonstrated:**

| Test | Technique | What it captures |
|------|-----------|-----------------|
| winston logger levels demo | `logger.info/warn/error/debug/verbose()` | All log levels with timestamps to terminal + files |
| test.step() structured steps | `test.step("name", async () => { ... })` | Groups actions into named steps visible in HTML report |
| capture browser console messages | `page.on("console", msg => ...)` | Browser-side `console.log/warn/error` output |
| capture browser page errors | `page.on("pageerror", error => ...)` | Uncaught JavaScript exceptions in the browser |
| network request/response logging | `page.on("request/response", ...)` | Every HTTP request URL, method, and status code |
| attach log summary to HTML report | `testInfo.attach("name", { body, contentType })` | Custom log embedded inside the HTML report |

---

### 17. Custom Reporter
**File:** `tests/reporters/customReporter.ts`
**Output:** `test-results/custom-report.json`, `test-results/custom-report.txt`

Implements Playwright's `Reporter` interface to hook into every stage of the test run and generate custom output — console summary, JSON file, and plain text file.

**Reporter lifecycle methods:**

| Method | When called | What it receives |
|--------|-------------|-----------------|
| `onBegin(config, suite)` | Once — run starts | Full config + root suite with all tests |
| `onTestBegin(test)` | Each test starts | `TestCase` with name, file, location |
| `onTestEnd(test, result)` | Each test ends | `result.status`, `result.duration`, `result.errors` |
| `onEnd(result)` | Once — run finishes | `result.status`: "passed" / "failed" / "interrupted" |

**Registering in playwright.config.ts:**

```typescript
reporter: [
  ['html'],
  ['./tests/reporters/customReporter.ts'],          // path to the class file
  ['allure-playwright', { outputFolder: 'allure-results' }],
],
```

**JSON report structure (`test-results/custom-report.json`):**

```json
{
  "suiteName": "Playwright Test Suite",
  "startTime": "2024-01-15T10:30:00.000Z",
  "endTime": "2024-01-15T10:30:45.000Z",
  "durationMs": 45000,
  "total": 10,
  "passed": 9,
  "failed": 1,
  "skipped": 0,
  "tests": [
    { "name": "valid login test", "file": "tests/login-basic.spec.ts",
      "project": "chromium", "status": "passed", "duration": 1234 }
  ]
}
```

---

### 18. Allure Reporter
**Package:** `allure-playwright` + `allure-js-commons`
**Test File:** `tests/login-reporting.spec.ts` (4 tests)
**Raw data:** `allure-results/` (auto-created, one JSON file per test)
**HTML report:** `allure-report/` (generated on demand)

Allure is an open-source reporting framework that produces rich, interactive HTML reports with metadata, steps, attachments, and filtering by feature/severity.

**Commands:**

```bash
# Run tests and generate allure raw data
npx playwright test

# Generate the HTML report from raw data
npx allure generate allure-results --clean -o allure-report

# Open the report in a browser
npx allure open allure-report

# One-step: generate + open (serves on a local port)
npx allure serve allure-results
```

**Allure metadata annotations (from `allure-js-commons`):**

```typescript
await feature("Authentication");              // Product feature grouping
await story("User logs in with valid creds"); // User story grouping
await severity("critical");                   // blocker | critical | normal | minor | trivial
await description("What this test verifies"); // Human-readable purpose
await label("component", "LoginPage");        // Arbitrary key-value label
await link("https://jira.company.com/PROJ-1", "Jira ticket", "issue");
await attachment("screenshot.png", bytes, "image/png"); // Embed screenshot
await attachment("data.json", json, "application/json"); // Embed JSON
```

**What shows in the Allure report:**

| Panel | Shows |
|-------|-------|
| Overview | Total / passed / failed / skipped pie chart, trend graph |
| Suites | Tests grouped by file → describe block → test name |
| Features | Tests grouped by `feature()` annotation |
| Stories | Tests grouped by `story()` annotation |
| Severity | Tests filtered by blocker / critical / normal / minor / trivial |
| Test detail | Steps (collapsible), attachments (screenshots, JSON), metadata labels |

**Allure vs Playwright HTML report:**

| Feature | Playwright HTML | Allure |
|---------|----------------|--------|
| Built-in | Yes | No (needs install) |
| Steps view | Yes | Yes |
| Screenshots | Yes | Yes |
| Feature/Story grouping | No | Yes |
| Severity filtering | No | Yes |
| Trend over multiple runs | No | Yes (with history) |
| Jira/ticket links | No | Yes |

---

### 19. API Testing (`request` context)
**File:** `tests/api-request.spec.ts` (7 tests)
**Target API:** JSONPlaceholder (`https://jsonplaceholder.typicode.com`)

Playwright's built-in `request` fixture (APIRequestContext) lets you make HTTP calls directly — without opening a browser. API tests are 10-50x faster than UI tests and are used to verify backend logic, set up test data, and contract-test endpoints.

**Methods available:**

```typescript
request.get(url, options?)     // GET request
request.post(url, options?)    // POST request
request.put(url, options?)     // PUT request
request.delete(url, options?)  // DELETE request
```

**Key assertions:**

```typescript
expect(response.ok()).toBeTruthy();          // status is 2xx
expect(response.status()).toBe(200);         // exact status code
expect(response.headers()["content-type"]).toContain("application/json");
const body = await response.json();          // parse JSON body
expect(body).toHaveProperty("id", 1);
```

**Tests covered:**

| Test | What it verifies |
|------|-----------------|
| GET /posts/1 | Status 200, response shape, data types |
| GET /posts | Returns array of 100 items |
| GET /posts?userId=1 | Query param filtering — all returned items match filter |
| POST /posts | 201 Created, echoed body fields, assigned id |
| Check headers | Content-Type is `application/json` |
| GET /posts/9999 | 404 Not Found, `response.ok()` is false |
| API + UI combined | Fetch data via API first, then verify in browser UI |

---

### 20. Network Mocking / Interception (`page.route()`)
**File:** `tests/login-network-mock.spec.ts` (6 tests)

`page.route(pattern, handler)` intercepts matching requests before they reach the server. The handler decides what to do with each intercepted request.

**Three interception modes:**

```typescript
// FULFILL — return a fake response, server never contacted
route.fulfill({ status: 200, contentType: "application/json", body: "..." });

// ABORT — cancel the request entirely (browser gets network error)
route.abort();

// CONTINUE — let the request proceed, optionally with modifications
route.continue({ headers: { ...existingHeaders, "X-Custom": "value" } });
```

**URL patterns:**

```typescript
page.route("**/api/login", handler);          // glob — matches any URL containing /api/login
page.route(/.*\/api\/login.*/, handler);       // regex
page.route("https://example.com/api", handler); // exact URL
```

**Tests covered:**

| Test | Technique | Purpose |
|------|-----------|---------|
| Block images | `abort()` on image/font/stylesheet | Speed up page load by skipping non-functional resources |
| Mock JSON response | `fulfill()` with custom JSON | Return controlled data without hitting the real server |
| Simulate 500 error | `fulfill({ status: 500 })` | Test UI error handling without needing a broken server |
| Block a specific URL | `abort()` on analytics URL | Prevent tracking/ad calls during tests |
| Inject custom headers | `continue()` with extra headers | Simulate authenticated requests |
| Log all requests | `page.on("request")` (read-only) | Verify which endpoints were called during a flow |

---

### 21. Visual / Screenshot Testing (`toHaveScreenshot()`)
**File:** `tests/login-visual.spec.ts` (6 tests)
**Baselines:** `tests/login-visual.spec.ts-snapshots/` (auto-created, committed to repo)

Visual testing catches regressions that functional tests miss — shifted layouts, color changes, font rendering differences, overlapping elements.

**How baselines work:**

```bash
# First run — creates baseline images (test passes)
npx playwright test tests/login-visual.spec.ts --update-snapshots

# Subsequent runs — compares against baseline (fails if pixels differ)
npx playwright test tests/login-visual.spec.ts

# After intentional UI change — regenerate baselines
npx playwright test tests/login-visual.spec.ts --update-snapshots
```

**Full page screenshot:**
```typescript
await expect(page).toHaveScreenshot("login-page.png", {
  fullPage: true,        // captures content below the fold too
  maxDiffPixels: 100,    // allow up to 100 pixels to differ (OS rendering variance)
});
```

**Element-level screenshot:**
```typescript
const section = page.locator("#login");
await expect(section).toHaveScreenshot("login-form.png", { maxDiffPixels: 50 });
```

**Masking dynamic content:**
```typescript
await expect(page).toHaveScreenshot("page-masked.png", {
  mask: [ page.locator("footer") ],   // replace footer with a solid colour block
  maskColor: "#FF00FF",
});
```

**Tests covered:**

| Test | What is captured |
|------|----------------|
| Login page default | Full page baseline of the empty login form |
| Form component | Element screenshot of `#login` section only |
| Form filled state | Form after username/password entered — password shows as dots |
| Post-login success | Full page after successful login |
| Error state | Error message element after failed login |
| Masked dynamic content | Full page with footer masked to ignore dynamic changes |

---

### 22. Parameterized Tests
**File:** `tests/login-parameterized.spec.ts` (17 tests across 4 approaches)

Parameterized testing runs the same test logic with different inputs, generating one independent test case per data set. Adding a new scenario means adding one entry to a data array — no new test function needed.

**4 approaches demonstrated:**

**Approach 1 — Simple array of objects** (4 tests):
```typescript
const scenarios = [
  { name: "valid",    username: "student",  password: "Password123", expectedStatus: "success" },
  { name: "bad user", username: "wronguser", password: "Password123", expectedStatus: "error"   },
  // ...
];
for (const s of scenarios) {
  test(`parameterized login: ${s.name}`, async ({ page }) => { ... });
}
```

**Approach 2 — `test.describe` + loop** (6 tests, grouped in report):
```typescript
test.describe("boundary: edge cases", () => {
  for (const scenario of boundaryScenarios) {
    test(`boundary: ${scenario.label}`, async ({ page }) => { ... });
  }
});
```
Tests in a describe block appear grouped in the HTML report under one collapsible heading.

**Approach 3 — Nested loops** (4 tests — 2 × 2 combinations):
```typescript
for (const username of usernames) {
  for (const password of passwords) {
    test(`nested: ${username} + ${password}`, async ({ page }) => { ... });
  }
}
```
Generates all combinations automatically — useful for cross-product scenarios.

**Approach 4 — Data table** (3 tests — mirrors pytest's `@pytest.mark.parametrize`):
```typescript
const dataTable: [string, string, string, string][] = [
  ["student",  "Password123", "success", "Logged In Successfully"],
  ["baduser",  "Password123", "error",   "Your username is invalid!"],
];
for (const [username, password, outcome, text] of dataTable) {
  test(`table: [${username}] → ${outcome}`, async ({ page }) => { ... });
}
```

**pytest equivalent:**
```python
@pytest.mark.parametrize("username,password,outcome,text", [
  ("student", "Password123", "success", "Logged In Successfully"),
  ("baduser", "Password123", "error",   "Your username is invalid!"),
])
def test_login(page, username, password, outcome, text):
    ...
```

### 23. Soft Assertions (`expect.soft()`)

**File:** `tests/soft-assertions.spec.ts` (3 tests)

A regular `expect()` failure aborts the test immediately, so you only see the first problem. `expect.soft()` records the failure and keeps going, then reports every collected failure at the end. The test still fails if any soft assertion failed.

```typescript
// Hard — stops the test on failure
await expect(page.locator("#error")).toBeVisible();

// Soft — continues, reports all failures together
await expect.soft(page.locator("#error")).toBeVisible();
await expect.soft(page.locator("#error")).toContainText("Your username is invalid!");
await expect.soft(page.getByRole("heading", { name: "Logged In Successfully" })).not.toBeVisible();
```

| Test | What it shows |
|------|---------------|
| verify multiple page elements at once | 10 soft checks on one page — a single run reveals every failure |
| validate all login form error messages | soft checks for visibility, text, and absence of the success heading |
| mixed hard and soft in one test | hard assertion for the prerequisite, soft assertions for the details |

Use a hard assertion for a prerequisite (did the page load at all?) and soft assertions for independent detail checks.

---

### 24. Parallel vs Serial Execution

**File:** `tests/parallel-serial.spec.ts` (10 tests)

Playwright runs **files** in parallel, but tests **inside a file** are sequential by default. `test.describe.serial()` and `test.describe.configure()` change that per block.

| Mode | Order guaranteed | Skips remaining tests on failure | Speed |
|------|------------------|----------------------------------|-------|
| default | Yes (within a block) | No | Moderate |
| `test.describe.serial()` | Yes | Yes | Same as default |
| `test.describe.configure({ mode: "parallel" })` | No | No | Fastest |

```typescript
test.describe.serial("serial: ordered dependent steps", () => {
  test("step 1: navigate", async ({ page }) => { /* ... */ });
  test("step 2: fill form", async ({ page }) => { /* ... */ });
  test("step 3: submit", async ({ page }) => { /* ... */ });
});

test.describe("parallel block: independent tests", () => {
  test.describe.configure({ mode: "parallel" });
  test("check A", async ({ page }) => { /* ... */ });
  test("check B", async ({ page }) => { /* ... */ });
});
```

The suite contains 3 default, 3 serial, and 4 parallel tests. `fullyParallel: true` in the config parallelises tests across files; serial blocks still run in order.

---

### 25. Per-Test Retry Configuration

**File:** `tests/retry-config.spec.ts` (6 tests)

Global retries live in `playwright.config.ts` (`retries: process.env.CI ? 2 : 0`). A `describe` block can override that for its own tests with `test.describe.configure({ retries: N })`.

```typescript
test.describe("individual: stable tests — 0 retries", () => {
  test.describe.configure({ retries: 0 }); // a failure here is a real bug
  test("smoke", async ({ page }) => { /* ... */ });
});

test.describe("individual: network-dependent tests — 2 retries", () => {
  test.describe.configure({ retries: 2 }); // external site may hiccup
  test("external page", async ({ page }) => { /* ... */ });
});
```

Retries re-run the **whole** test in a fresh browser context; the test passes if any attempt passes. Inside a test, `testInfo.retry` (0-based) and `testInfo.retries` let you branch per attempt — for example attaching a screenshot only on retries:

```typescript
test("retry-aware", async ({ page }, testInfo) => {
  if (testInfo.retry > 0) {
    await testInfo.attach(`retry-${testInfo.retry}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
});
```

Blocks: 2 describe-level tests with 2 retries, 1 stable test with 0, 1 network test with 2, and 2 retry-aware tests with 1 retry.

---

### 26. Dialog Handling — alert, confirm, prompt

**File:** `tests/interactions-dialogs.spec.ts` (6 tests)

Native JS dialogs block the page. Register the handler **before** the action that opens the dialog, or the test hangs.

| Method | Scope |
|--------|-------|
| `page.on("dialog", handler)` | Every dialog for the lifetime of the page |
| `page.once("dialog", handler)` | The next dialog only |

`dialog.accept()` clicks OK; `dialog.accept("text")` fills a prompt; `dialog.dismiss()` clicks Cancel. Metadata: `type()`, `message()`, `defaultValue()`.

```typescript
page.once("dialog", async (dialog) => {
  expect(dialog.type()).toBe("confirm");
  expect(dialog.message()).toBe("Press a button!");
  await dialog.accept();
});

await page.locator("#confirmBtn").click();
await expect(page.locator("#demo")).toContainText("You pressed OK!");
```

| Test | Dialog | Action |
|------|--------|--------|
| accept a simple alert | `alert` | accept, verify message |
| accept a confirmation dialog | `confirm` | accept → "You pressed OK!" |
| dismiss a confirmation dialog | `confirm` | dismiss → "You pressed Cancel!" |
| enter text in a prompt | `prompt` | `accept("Playwright User")` |
| dismiss a prompt | `prompt` | dismiss → cancellation message |
| `page.on()` handles multiple dialogs | alert + confirm | one persistent handler, asserts both captured |

---

### 27. Tabs & Windows

**File:** `tests/interactions-tabs-windows.spec.ts` (4 tests)

A `BrowserContext` can hold many `Page` objects (tabs). Start listening **before** the click that opens the tab.

```typescript
// Context-level: resolves when any new page is created in this context
const newPagePromise = context.waitForEvent("page");
await page.getByRole("button", { name: "New Tab" }).click();
const newTab = await newPagePromise;
await newTab.waitForLoadState("domcontentloaded");

// Page-level alternative
const popupPromise = page.waitForEvent("popup");
```

`context.pages()` lists every open tab, `page.bringToFront()` switches focus back, and `newTab.close()` cleans up. Pages in one context share cookies/storage; a new context is isolated.

| Test | What it covers |
|------|----------------|
| open new tab and interact with it | `context.waitForEvent("page")`, URL/title assertions, close |
| switch between original and new tab | `bringToFront()`, `toHaveURL()` on the original page |
| handle multiple popup windows | two simultaneous `waitForEvent("page")` promises, `context.pages()` |
| `page.waitForEvent("popup")` | page-scoped listener for `window.open()` / `target="_blank"` |

---

### 28. iframe Handling — `frameLocator()`

**File:** `tests/interactions-iframe.spec.ts` (4 tests)

An iframe has its own DOM, so `page.getByRole(...)` cannot see inside it. `frameLocator()` scopes all subsequent locators to the frame.

```typescript
const frame = page.frameLocator("#mce_0_ifr");
await expect(frame.locator("#tinymce")).toBeVisible();

// Nested iframes
page.frameLocator("iframe.outer").frameLocator("iframe.inner");
```

`page.frames()` returns every frame (including the main frame); a `Frame` object supports `evaluate()` for running JS inside the iframe. Prefer `frameLocator()` for interactions and `Frame` when you need script execution.

| Test | What it covers |
|------|----------------|
| read content inside an iframe | `frameLocator("#mce_0_ifr")` + `innerText()` |
| assert content and attributes inside iframe | class attribute and `p` count inside the frame |
| interact with main page and iframe together | main-page heading plus iframe editor in one test |
| use Frame object for `evaluate()` | `page.frames()`, URL matching, `frame.evaluate()` |

---

### 29. Drag & Drop

**File:** `tests/interactions-drag-drop.spec.ts` (4 tests)

| Method | Use when |
|--------|----------|
| `locator.dragTo(target)` | Default choice — calculates source/target centres |
| `page.dragAndDrop(sourceSelector, targetSelector)` | Selector-based, same behaviour |
| Manual `page.mouse.move/down/up` | Only for libraries that need a real trajectory |

`dragTo()` accepts `sourcePosition` / `targetPosition` (pixels from the element's top-left) when the grab/drop point matters:

```typescript
await draggable.dragTo(droppable, {
  sourcePosition: { x: dragBox.width / 2, y: dragBox.height / 2 },
  targetPosition: { x: dropBox.width / 2, y: dropBox.height / 2 },
});
```

**jQuery UI caveat:** the practice page uses jQuery UI draggable, which ignores raw `mouse.move` sequences. Use `dragTo()` / `dragAndDrop()` there.

| Test | Method |
|------|--------|
| basic drag to target | `locator.dragTo()` |
| selector-based drag | `page.dragAndDrop()` |
| explicit source/target positions | `dragTo()` + `sourcePosition`/`targetPosition` |
| verify states before and after | assertions on droppable text before and after the drag |


---

## Locator Strategies Used

```typescript
// Role-based (recommended - accessible and stable)
page.getByRole("textbox", { name: "Username" })
page.getByRole("button", { name: "Submit" })
page.getByRole("heading", { name: "Logged In Successfully" })
page.getByRole("link", { name: "Log out" })
page.getByRole("checkbox", { name: "Accept terms" })

// CSS / ID selectors
page.locator("#error")

// Text-based
page.getByText("Your username is invalid!")

// Chained / Scoped locators (parent + child)
page.locator("#role-locators").getByRole("link", { name: "Home" })
page.locator("#error").getByText("Your username is invalid!")
```

---

## Assertion Patterns Used

```typescript
// Page title
await expect(page).toHaveTitle(/Playwright/)
await expect(page).toHaveTitle("Test Login | Practice Test Automation")

// Element visibility
await expect(element).toBeVisible()

// Text content
await expect(element).toContainText("expected text")

// Input value
await expect(element).toHaveValue("text")
```

---

## Playwright Fixtures & Hooks Used

### Fixtures

Fixtures are objects that Playwright creates for each test. They provide isolated test environments.

| Fixture | Description | Usage |
|---------|-------------|-------|
| `page` | A single browser tab/page context. Created fresh for each test. | `test("example", async ({ page }) => { ... })` |
| `context` | Browser context (implicit). Shared cookies, storage within a context. | Used implicitly — each `page` belongs to a context |
| `browser` | Browser instance (implicit). Shared across tests in a project. | `login-storage-state.spec.ts` — to create context with saved state |
| `request` | API request context for making HTTP calls without a browser. | `api-request.spec.ts` — REST calls, no browser |
| `loginPage` | Custom fixture from this repo — a ready-made `LoginPage` | `login-custom-fixture.spec.ts` |

### Hooks

| Hook | Description | Used In |
|------|-------------|---------|
| `test.beforeAll()` | Runs **once** before all tests in the file (per worker) | `login-data-env`, `login-page-object-model`, `login-custom-fixture`, `login-global-setup`, `login-tags`, `login-logging`, `login-reporting` |
| `test.beforeEach()` | Runs before **each** test | Used by `login-visual.spec.ts` to skip non-Chromium projects |
| `test.afterEach()` | Runs after **each** test | Not demonstrated yet |
| `test.afterAll()` | Runs **once** after all tests in the file | `login-logging.spec.ts` |

```typescript
// Fixture injection - page is created per test automatically
test("example", async ({ page }) => { ... });

// beforeAll hook - runs once before all tests in file
test.beforeAll(() => {
  loadEnv();
});
```

---

## Test Files Summary

| File | Tests | Pattern | Data Source |
|------|-------|---------|-------------|
| `example.spec.ts` | 2 | Basic inline | Hardcoded |
| `example.spec.js` | 2 | Basic inline (CommonJS) | Hardcoded |
| `login-basic.spec.ts` | 4 | Basic inline | Hardcoded |
| `login-codegen.spec.ts` | 1 | Codegen auto-generated | Hardcoded |
| `login-data-properties.spec.ts` | 3 | Data-driven | `.properties` file |
| `login-helper-function.spec.ts` | 2 | Helper function | `.properties` file |
| `login-data-env.spec.ts` | 3 | Data-driven | `.env` file |
| `login-page-object-model.spec.ts` | 3 | Page Object Model | `.env` file |
| `locators-role-based.spec.ts` | 3 | Role-based locators | Hardcoded |
| `login-custom-fixture.spec.ts` | 3 | Custom fixtures (`test.extend()`) | `.env` file |
| `login-storage-state.spec.ts` | 3 | Storage state / auth reuse | Hardcoded |
| `login-global-setup.spec.ts` | 3 | Global setup & teardown | `.env` file |
| `login-data-json.spec.ts` | 3 | Data-driven | `.json` file |
| `login-data-csv.spec.ts` | 3 | Data-driven (parameterized) | `.csv` file |
| `login-data-faker.spec.ts` | 4 | Test data factory (faker) | Random (generated) |
| `login-tags.spec.ts` | 9 | Smoke / Sanity / Regression tagging | `.env` file |
| `login-logging.spec.ts` | 6 | Logger utility — winston, steps, console, network, attach | `.env` file |
| `login-reporting.spec.ts` | 4 | Custom reporter + Allure annotations demo | `.env` file |
| `api-request.spec.ts` | 7 | API testing with `request` fixture | None (public API) |
| `login-network-mock.spec.ts` | 6 | Network mocking — fulfill, abort, continue | None |
| `login-visual.spec.ts` | 6 | Visual screenshot comparison | Hardcoded |
| `login-parameterized.spec.ts` | 17 | Parameterized tests — 4 approaches | Hardcoded arrays |
| `soft-assertions.spec.ts` | 3 | Soft assertions (`expect.soft()`) | Hardcoded |
| `parallel-serial.spec.ts` | 10 | Parallel vs serial execution modes | Hardcoded |
| `retry-config.spec.ts` | 6 | Per-test / per-describe retry config | Hardcoded |
| `interactions-dialogs.spec.ts` | 6 | Alert, confirm, prompt dialogs | Hardcoded |
| `interactions-tabs-windows.spec.ts` | 4 | Multiple tabs and popup windows | Hardcoded |
| `interactions-iframe.spec.ts` | 4 | iframe handling with `frameLocator()` | Hardcoded |
| `interactions-drag-drop.spec.ts` | 4 | Drag and drop — 3 methods | Hardcoded |
| **Total** | **134** | | |

Counts are per spec file. With the three browser projects the full run executes **402** tests (134 × 3). Files under `tutorials/` are outside `testDir` and run with their own config.

---

## Playwright Features & Capabilities Used

### Reporters

| Reporter | Status | Description |
|----------|--------|-------------|
| HTML Reporter | Active | Generates interactive HTML report in `playwright-report/`. View with `npx playwright show-report` |
| Custom Reporter | Done | `tests/reporters/customReporter.ts` → `test-results/custom-report.json` + `.txt` |
| Allure Reporter | Done | `allure-results/` → generate with `npx allure generate` → view with `npx allure open` |

### Trace Collection

Traces are collected **on first retry** (`trace: 'on-first-retry'`). A trace captures:
- Screenshots at each step
- DOM snapshots
- Network requests
- Console logs
- Source code of actions

View traces with: `npx playwright show-trace trace.zip`

### Auto-Waiting

Playwright automatically waits for elements to be actionable before performing actions:
- `click()` waits for the element to be visible, stable, enabled, and receiving events
- `fill()` waits for the element to be visible and editable
- `expect().toBeVisible()` retries until the assertion passes or times out

### Parallel Execution

- **Local:** Tests run in parallel across files (`fullyParallel: true`)
- **CI:** Tests run sequentially (`workers: 1`) for stability

### Multi-Browser Testing

All tests run across 3 browser engines via Playwright projects:
- **Chromium** — Desktop Chrome
- **Firefox** — Desktop Firefox
- **WebKit** — Desktop Safari

Exception: `login-visual.spec.ts` skips Firefox and WebKit because only Chromium/macOS baselines are committed. Run it with `--project=chromium` or `npm run test:visual`.

### Retry Logic

- **Local:** No retries (`retries: 0`) — failures are immediately visible during development
- **CI:** 2 retries (`retries: 2`) — handles flaky network/timing issues in CI

---

## Best Practices Implemented

- [x] **Role-based locators** over CSS selectors — accessible, stable, and recommended by Playwright
- [x] **Page Object Model** — encapsulates UI interactions for maintainability
- [x] **Environment variables** for sensitive data — credentials never hardcoded in test files
- [x] **Properties files** for test data separation — data and logic are decoupled
- [x] **Helper functions** to reduce code duplication — shared flows centralized
- [x] **Test isolation** — each test gets a fresh browser context; the only intentional shared-state demos are `describe.serial()` and storage-state reuse, and both are labelled
- [x] **Comprehensive comments** in example files — learning-friendly with explanations
- [x] **CI/CD integration** via GitHub Actions — automated test runs on push/PR
- [x] **HTML report generation** — visual test results for debugging
- [x] **Multi-browser testing** — tests verified across Chromium, Firefox, WebKit
- [x] **TypeScript for type safety** — catches errors at compile time
- [x] **Trace collection on retry** — automatic debugging data for failed tests
- [x] **Auto-waiting assertions** — no manual `sleep()` or `waitFor()` needed
- [x] **Multiple data sources** — `.env`, `.properties`, `.json`, `.csv`, and hardcoded approaches demonstrated
- [x] **Custom fixtures** — `test.extend()` for injecting pre-built page objects
- [x] **Storage state** — save and reuse auth sessions across tests
- [x] **Global setup/teardown** — suite-level one-time setup and cleanup
- [x] **Random test data** — faker-based dynamic data for each run
- [x] **Test tagging** — `@smoke`, `@sanity`, `@regression` with `--grep` filtering to run targeted subsets
- [x] **Structured logging** — Winston logger (console + file) combined with `test.step()`, browser console capture, page error capture, network logging, and report attachment
- [x] **Custom reporter** — implements Playwright `Reporter` interface to generate JSON + text summaries
- [x] **Allure reporter** — rich HTML report with feature/story grouping, severity, steps, and attachments
- [x] **API testing** — `request` fixture for REST API tests without a browser (GET, POST, headers, 404)
- [x] **Network mocking** — `page.route()` to fulfill, abort, or modify requests before they reach the server
- [x] **Visual testing** — `toHaveScreenshot()` for pixel-level comparison with baseline images and masking
- [x] **Parameterized tests** — 4 approaches: simple loop, describe+loop, nested loops, data table
- [x] **Soft assertions** — `expect.soft()` collects all failures before reporting, vs hard assertions that stop on first failure
- [x] **Parallel vs Serial** — `test.describe.serial()` and `test.describe.configure({ mode })` for execution order control
- [x] **Per-test retry config** — `test.describe.configure({ retries })` overrides global config per describe block
- [x] **Dialog handling** — `page.on("dialog")` and `page.once("dialog")` for alert, confirm, prompt
- [x] **Multiple tabs / windows** — `context.waitForEvent("page")` and `page.waitForEvent("popup")` to capture new tabs
- [x] **iframe handling** — `page.frameLocator()` to scope locators inside an iframe DOM
- [x] **Drag and drop** — `locator.dragTo()`, `page.dragAndDrop()`, and explicit `sourcePosition`/`targetPosition`
- [x] **Global setup/teardown wired** — `.env` is loaded once for the whole run and a shared timestamp is exposed to tests
- [x] **npm scripts** — aliases for the common commands (`npm test`, `npm run test:smoke`, `npm run allure:generate`, …)

---

## Reports & Outputs

| Output | Location | How to open |
|--------|----------|-------------|
| Playwright HTML report | `playwright-report/` | `npm run report` (`npx playwright show-report`) |
| Custom JSON summary | `test-results/custom-report.json` | Open in any editor |
| Custom text summary | `test-results/custom-report.txt` | `cat test-results/custom-report.txt` |
| Allure raw data | `allure-results/` | Input for `allure generate` |
| Allure HTML report | `allure-report/` | `npm run allure:generate`, then `npm run allure:open` |
| Winston logs | `logs/test-run.log`, `logs/errors.log` | `tail -f logs/test-run.log` |
| Traces (first retry) | `test-results/**/trace.zip` | `npx playwright show-trace <file>` |
| Visual baselines | `tests/login-visual.spec.ts-snapshots/` | Committed (Chromium/macOS) |
| Screenshots / diffs | `test-results/` | Open the folder |

The three reporters run simultaneously and each receives the same events. `playwright-report/`, `test-results/`, `allure-results/`, `allure-report/`, and `logs/` are gitignored.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Environment variable APP_URL is not set` | No `.env` file | `cp .env.example .env` |
| Global setup logs `Base URL: undefined` | `.env` missing when `globalSetup` ran | Create `.env`; it is loaded once for the whole run |
| `Executable doesn't exist …` / browser won't launch | Browsers not installed | `npm run install:browsers` (`npx playwright install`) |
| Visual tests skipped on Firefox/WebKit | Only Chromium baselines are committed | Expected — or regenerate per browser with `--update-snapshots` |
| Visual test fails after an intentional UI change | Baseline is outdated | `npx playwright test tests/login-visual.spec.ts --update-snapshots` |
| `allure: command not found` | Calling a global `allure` | Use `npx allure …` or `npm run allure:generate` |
| Allure report is empty | Tests not re-run after configuring the reporter, or raw data cleared | Re-run the tests, then generate |
| `No tests found` for `tutorials/` | Root config sets `testDir: './tests'` | `npm run test:tutorials` (uses `tutorials/playwright.config.ts`) |
| Intermittent failures on external sites | Public practice sites can be slow or rate-limit | Re-run; use `--project=chromium`; CI retries twice |

---

## Pending Topics

### Utilities

No utilities are pending — data readers, logging, custom reporter, and Allure are all implemented.

### Test Patterns

| # | Topic | Description |
|---|-------|-------------|
| 1 | Accessibility Testing (`@axe-core/playwright`) | Automated accessibility (a11y) checks using axe-core |

### Interaction Patterns

| # | Topic | Description |
|---|-------|-------------|
| 1 | File Upload & Download | Handle file uploads via `setInputFiles()` and download events |

### Advanced Configuration

| # | Topic | Description |
|---|-------|-------------|
| 1 | Database Utility | Connect to a database (PostgreSQL/MySQL) for test data setup/verification |

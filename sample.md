# Playwright Initialization Steps

This file lists the commands to initialize a Playwright project on macOS, with brief comments explaining each step.

---

## 1) (Optional) Create and activate a Python virtual environment
- Comment: Use a venv if you'll run Python alongside Node or want isolated Python packages.

```bash
# create a virtual environment in a directory named .venv
python3 -m venv .venv

# activate the venv for zsh
source .venv/bin/activate

# when done, deactivate
deactivate
```

---

## 2) Install Node.js (Homebrew recommended)
- Comment: Playwright uses Node; `brew` is the easiest on macOS. If you already have Node, skip this.

```bash
# install Homebrew if you don't have it (single-line installer)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# install Node.js
brew install node

# verify
node -v
npm -v
```

---

## 3) Initialize npm and install Playwright (JavaScript/TypeScript)
- Comment: Use the interactive wizard for a full scaffold, or a manual flow for control.

Interactive (recommended):
```bash
# runs the interactive Playwright project initializer
npm init playwright@latest
```

Manual (non-interactive):
```bash
# create a package.json quickly
npm init -y

# install Playwright Test as a dev dependency
npm install -D @playwright/test

# install Chromium (this project runs Chrome-only)
npx playwright install chromium

# scaffold a Playwright Test config and example tests
npx playwright test --init
```

---

## 4) Run the example tests
- Comment: Verify the installation and ensure browsers are installed.

```bash
# run Playwright Test (runs the example tests if you used --init)
npx playwright test
```

---

## 5) Useful additional commands

```bash
# open Playwright Test report (after tests run)
npx playwright show-report

# run tests headed (with browser UI)
npx playwright test --headed

# run a single test file
npx playwright test tests/example.spec.js
```

---

## Notes and tips
- If you prefer Python, use `pip` to install `playwright` and then run `playwright install` and `playwright install-deps` where appropriate.
- If CI will run tests, ensure `npx playwright install --with-deps` or the CI image contains the required browser dependencies.
- Keep commands copyable and run them from your project root where `package.json` will live.


---

## Project structure and adding new tests

Below is a typical Playwright project layout you may end up with after `npx playwright test --init`:

```
./
├─ package.json
├─ playwright.config.ts
├─ tests/
│  ├─ example.spec.ts
│  └─ my-new-test.spec.ts
└─ node_modules/
```

Common commands you can run:

```bash
npx playwright test
	# Runs the end-to-end tests.

npx playwright test --ui
	# Starts the interactive UI mode.

npx playwright test --project=chromium
	# Runs the tests only on Desktop Chrome.

npx playwright test example
	# Runs the tests in a specific file or folder named `example`.

npx playwright test --debug
	# Runs the tests in debug mode.

npx playwright codegen
	# Auto-generate tests with Codegen.
```

We suggest that you begin by typing:

```bash
npx playwright test
```

Check out these files after initialization:

- ./tests/example.spec.ts - Example end-to-end test
- ./playwright.config.ts - Playwright Test configuration

How to add a new test

1. Create a new file under the `tests/` folder, for example `tests/my-new-test.spec.ts`.
2. Use the Playwright Test API in the file:

```ts
import { test, expect } from '@playwright/test';

test('my new test', async ({ page }) => {
	await page.goto('https://example.com');
	await expect(page).toHaveTitle(/Example/);
});
```

3. Run the new test:

```bash
npx playwright test tests/my-new-test.spec.ts
```

4. To run against a specific browser project configured in `playwright.config.ts`:

```bash
npx playwright test --project=chromium
```

Created by assistant — modify as needed for your project's conventions.

---

## Advanced Testing Patterns

This section covers data-driven testing and Page Object Model (POM) patterns that we have implemented.

### 1) Data-Driven Testing with Properties Files

**File location:** `tests/data/login-data.properties`

Store test data in a properties file:

```properties
url=https://practicetestautomation.com/practice-test-login/
valid.username=student
valid.password=Password123
invalid.username=invaliduser
invalid.password=invalidpassword
valid.expectedMessage=Logged In Successfully
invalid.expectedMessage=Your username is invalid!
```

**Reusable utility:** `tests/utils/propertyReader.ts`

```ts
import * as fs from "fs";

export function readProperties(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf8");
  const values: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}
```

**Test example:** `tests/test_login_data_driven.spec.ts`

```ts
import { test, expect } from "@playwright/test";
import * as path from "path";
import { readProperties } from "./utils/propertyReader";

test("data driven valid login test", async ({ page }) => {
  const propertiesPath = path.resolve(process.cwd(), "tests", "data", "login-data.properties");
  const config = readProperties(propertiesPath);

  await page.goto(config.url);
  await page.getByRole("textbox", { name: "Username" }).fill(config["valid.username"]);
  await page.getByRole("textbox", { name: "Password" }).fill(config["valid.password"]);
  await page.getByRole("button", { name: "Submit" }).click();
  
  await expect(page.getByRole("heading", { name: config["valid.expectedMessage"] })).toBeVisible();
});
```

**Run the test:**

```bash
npx playwright test tests/test_login_data_driven.spec.ts
```

---

### 2) Data-Driven Testing with Helper Functions

For cleaner tests, extract the login flow into a reusable helper.

**Test example:** `tests/login_helper.spec.ts`

```ts
import { test, expect } from "@playwright/test";
import * as path from "path";
import { readProperties } from "./utils/propertyReader";

async function login(page: any, config: Record<string, string>) {
  await page.goto(config.url);
  await page.getByRole("textbox", { name: "Username" }).fill(config.username);
  await page.getByRole("textbox", { name: "Password" }).fill(config.password);
  await page.getByRole("button", { name: "Submit" }).click();
}

test("helper-based valid login test", async ({ page }) => {
  const propertiesPath = path.resolve(process.cwd(), "tests", "data", "login-data.properties");
  const config = readProperties(propertiesPath);

  await login(page, {
    url: config.url,
    username: config["valid.username"],
    password: config["valid.password"],
  });

  await expect(page.getByRole("heading", { name: config["valid.expectedMessage"] })).toBeVisible();
});
```

**Benefits:** Reduces code duplication and improves maintainability.

**Run the test:**

```bash
npx playwright test tests/login_helper.spec.ts
```

---

### 3) Data-Driven Testing with Environment Variables (.env)

**Setup:** Install dotenv dependency

```bash
npm install --save-dev dotenv
```

**File location:** `.env` (in project root)

```env
APP_URL=https://practicetestautomation.com/practice-test-login/
VALID_USERNAME=student
VALID_PASSWORD=Password123
INVALID_USERNAME=invaliduser
INVALID_PASSWORD=invalidpassword
```

**Reusable utility:** `tests/utils/envLoader.ts`

```ts
import * as dotenv from "dotenv";
import * as path from "path";

export function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  dotenv.config({ path: envPath });
  return process.env;
}

export function getEnvValue(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}
```

**Test example:** `tests/login_env.spec.ts`

```ts
import { test, expect } from "@playwright/test";
import { loadEnv, getEnvValue } from "./utils/envLoader";

test.beforeAll(() => {
  loadEnv();
});

test("env-based valid login test", async ({ page }) => {
  const appUrl = getEnvValue("APP_URL");
  const validUsername = getEnvValue("VALID_USERNAME");
  const validPassword = getEnvValue("VALID_PASSWORD");

  await page.goto(appUrl);
  await page.getByRole("textbox", { name: "Username" }).fill(validUsername);
  await page.getByRole("textbox", { name: "Password" }).fill(validPassword);
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();
});
```

**Run the test:**

```bash
npx playwright test tests/login_env.spec.ts
```

**Note:** Add `.env.local` to `.gitignore` for sensitive data in production.

---

### 4) Page Object Model (POM) Pattern

The Page Object Model is a design pattern that encapsulates page elements and actions into a reusable class.

**File structure:**

```
tests/
├─ pages/
│  └─ LoginPage.ts
├─ login_pom.spec.ts
└─ ...
```

**Page Object:** `tests/pages/LoginPage.ts`

```ts
import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  page: Page;
  usernameField: Locator;
  passwordField: Locator;
  submitButton: Locator;
  successHeading: Locator;
  errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameField = page.getByRole("textbox", { name: "Username" });
    this.passwordField = page.getByRole("textbox", { name: "Password" });
    this.submitButton = page.getByRole("button", { name: "Submit" });
    this.successHeading = page.getByRole("heading", { name: "Logged In Successfully" });
    this.errorMessage = page.locator("#error");
  }

  async navigateTo(url: string) {
    await this.page.goto(url);
  }

  async enterUsername(username: string) {
    await this.usernameField.fill(username);
  }

  async enterPassword(password: string) {
    await this.passwordField.fill(password);
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  async login(username: string, password: string) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickSubmit();
  }

  async verifyLoginSuccess() {
    await expect(this.successHeading).toBeVisible();
  }

  async verifyErrorMessage(expectedMessage: string) {
    await expect(this.errorMessage).toContainText(expectedMessage);
  }
}
```

**Test using POM:** `tests/login_pom.spec.ts`

```ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { loadEnv, getEnvValue } from "./utils/envLoader";

test.beforeAll(() => {
  loadEnv();
});

test("POM valid login test", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const appUrl = getEnvValue("APP_URL");
  const validUsername = getEnvValue("VALID_USERNAME");
  const validPassword = getEnvValue("VALID_PASSWORD");

  await loginPage.navigateTo(appUrl);
  await loginPage.login(validUsername, validPassword);
  await loginPage.verifyLoginSuccess();
});

test("POM invalid username test", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const appUrl = getEnvValue("APP_URL");
  const invalidUsername = getEnvValue("INVALID_USERNAME");
  const validPassword = getEnvValue("VALID_PASSWORD");

  await loginPage.navigateTo(appUrl);
  await loginPage.login(invalidUsername, validPassword);
  await loginPage.verifyErrorMessage("Your username is invalid!");
});

test("POM invalid password test", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const appUrl = getEnvValue("APP_URL");
  const validUsername = getEnvValue("VALID_USERNAME");
  const invalidPassword = getEnvValue("INVALID_PASSWORD");

  await loginPage.navigateTo(appUrl);
  await loginPage.login(validUsername, invalidPassword);
  await loginPage.verifyErrorMessage("Your password is invalid!");
});
```

**Run the test:**

```bash
npx playwright test tests/login_pom.spec.ts
```

**Benefits of POM:**
- Locators are centralized and easy to maintain.
- Test code is more readable and cleaner.
- Changes to UI elements only require updates to the page object, not all tests.
- Reusable across multiple test files.

---

## Summary of Testing Approaches

| Approach | File | Best For |
|----------|------|----------|
| **Properties File** | `test_login_data_driven.spec.ts` | Simple key-value data sets |
| **Helper Functions** | `login_helper.spec.ts` | Reducing code duplication |
| **Environment Variables** | `login_env.spec.ts` | Sensitive data, CI/CD environments |
| **Page Object Model** | `login_pom.spec.ts` | Large-scale test projects, maintainability |

---

## Project Structure Reference

```
./
├─ .env                           # Environment variables
├─ package.json                   # Project dependencies
├─ playwright.config.ts           # Playwright configuration
├─ tsconfig.json                  # TypeScript configuration
├─ tests/
│  ├─ pages/
│  │  └─ LoginPage.ts            # Page Object Model
│  ├─ utils/
│  │  ├─ propertyReader.ts       # Properties file reader
│  │  └─ envLoader.ts            # Environment variable loader
│  ├─ data/
│  │  ├─ login.properties        # Test data (properties format)
│  │  └─ login-data.properties   # Test data with namespaced keys
│  ├─ example.spec.ts            # Basic example test
│  ├─ test_login.spec.ts         # Standard login tests
│  ├─ test_login_data_driven.spec.ts  # Data-driven with properties
│  ├─ login_helper.spec.ts       # Data-driven with helpers
│  ├─ login_env.spec.ts          # Data-driven with .env
│  └─ login_pom.spec.ts          # POM-based tests
└─ node_modules/
```

---

## Tips for Best Practices

1. **Locators:** Use role-based locators (`getByRole`) over CSS selectors for accessibility and stability.
2. **Assertions:** Use Playwright's auto-waiting assertions like `expect().toBeVisible()` instead of manual waits.
3. **Test Isolation:** Each test should be independent and not depend on other tests.
4. **Data Management:** Use `.env` files for sensitive data and `.properties` files for test scenarios.
5. **Page Objects:** Create page objects for complex pages with many interactions.
6. **Comments:** Add comments in your test files to explain complex flows and data sources.

---

Created by assistant — modify as needed for your project's conventions.


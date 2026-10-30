/**
 * TUTORIAL — OOP IN PLAYWRIGHT · FILE 06
 * =========================================================
 * TOPIC: INTERFACES & CONTRACTS
 *
 * OOP CONCEPTS COVERED
 *   • Interface            — a pure contract: names + types, zero code
 *   • `implements`         — a class promises to honour that contract
 *   • Multiple interfaces  — a class can implement many small contracts
 *   • Interface inheritance— one interface extends another
 *   • Optional properties  — `?` = may be absent
 *   • Structural typing   — shape matters, not the class name
 *   • Interface Segregation idea — small contracts beat one fat contract
 *
 * WHY THIS MATTERS IN PLAYWRIGHT
 * Interfaces let you type "anything that can open and verify itself" without
 * forcing a shared parent class. Tests and helpers can depend on the contract,
 * so a real page object, a component, or even a plain object literal can be
 * swapped in. TypeScript checks all of it at compile time; none of it exists
 * at runtime (interfaces are erased).
 *
 * HOW TO RUN
 *   npx playwright test --config=tutorials/playwright.config.ts oops/06-interfaces.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';

/* -------------------------------------------------------------------------
 * 1. SMALL, FOCUSED CONTRACTS
 * -------------------------------------------------------------------------
 * No bodies — just the shape. Any class that implements them must provide
 * concrete public methods with these exact signatures.
 */
interface Navigable {
  open(): Promise<void>;
}

interface Verifiable {
  verifyLoaded(): Promise<void>;
}

/**
 * INTERFACE INHERITANCE: PageComponent gets BOTH members, then adds `name`.
 * This is the interface version of `extends` — no implementation involved.
 */
interface PageComponent extends Navigable, Verifiable {
  readonly name: string;
}

/* -------------------------------------------------------------------------
 * 2. CLASSES THAT HONOUR THE CONTRACT
 * ------------------------------------------------------------------------- */
class HomePage implements PageComponent {
  readonly name = 'Home page';

  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('https://playwright.dev/');
  }

  async verifyLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/Playwright/);
  }
}

class DocsPage implements PageComponent {
  readonly name = 'Docs page';

  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('https://playwright.dev/docs/intro');
  }

  async verifyLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/docs\/intro/);
  }
}

/**
 * A component implements ONLY what it needs (Navigable), not the fat
 * contract. That is the Interface Segregation Principle in miniature:
 * clients should not depend on methods they do not use.
 */
class SearchBox implements Navigable {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.getByRole('button', { name: 'Search' }).click();
  }
}

/* -------------------------------------------------------------------------
 * 3. INTERFACES FOR TEST DATA
 * -------------------------------------------------------------------------
 * The same idea works for plain data: define the shape once, reuse it.
 * `expectValue?` is optional, so a case may omit it.
 */
interface SearchCase {
  query: string;
  expectValue?: string;
}

/* -------------------------------------------------------------------------
 * 4. STRUCTURAL TYPING
 * -------------------------------------------------------------------------
 * TypeScript compares SHAPES, not names. This plain object literal is a
 * valid `SearchCase` because it has the required `query` property.
 */
const quickCase: SearchCase = { query: 'assertions' };

test.describe('OOP 06 — interfaces', () => {
  test('different classes satisfy the same contract', async ({ page }) => {
    // Typed by the CONTRACT, holding two unrelated classes (no shared parent).
    const components: PageComponent[] = [new HomePage(page), new DocsPage(page)];

    for (const component of components) {
      await test.step(component.name, async () => {
        await component.open();
        await component.verifyLoaded();
      });
    }

    expect(page.url()).toContain('/docs/intro');
  });

  test('a component implements only its small interface', async ({ page }) => {
    await page.goto('https://playwright.dev/');

    const searchBox: Navigable = new SearchBox(page); // contract type
    await searchBox.open();

    // The contract only promises open(), so these do not type-check:
    //   searchBox.verifyLoaded(); // Property does not exist on Navigable
    await expect(page.getByPlaceholder('Search docs')).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('interfaces type the test data too', async ({ page }) => {
    const cases: SearchCase[] = [quickCase, { query: 'locators', expectValue: 'locators' }];

    await page.goto('https://playwright.dev/');

    for (const testCase of cases) {
      await page.getByRole('button', { name: 'Search' }).click();
      const input = page.getByPlaceholder('Search docs');
      await input.fill(testCase.query);

      // Optional property: use the expected value when provided.
      if (testCase.expectValue) {
        await expect(input).toHaveValue(testCase.expectValue);
      }

      await page.keyboard.press('Escape');
    }

    // A plain object literal is accepted because its SHAPE matches.
    expect(quickCase.query).toBe('assertions');
  });

  test('the compiler enforces the contract', async ({ page }) => {
    // Uncommenting this fails to compile — the object is missing
    // open/verifyLoaded, so it does not satisfy PageComponent:
    //   const bad: PageComponent = { name: 'Bad', open: async () => {} };
    //
    // And a class that forgets a member fails too:
    //   class Broken implements PageComponent { ... } // missing verifyLoaded()

    const home: PageComponent = new HomePage(page);
    expect(home.name).toBe('Home page');
  });
});

/**
 * KEY TAKEAWAY — INTERFACES
 * An abstract class says "extend me and inherit my code".
 * An interface says "look like this, I do not care how".
 * Use interfaces for contracts between tests/helpers/page objects, keep them
 * small, and let classes implement as many as they genuinely need.
 */

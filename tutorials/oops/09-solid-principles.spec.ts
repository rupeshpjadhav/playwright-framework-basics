/**
 * TUTORIAL — OOP IN PLAYWRIGHT · FILE 09
 * =========================================================
 * TOPIC: SOLID PRINCIPLES (putting OOP together)
 *
 * OOP CONCEPTS COVERED
 *   • S — Single Responsibility Principle
 *   • O — Open/Closed Principle
 *   • L — Liskov Substitution Principle
 *   • I — Interface Segregation Principle
 *   • D — Dependency Inversion Principle
 *   • Plus: dependency injection and testability without a browser
 *
 * WHY THIS MATTERS IN PLAYWRIGHT
 * These five rules are the "code review checklist" for page objects, helpers,
 * and fixtures. Follow them and your framework survives UI changes; ignore
 * them and every new page edits five existing classes.
 *
 * HOW TO RUN
 *   npx playwright test --config=tutorials/playwright.config.ts oops/09-solid-principles.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';

/* =========================================================================
 * S — SINGLE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * One class, one reason to change.
 *   Navigator     -> only navigation
 *   SearchBox     -> only search
 *   TitleReporter -> only reading/reporting the title
 * If the search UI changes, only SearchBox changes.
 * ========================================================================= */
class Navigator {
  constructor(private readonly page: Page) {}

  async go(path = '/'): Promise<void> {
    await this.page.goto(`https://playwright.dev${path}`);
  }
}

class SearchBox {
  constructor(private readonly page: Page) {}

  async openAndType(term: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Search' }).click();
    await this.page.getByPlaceholder('Search docs').fill(term);
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}

class TitleReporter {
  constructor(private readonly page: Page) {}

  async read(): Promise<string> {
    return this.page.title();
  }
}

/* =========================================================================
 * O — OPEN/CLOSED
 * -------------------------------------------------------------------------
 * Open for extension, closed for modification.
 * `BasePage` already works; `DocsPage` adds new behaviour by extending it.
 * We never edit BasePage to support a new page type.
 * ========================================================================= */
class BasePage {
  constructor(protected readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('https://playwright.dev/');
  }

  async currentUrl(): Promise<string> {
    return this.page.url();
  }
}

class DocsPage extends BasePage {
  /** Extension, not modification: only the child knows the docs path. */
  override async open(): Promise<void> {
    await this.page.goto('https://playwright.dev/docs/intro');
  }
}

/* =========================================================================
 * L — LISKOV SUBSTITUTION
 * -------------------------------------------------------------------------
 * Any subclass must be usable wherever the parent is expected, without
 * surprises. `expectOnPage(base: BasePage)` works for BasePage AND DocsPage.
 * ========================================================================= */
async function expectOnPage(target: BasePage, path: RegExp): Promise<void> {
  expect(await target.currentUrl()).toMatch(path);
}

/* =========================================================================
 * I — INTERFACE SEGREGATION
 * -------------------------------------------------------------------------
 * Many small interfaces beat one fat one. A component that only searches
 * implements only `Searchable` — it is not forced to fake `open()`.
 * ========================================================================= */
interface Navigable {
  open(): Promise<void>;
}

interface Searchable {
  openAndType(term: string): Promise<void>;
}

class HeaderSearch implements Searchable {
  constructor(private readonly page: Page) {}

  async openAndType(term: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Search' }).click();
    await this.page.getByPlaceholder('Search docs').fill(term);
  }
}

/* =========================================================================
 * D — DEPENDENCY INVERSION
 * -------------------------------------------------------------------------
 * High-level logic depends on an ABSTRACTION (`UrlReader`), not on Playwright.
 * `DocsChecker` can therefore be unit-tested with a fake — no browser at all.
 * ========================================================================= */
interface UrlReader {
  currentUrl(): string;
}

/** Adapter: the only place that knows how to read a URL from a Page. */
class PageUrlReader implements UrlReader {
  constructor(private readonly page: Page) {}

  currentUrl(): string {
    return this.page.url();
  }
}

class DocsChecker {
  // The dependency is INJECTED through the constructor (dependency injection).
  constructor(private readonly reader: UrlReader) {}

  isOnDocs(): boolean {
    return this.reader.currentUrl().includes('/docs/');
  }
}

/* =========================================================================
 * TESTS — each principle in action
 * ========================================================================= */
test.describe('OOP 09 — SOLID principles', () => {
  test('S: small classes cooperate instead of one god object', async ({ page }) => {
    const navigator = new Navigator(page);
    const searchBox = new SearchBox(page);
    const titleReporter = new TitleReporter(page);

    await navigator.go('/');
    await searchBox.openAndType('locators');

    await expect(page.getByPlaceholder('Search docs')).toHaveValue('locators');
    expect(await titleReporter.read()).toContain('Playwright');

    await searchBox.close();
  });

  test('O: a new page type extends the base without editing it', async ({ page }) => {
    const docsPage = new DocsPage(page);

    await docsPage.open(); // overridden
    expect(await docsPage.currentUrl()).toContain('/docs/intro');

    const basePage = new BasePage(page);
    await basePage.open(); // original behaviour untouched
    expect(await basePage.currentUrl()).toMatch(/playwright\.dev\/?$/);
  });

  test('L: subclasses substitute for the parent', async ({ page }) => {
    // The helper accepts BasePage; DocsPage is passed as a BasePage.
    const docsPage = new DocsPage(page);
    await docsPage.open();

    await expectOnPage(docsPage, /\/docs\/intro/);
  });

  test('I: a class implements only the interface it needs', async ({ page }) => {
    await page.goto('https://playwright.dev/');

    // HeaderSearch is Searchable, but never claims to be Navigable.
    const searchable: Searchable = new HeaderSearch(page);
    await searchable.openAndType('assertions');

    await expect(page.getByPlaceholder('Search docs')).toHaveValue('assertions');
    await page.keyboard.press('Escape');
  });

  test('D: business logic is testable without a browser', () => {
    // FAKE implementation of the abstraction — zero Playwright involved.
    const fakeReader: UrlReader = {
      currentUrl: () => 'https://playwright.dev/docs/intro',
    };

    const checker = new DocsChecker(fakeReader);
    expect(checker.isOnDocs()).toBe(true);

    const offDocs = new DocsChecker({ currentUrl: () => 'https://playwright.dev/' });
    expect(offDocs.isOnDocs()).toBe(false);
  });

  test('D: the real adapter plugs into the same logic', async ({ page }) => {
    await page.goto('https://playwright.dev/docs/intro');

    // Same DocsChecker class, real dependency injected this time.
    const checker = new DocsChecker(new PageUrlReader(page));
    expect(checker.isOnDocs()).toBe(true);
  });
});

/**
 * KEY TAKEAWAY — SOLID
 *   S: each class has one job.
 *   O: add behaviour by extending, not by editing working code.
 *   L: a subclass must honour the parent's promises.
 *   I: small interfaces, implemented only where needed.
 *   D: depend on contracts, inject the concrete thing from outside.
 *
 * None of this is Playwright-specific — it is just good OOP applied to page
 * objects, components, and helpers.
 */

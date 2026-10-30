/**
 * TUTORIAL — OOP IN PLAYWRIGHT · FILE 03
 * =========================================================
 * TOPIC: INHERITANCE
 *
 * OOP CONCEPTS COVERED
 *   • Inheritance      — a child class reuses a parent class ("is-a")
 *   • `extends`        — declares the parent
 *   • `super()`        — calls the parent constructor
 *   • `super.method()` — calls the parent version of an overridden method
 *   • Method overriding— a child replaces a parent's behaviour
 *   • `protected`      — visible to this class and every subclass
 *   • Code reuse       — write `open()`, `title()`, `currentUrl()` once
 *
 * WHY THIS MATTERS IN PLAYWRIGHT
 * Every page in your app shares behaviour: navigate, read the title, wait for
 * a URL, take a screenshot. A `BasePage` holds that shared behaviour; each
 * real page extends it and adds only what is unique. This is the classic
 * Page Object Model (POM) base-class pattern.
 *
 * HOW TO RUN
 *   npx playwright test --config=tutorials/playwright.config.ts oops/03-inheritance.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';

/* -------------------------------------------------------------------------
 * 1. THE PARENT (BASE) CLASS — shared behaviour
 * -------------------------------------------------------------------------
 * Think "is-a": a HomePage IS-A BasePage, so it inherits everything here.
 */
class BasePage {
  /**
   * `protected` = this class + subclasses can use it, tests cannot.
   * (`private` here would break `this.page` inside HomePage.)
   */
  protected readonly page: Page;

  /** Protected config, also inherited by every child. */
  protected readonly baseUrl = 'https://playwright.dev';

  constructor(page: Page) {
    this.page = page;
  }

  /** Shared navigation. Children may call it or override it. */
  async open(path = '/'): Promise<void> {
    await this.page.goto(`${this.baseUrl}${path}`);
  }

  /** Shared getter. Inherited by every page object for free. */
  async title(): Promise<string> {
    return this.page.title();
  }

  /** Shared URL reader. */
  currentUrl(): string {
    return this.page.url();
  }

  /** Shared assertion helper — used by children, hidden from tests. */
  protected async expectUrl(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }
}

/* -------------------------------------------------------------------------
 * 2. THE CHILD CLASS — reuse + override
 * -------------------------------------------------------------------------
 * `extends BasePage` gives HomePage: page, baseUrl, title(), currentUrl(),
 * expectUrl() — without rewriting any of them.
 */
class HomePage extends BasePage {
  /**
   * OVERRIDE: same name/signature as the parent, different default path.
   * `super.open('/')` runs the PARENT implementation first, then we could
   * add extra steps. This is reuse, not copy-paste.
   */
  async open(): Promise<void> {
    await super.open('/');
  }

  /** New behaviour that only the home page has. */
  async openGettingStarted(): Promise<void> {
    // `this.page` is protected and inherited from BasePage.
    await this.page.getByRole('link', { name: 'Get started' }).click();
  }

  /** A composed action built from the inherited helper. */
  async expectOnIntroDocs(): Promise<void> {
    await this.expectUrl(/\/docs\/intro/);
  }
}

class DocsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/docs/intro');
  }

  /** Docs-only behaviour. */
  async expectTitle(): Promise<void> {
    await expect(this.page).toHaveTitle(/Playwright/);
  }
}

/* -------------------------------------------------------------------------
 * 3. USING THE HIERARCHY
 * ------------------------------------------------------------------------- */
test.describe('OOP 03 — inheritance', () => {
  test('child reuses inherited methods', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.open(); // overridden child method -> calls super.open('/')

    // title() and currentUrl() were never written in HomePage.
    // They come from BasePage via inheritance.
    expect(await homePage.title()).toContain('Playwright');
    expect(homePage.currentUrl()).toContain('playwright.dev');
  });

  test('child adds its own behaviour on top of the parent', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.open();
    await homePage.openGettingStarted();
    await homePage.expectOnIntroDocs();

    // `instanceof` walks the prototype chain, so a HomePage is also a BasePage.
    expect(homePage).toBeInstanceOf(HomePage);
    expect(homePage).toBeInstanceOf(BasePage);
  });

  test('each subclass customises the inherited open()', async ({ page }) => {
    const docsPage = new DocsPage(page);

    await docsPage.open(); // same method name, different path
    await docsPage.expectTitle();

    expect(docsPage.currentUrl()).toContain('/docs/intro');

    // The shared parent method still works in the child.
    expect(await docsPage.title()).toContain('Playwright');
  });
});

/**
 * KEY TAKEAWAY — INHERITANCE
 * Put what is COMMON in the parent (`BasePage`), put what is DIFFERENT in the
 * child (`HomePage`, `DocsPage`). `extends` shares the code, `super` reaches
 * back into it, and overriding lets a child specialise one step without
 * duplicating the rest.
 *
 * CAUTION: inheritance is a tight coupling ("is-a"). Use it for genuine
 * page-type hierarchies; for "this page HAS a navbar/search" use composition
 * (file 07) instead.
 */

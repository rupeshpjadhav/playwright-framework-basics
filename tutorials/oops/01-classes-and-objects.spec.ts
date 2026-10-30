/**
 * TUTORIAL — OOP IN PLAYWRIGHT · FILE 01
 * =========================================================
 * TOPIC: CLASSES & OBJECTS
 *
 * OOP CONCEPTS COVERED
 *   • Class               — the blueprint you write once
 *   • Object / instance   — a real thing built from that blueprint
 *   • Constructor         — setup code that runs when an object is born
 *   • Properties (fields) — data the object remembers
 *   • Methods             — things the object can do
 *   • `this`              — "the object I'm working with right now"
 *   • `new`               — the keyword that creates an instance
 *   • Parameter properties (`readonly page: Page` in the constructor)
 *
 * WHY THIS MATTERS IN PLAYWRIGHT
 * A "Page Object" is not a special Playwright feature — it is just a class.
 * The class describes a page (its locators + actions); each `new HomePage(page)`
 * is an object that wraps one real browser tab. Every other OOP idea in this
 * folder (encapsulation, inheritance, polymorphism...) is built on this file.
 *
 * HOW TO RUN
 *   npx playwright test --config=tutorials/playwright.config.ts oops/01-classes-and-objects.spec.ts --headed
 */

import { test, expect, Page, Locator } from '@playwright/test';

/* -------------------------------------------------------------------------
 * 1. THE CLASS — A BLUEPRINT
 * -------------------------------------------------------------------------
 * `class` groups related data (properties) and behaviour (methods) together.
 * Nothing is "running" yet — this is only a description of a page object.
 */
class PlaywrightHomePage {
  /**
   * PROPERTY: every object gets its own `page` reference.
   * `readonly` = can be set once (in the constructor) and never reassigned.
   * The `page` here is Playwright's `Page` type — one browser tab.
   */
  readonly page: Page;

  /**
   * CONSTRUCTOR: runs automatically exactly once, when `new` is used.
   * Its job is to put the object into a valid starting state.
   *
   * (Shorthand alternative: `constructor(readonly page: Page) {}` would
   * declare AND assign the property in one line. Written out long-form here
   * so you can see the two separate steps.)
   */
  constructor(page: Page) {
    this.page = page; // `this` = the object currently being created
  }

  /** METHOD: navigate this object's tab to the site. */
  async open(): Promise<void> {
    await this.page.goto('https://playwright.dev/');
  }

  /**
   * METHOD: return a Locator instead of clicking immediately.
   * Returning locators keeps the class flexible — the caller decides
   * whether to click, assert, or wait on it.
   */
  getStartedLink(): Locator {
    return this.page.getByRole('link', { name: 'Get started' });
  }

  /** METHOD: a complete user action, built from Playwright calls. */
  async openGettingStarted(): Promise<void> {
    await this.getStartedLink().click();
  }

  /** METHOD: read the current URL of this object's tab. */
  currentUrl(): string {
    return this.page.url();
  }
}

/* -------------------------------------------------------------------------
 * 2. THE SPEC — CREATING OBJECTS WITH `new`
 * -------------------------------------------------------------------------
 * Notice the test body never touches a raw locator for navigation.
 * It talks to the HomePage object, which owns that knowledge.
 */
test.describe('OOP 01 — classes & objects', () => {
  test('an object wraps one page and exposes actions', async ({ page }) => {
    // `new PlaywrightHomePage(page)` builds an OBJECT (instance).
    // We pass the runner-managed `page` fixture into the constructor.
    const homePage = new PlaywrightHomePage(page);

    // Call methods on the object. `this.page` inside those methods
    // is exactly the `page` we passed in above.
    await homePage.open();
    await expect(page).toHaveTitle(/Playwright/);

    await homePage.openGettingStarted();

    // The object's method reads its own `page`, so it sees the new URL.
    expect(homePage.currentUrl()).toContain('/docs/intro');

    // Playwright's `expect` can assert on plain objects too.
    expect(homePage).toBeInstanceOf(PlaywrightHomePage);
  });

  test('two objects from one class are independent instances', async ({ browser }) => {
    // Build two isolated contexts so each page object owns a separate tab.
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      const homeA = new PlaywrightHomePage(pageA);
      const homeB = new PlaywrightHomePage(pageB);

      // Same class, same methods, different objects + different tabs.
      await homeA.open();
      await homeB.page.goto('https://playwright.dev/docs/intro');

      expect(homeA.currentUrl()).not.toContain('/docs/intro');
      expect(homeB.currentUrl()).toContain('/docs/intro');

      // Different objects in memory, even though they share a class.
      expect(homeA).not.toBe(homeB);
    } finally {
      // Objects do not close browsers; the owner of the context does.
      await contextA.close();
      await contextB.close();
    }
  });
});

/**
 * KEY TAKEAWAY — CLASSES & OBJECTS
 * A class is the recipe; an object is the cake. The constructor is the moment
 * the cake comes out of the oven, `this` is "this particular cake", and `new`
 * is the oven. In Playwright, a Page Object class is reused across many tests,
 * while each test gets its own object bound to its own isolated `page`.
 */

/**
 * TUTORIAL — OOP IN PLAYWRIGHT · FILE 08
 * =========================================================
 * TOPIC: STATIC MEMBERS & FACTORY METHODS
 *
 * OOP CONCEPTS COVERED
 *   • Static property      — one value shared by the class itself
 *   • Static method        — behaviour you call on the class, not an object
 *   • Class-level state    — lives on the class, not on each instance
 *   • Factory method       — a static method that builds instances for you
 *   • Private constructor  — force callers through the factory
 *   • Constants            — shared, read-only config in one place
 *
 * WHY THIS MATTERS IN PLAYWRIGHT
 * Some things belong to the whole suite, not to one page object: the base URL,
 * a timeout, a helper that builds URLs, or a factory that creates a page object
 * with sensible defaults. `static` keeps those on the class instead of
 * scattering magic strings through tests.
 *
 * HOW TO RUN
 *   npx playwright test --config=tutorials/playwright.config.ts oops/08-static-members-and-factories.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';

class SitePage {
  /** STATIC CONSTANT: one copy, owned by the class, never per-instance. */
  static readonly BASE_URL = 'https://playwright.dev';

  /** STATIC STATE: shared by every instance created in this process. */
  private static instanceCount = 0;

  /** Static getter: read the shared state through a controlled door. */
  static get instancesCreated(): number {
    return SitePage.instanceCount;
  }

  /**
   * STATIC HELPER: pure function, no `this`, no browser needed.
   * Perfect for building URLs or ids without creating an object.
   */
  static urlFor(path: string): string {
    return new URL(path, SitePage.BASE_URL).toString();
  }

  /**
   * PRIVATE CONSTRUCTOR: `new SitePage(...)` is a compile error.
   * Callers must use the factory below, so instance creation stays controlled
   * (and the counter can never be skipped).
   */
  private constructor(
    private readonly page: Page,
    private readonly path: string,
  ) {
    SitePage.instanceCount += 1; // `this` is NOT used for static state
  }

  /**
   * FACTORY METHOD: the supported way to create this object.
   * It can add validation, defaults, logging, caching — all in one place.
   */
  static create(page: Page, path = '/'): SitePage {
    if (!path.startsWith('/')) {
      throw new Error(`path must start with "/", got: ${path}`);
    }
    return new SitePage(page, path);
  }

  /* ------------------------- instance members ------------------------- */

  async open(): Promise<void> {
    // Instance code CAN read static members — via the class name.
    await this.page.goto(SitePage.urlFor(this.path));
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  currentUrl(): string {
    return this.page.url();
  }
}

test.describe('OOP 08 — static members & factories', () => {
  test('static helpers work without creating an object', () => {
    // No `new`, no browser: call straight on the class.
    expect(SitePage.BASE_URL).toBe('https://playwright.dev');
    expect(SitePage.urlFor('/docs/intro')).toBe('https://playwright.dev/docs/intro');
  });

  test('the factory creates a working page object', async ({ page }) => {
    const docsPage = SitePage.create(page, '/docs/intro');

    await docsPage.open();

    expect(docsPage.currentUrl()).toContain('/docs/intro');
    expect(await docsPage.title()).toContain('Playwright');
  });

  test('the factory validates input in one central place', async ({ page }) => {
    // Every caller gets the same protection — no duplicated guard clauses.
    expect(() => SitePage.create(page, 'docs/intro')).toThrow(/must start with/);
  });

  test('static state is shared by all instances', async ({ page }) => {
    // Capture the shared counter BEFORE creating instances in this test.
    const before = SitePage.instancesCreated;

    SitePage.create(page, '/');
    SitePage.create(page, '/docs/intro');

    // Two instances were created, but they both report the SAME class-level
    // counter — static state is not copied per object. (Relative assertion
    // keeps this test correct even when Playwright runs tests in parallel.)
    expect(SitePage.instancesCreated).toBe(before + 2);
  });

  test('instance members are not reachable from the class', () => {
    // Uncommenting fails to compile:
    //   SitePage.open();        // Property 'open' does not exist on typeof SitePage
    //   SitePage.currentUrl();  // same reason
    //
    // And this also fails, because the constructor is private:
    //   new SitePage(page, '/'); // Constructor of class 'SitePage' is private

    expect(SitePage.BASE_URL).toContain('playwright.dev');
  });
});

/**
 * KEY TAKEAWAY — STATIC MEMBERS & FACTORIES
 * Static = belongs to the class, shared by everyone (`Math.max`, `SitePage.BASE_URL`).
 * Instance = belongs to one object (`docsPage.open()`).
 * A static factory + private constructor is a tidy way to control creation,
 * validate inputs, and keep configuration in exactly one place.
 *
 * WATCH OUT: static mutable state is global for the worker process. Keep it
 * read-only where possible; if you must mutate it, reset it in `beforeEach`.
 */

/**
 * TUTORIAL — OOP IN PLAYWRIGHT · FILE 04
 * =========================================================
 * TOPIC: POLYMORPHISM
 *
 * OOP CONCEPTS COVERED
 *   • Polymorphism        — "many forms": one call, many behaviours
 *   • Method overriding   — a child supplies its own version of a method
 *   • Dynamic dispatch    — the OBJECT decides which method runs at runtime
 *   • Upcasting           — treating a child as its parent type
 *   • Abstract base type  — a common shape with no useful default behaviour
 *   • Open/closed idea    — add a new page class without editing the loop
 *
 * WHY THIS MATTERS IN PLAYWRIGHT
 * A smoke suite usually does the same thing to every page: open it, check the
 * URL, check it loaded. Polymorphism lets you write that loop ONCE and have
 * each page class plug in its own URL and its own loading logic.
 *
 * HOW TO RUN
 *   npx playwright test --config=tutorials/playwright.config.ts oops/04-polymorphism.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';

/* -------------------------------------------------------------------------
 * 1. THE COMMON TYPE
 * -------------------------------------------------------------------------
 * `abstract` = cannot be instantiated with `new SitePage(...)`.
 * It only exists to define the shape every page must have.
 */
abstract class SitePage {
  /** Subclasses decide which URL they expect. */
  abstract readonly expectedUrl: RegExp;

  /** Subclasses decide how they navigate there. */
  abstract open(): Promise<void>;

  /** Concrete method used by helpers that only hold the parent type. */
  currentUrl(): string {
    return this.page.url();
  }

  /** `protected` so only the family (subclasses) can use the page directly. */
  constructor(protected readonly page: Page) {}

  /**
   * A concrete method shared by all pages. It calls the abstract `open()`
   * WITHOUT knowing which subclass it is. At runtime the object's own
   * version runs — this is dynamic dispatch.
   */
  async visitAndVerify(): Promise<void> {
    await this.open();
    await expect(this.page).toHaveURL(this.expectedUrl);
  }
}

/* -------------------------------------------------------------------------
 * 2. THREE DIFFERENT "FORMS" OF THE SAME TYPE
 * ------------------------------------------------------------------------- */
class HomePage extends SitePage {
  readonly expectedUrl = /playwright\.dev\/?$/;

  async open(): Promise<void> {
    await this.page.goto('https://playwright.dev/');
  }
}

class DocsPage extends SitePage {
  readonly expectedUrl = /\/docs\/intro\/?$/;

  async open(): Promise<void> {
    await this.page.goto('https://playwright.dev/docs/intro');
  }
}

class ApiPage extends SitePage {
  readonly expectedUrl = /\/docs\/api\/class-playwright\/?$/;

  async open(): Promise<void> {
    await this.page.goto('https://playwright.dev/docs/api/class-playwright');
  }
}

/**
 * This function is the payoff. It is typed against the PARENT.
 * It works with today's three pages and with any page class added tomorrow,
 * and it never needs to know their concrete class names.
 */
async function visitAll(site: SitePage[]): Promise<string[]> {
  const visited: string[] = [];

  for (const sitePage of site) {
    // One line, three different behaviours selected at runtime.
    await sitePage.visitAndVerify();
    visited.push(sitePage.currentUrl());
  }

  return visited;
}

test.describe('OOP 04 — polymorphism', () => {
  test('one loop drives three different page classes', async ({ page }) => {
    // The array is typed as SitePage[], but it holds three different objects.
    const pages: SitePage[] = [new HomePage(page), new DocsPage(page), new ApiPage(page)];

    const visited = await visitAll(pages);

    expect(visited).toHaveLength(3);
    expect(visited[0]).toContain('playwright.dev');
    expect(visited[1]).toContain('/docs/intro');
    expect(visited[2]).toContain('/docs/api/class-playwright');
  });

  test('the same call produces a different result per object', async ({ page }) => {
    // Two variables, same declared type, different runtime behaviour.
    const home: SitePage = new HomePage(page);
    const docs: SitePage = new DocsPage(page);

    await home.visitAndVerify();
    const homeUrl = page.url();

    await docs.visitAndVerify();
    const docsUrl = page.url();

    expect(homeUrl).not.toBe(docsUrl);
    expect(homeUrl).toMatch(home.expectedUrl);
    expect(docsUrl).toMatch(docs.expectedUrl);

    // `instanceof` lets you safely narrow the parent type when needed.
    expect(docs).toBeInstanceOf(DocsPage);
  });

  test('an abstract class cannot be instantiated (compile-time rule)', async ({ page }) => {
    // Uncommenting this line fails to compile:
    //   const broken = new SitePage(page); // Cannot create an instance of an abstract class
    //
    // At runtime, the check below proves the concrete classes are usable.
    expect(new HomePage(page)).toBeInstanceOf(SitePage);
  });
});

/**
 * KEY TAKEAWAY — POLYMORPHISM
 * You call the same method (`visitAndVerify()` / `open()`) on every page, and
 * each subclass decides what that means. Tests stay short, and adding a new
 * page means adding a class — not editing every test that visits pages.
 *
 * NOTE ON METHOD OVERLOADING (a cousin of polymorphism):
 * TypeScript supports "overload signatures" (one method name, several typed
 * signatures), but JavaScript has ONE runtime implementation — there is no
 * true runtime overloading like Java/C#. In tests, optional parameters or
 * union types are usually clearer than overloads.
 */

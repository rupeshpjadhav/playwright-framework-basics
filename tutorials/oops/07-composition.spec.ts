/**
 * TUTORIAL — OOP IN PLAYWRIGHT · FILE 07
 * =========================================================
 * TOPIC: COMPOSITION ("has-a" beats "is-a")
 *
 * OOP CONCEPTS COVERED
 *   • Composition          — build big objects out of small objects
 *   • "Has-a" relationship — a page HAS a navbar, HAS a search dialog
 *   • Delegation           — the page forwards work to its components
 *   • Constructor injection— components receive the page they need
 *   • Favour composition over inheritance
 *
 * WHY THIS MATTERS IN PLAYWRIGHT
 * Real pages are made of reusable chunks: navbar, sidebar, modal, table.
 * Making `DocsPage extends NavBar` would be wrong ("a page is not a navbar").
 * Instead the page OWNS a navbar object and forwards calls to it. Components
 * stay small and can be reused on ten different pages without a class
 * hierarchy turning into spaghetti.
 *
 * HOW TO RUN
 *   npx playwright test --config=tutorials/playwright.config.ts oops/07-composition.spec.ts --headed
 */

import { test, expect, Page, Locator } from '@playwright/test';

/* -------------------------------------------------------------------------
 * 1. SMALL, REUSABLE COMPONENTS
 * ------------------------------------------------------------------------- */
class NavBar {
  constructor(private readonly page: Page) {}

  /** A private-ish locator exposed as a getter for the page to read. */
  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search' });
  }

  async openSearch(): Promise<void> {
    await this.searchButton.click();
  }
}

class SearchDialog {
  constructor(private readonly page: Page) {}

  /** Not `private`, so the owning page can wait on it if it wants to. */
  get input(): Locator {
    return this.page.getByPlaceholder('Search docs');
  }

  async waitUntilOpen(): Promise<void> {
    await expect(this.input).toBeVisible();
  }

  async type(term: string): Promise<void> {
    await this.input.fill(term);
  }

  async currentValue(): Promise<string> {
    return this.input.inputValue();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}

/* -------------------------------------------------------------------------
 * 2. THE PAGE COMPOSES THE COMPONENTS
 * -------------------------------------------------------------------------
 * Read the fields out loud: "a DocsPage HAS-A NavBar and HAS-A SearchDialog".
 * That is composition. There is no `extends` anywhere in this file.
 */
class DocsPage {
  readonly navBar: NavBar;
  readonly searchDialog: SearchDialog;

  constructor(private readonly page: Page) {
    // Constructor injection: each component gets the SAME page reference.
    this.navBar = new NavBar(page);
    this.searchDialog = new SearchDialog(page);
  }

  async open(): Promise<void> {
    await this.page.goto('https://playwright.dev/docs/intro');
  }

  /**
   * DELEGATION: the page does not know how search works.
   * It asks the navbar to open it, and the dialog to type into it.
   * Each component remains the single owner of its own locators.
   */
  async searchFor(term: string): Promise<void> {
    await this.navBar.openSearch();
    await this.searchDialog.waitUntilOpen();
    await this.searchDialog.type(term);
  }
}

/* -------------------------------------------------------------------------
 * 3. USING THE COMPOSED OBJECT
 * ------------------------------------------------------------------------- */
test.describe('OOP 07 — composition', () => {
  test('a page delegates to the components it owns', async ({ page }) => {
    const docsPage = new DocsPage(page);

    await docsPage.open();

    // Only one "Search" button exists while the dialog is closed, so assert
    // this BEFORE opening it (once open, the dialog container also exposes
    // the role "button" and would make this locator ambiguous).
    await expect(docsPage.navBar.searchButton).toBeVisible();

    await docsPage.searchFor('assertions');

    // The test can talk to the components directly when it needs to...
    expect(await docsPage.searchDialog.currentValue()).toBe('assertions');
    await expect(docsPage.searchDialog.input).toHaveValue('assertions');

    await docsPage.searchDialog.close();
  });

  test('the same component can be reused on another page', async ({ page }) => {
    // Composition makes components portable: this "page" object is just a
    // bare page, but it can still own the exact same SearchDialog class.
    await page.goto('https://playwright.dev/');

    const searchDialog = new SearchDialog(page);
    const navBar = new NavBar(page);

    await navBar.openSearch();
    await searchDialog.waitUntilOpen();
    await searchDialog.type('page object model');

    expect(await searchDialog.currentValue()).toBe('page object model');
    await searchDialog.close();
  });

  test('composition is not inheritance', async ({ page }) => {
    const docsPage = new DocsPage(page);

    // A DocsPage is NOT a NavBar and NOT a SearchDialog...
    expect(docsPage).not.toBeInstanceOf(NavBar);
    expect(docsPage).not.toBeInstanceOf(SearchDialog);

    // ...it simply CONTAINS them. "Has-a", not "is-a".
    expect(docsPage.navBar).toBeInstanceOf(NavBar);
    expect(docsPage.searchDialog).toBeInstanceOf(SearchDialog);
  });
});

/**
 * KEY TAKEAWAY — COMPOSITION
 * Inheritance shares behaviour by ancestry; composition shares it by ownership.
 * Prefer composition when the relationship is "has-a" (almost every page
 * component). You get reuse without fragile base classes, and you can mix in
 * only the pieces a given page actually needs.
 */

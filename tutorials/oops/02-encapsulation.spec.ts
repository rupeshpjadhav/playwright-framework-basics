/**
 * TUTORIAL — OOP IN PLAYWRIGHT · FILE 02
 * =========================================================
 * TOPIC: ENCAPSULATION (data hiding)
 *
 * OOP CONCEPTS COVERED
 *   • Encapsulation        — hide the internals, expose a small public API
 *   • Access modifiers     — `public`, `private`, `protected`, `readonly`
 *   • Getters & setters    — controlled read/write access to private state
 *   • Guard clauses        — validate input at the boundary of the class
 *   • Information hiding   — tests do not know (or care) which locators exist
 *
 * WHY THIS MATTERS IN PLAYWRIGHT
 * Locators are implementation details. If every test writes its own CSS
 * selectors, one UI change breaks dozens of tests. Encapsulation puts those
 * selectors behind private fields and exposes intention-revealing methods
 * (`search('locators')`) instead. Change the selector once, everything works.
 *
 * HOW TO RUN
 *   npx playwright test --config=tutorials/playwright.config.ts oops/02-encapsulation.spec.ts --headed
 */

import { test, expect, Page, Locator } from '@playwright/test';

/* -------------------------------------------------------------------------
 * 1. PRIVATE FIELDS + A SMALL PUBLIC SURFACE
 * -------------------------------------------------------------------------
 * `private`  -> only code inside this class may use it.
 * `public`   -> default; callable from tests and other classes.
 * `protected`-> this class AND its subclasses (see file 03).
 * `readonly` -> assign once in the constructor, then no reassignment.
 */
class SearchBox {
  /** Private: the test can never call `searchBox.openButton.click()`. */
  private readonly openButton: Locator;

  /** Private: the actual input is an implementation detail. */
  private readonly input: Locator;

  /** Private state: remembers the last successful search for the caller. */
  private lastQuery = '';

  constructor(private readonly page: Page) {
    // Locators live here, in exactly one place.
    this.openButton = page.getByRole('button', { name: 'Search' });
    this.input = page.getByPlaceholder('Search docs');
  }

  /**
   * Public method = the only way in.
   * It hides the fact that opening search means "click a button then wait
   * for an input". Callers just say "open".
   */
  async open(): Promise<void> {
    // Guard clause: idempotent — opening an already-open box does nothing.
    if (await this.input.isVisible()) return;
    await this.openButton.click();
  }

  /**
   * Public action. Input validation happens here, at the class boundary,
   * so no test can put the object into a nonsense state.
   */
  async search(term: string): Promise<void> {
    if (!term.trim()) {
      throw new Error('search(term) requires a non-empty search term');
    }

    await this.open();
    await this.input.fill(term);
    this.lastQuery = term;
  }

  /** Public read-only view of private state. */
  async currentValue(): Promise<string> {
    return this.input.inputValue();
  }

  /** Public teardown action for the dialog. */
  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /* -----------------------------------------------------------------------
   * GETTER: looks like a property, runs like a method.
   * `searchBox.lastSearch` reads private state without exposing a setter,
   * so callers can look but cannot corrupt it.
   * --------------------------------------------------------------------- */
  get lastSearch(): string {
    return this.lastQuery;
  }
}

/* -------------------------------------------------------------------------
 * 2. ENCAPSULATION OF CONFIGURATION — GETTER + VALIDATING SETTER
 * -------------------------------------------------------------------------
 * A setter is the "write door" to a private field. Because every write goes
 * through it, the class can enforce rules (here: retries can never be < 0).
 */
class RetryConfig {
  private _retries = 0;

  get retries(): number {
    return this._retries;
  }

  set retries(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`retries must be a non-negative integer, got: ${value}`);
    }
    this._retries = value;
  }
}

test.describe('OOP 02 — encapsulation', () => {
  test('tests use the public API, never the hidden locators', async ({ page }) => {
    const searchBox = new SearchBox(page);

    await page.goto('https://playwright.dev/');

    // The test says WHAT it wants. It has no idea which button/placeholder
    // is used underneath — that is the whole point of encapsulation.
    await searchBox.search('locators');

    await expect(page.getByPlaceholder('Search docs')).toHaveValue('locators');
    expect(await searchBox.currentValue()).toBe('locators');
    expect(searchBox.lastSearch).toBe('locators');

    // Uncommenting either line below is a TypeScript compile error:
    //   searchBox.input.fill('x');      // Property 'input' is private
    //   searchBox.lastSearch = 'hack';  // only a getter exists, no setter

    await searchBox.close();
  });

  test('guard clause rejects empty input before touching the browser', async ({ page }) => {
    const searchBox = new SearchBox(page);
    await page.goto('https://playwright.dev/');

    // The class protects its own invariants. If this throws, no click,
    // no fill, and no broken browser state ever happened.
    await expect(searchBox.search('   ')).rejects.toThrow(/non-empty/);
  });

  test('setter validates configuration written by the test', () => {
    const config = new RetryConfig();

    config.retries = 2; // goes through the setter
    expect(config.retries).toBe(2);

    // Invalid values are rejected at the door, not deep inside a test run.
    expect(() => {
      config.retries = -1;
    }).toThrow(/non-negative/);
  });
});

/**
 * KEY TAKEAWAY — ENCAPSULATION
 * Private fields keep the messy "how" inside the class; public methods expose
 * a clean "what". Getters/setters are controlled windows into private state.
 * A well-encapsulated page object can be refactored internally (new locator,
 * new wait, new step) without a single test changing.
 */

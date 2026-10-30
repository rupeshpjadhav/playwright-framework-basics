/**
 * TUTORIAL — OOP IN PLAYWRIGHT · FILE 05
 * =========================================================
 * TOPIC: ABSTRACTION
 *
 * OOP CONCEPTS COVERED
 *   • Abstraction          — show the WHAT, hide the HOW
 *   • Abstract class       — a half-built class that must be extended
 *   • Abstract methods     — declared by the parent, implemented by children
 *   • Template method      — a fixed algorithm with pluggable steps
 *   • Protected members    — internal steps hidden from tests
 *
 * WHY THIS MATTERS IN PLAYWRIGHT
 * Most business flows share a skeleton: "go somewhere -> do the thing ->
 * verify the result". The skeleton is stable; the individual steps differ per
 * flow. An abstract `BaseFlow` captures the skeleton, and each concrete flow
 * fills in the three blanks. The test just calls `run()`.
 *
 * HOW TO RUN
 *   npx playwright test --config=tutorials/playwright.config.ts oops/05-abstraction.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';

/* -------------------------------------------------------------------------
 * 1. THE ABSTRACT SKELETON
 * -------------------------------------------------------------------------
 * `abstract class` = a class you are NOT allowed to instantiate directly.
 * It is a contract plus shared code, not a finished object.
 */
abstract class BaseFlow {
  // Public constructor: the test creates a CONCRETE subclass, never BaseFlow.
  constructor(protected readonly page: Page) {}

  /** Every flow must have a human-readable name (used in reports/steps). */
  abstract readonly name: string;

  /** Step 1 — each flow decides how it starts. No body allowed here. */
  protected abstract start(): Promise<void>;

  /** Step 2 — each flow decides what "success" looks like. */
  protected abstract verify(): Promise<void>;

  /**
   * TEMPLATE METHOD — the fixed recipe.
   * `run()` is public and FINAL in spirit: tests call it once and never need
   * to know the order of the steps. Subclasses only fill in `start`/`verify`.
   */
  async run(): Promise<void> {
    await this.start();
    await this.verify();
  }
}

/* -------------------------------------------------------------------------
 * 2. CONCRETE FLOWS — fill in the blanks
 * ------------------------------------------------------------------------- */
class GettingStartedFlow extends BaseFlow {
  readonly name = 'Getting started flow';

  protected async start(): Promise<void> {
    await this.page.goto('https://playwright.dev/');
    await this.page.getByRole('link', { name: 'Get started' }).click();
  }

  protected async verify(): Promise<void> {
    await expect(this.page).toHaveURL(/\/docs\/intro/);
    await expect(this.page).toHaveTitle(/Playwright/);
  }
}

class DocsSearchFlow extends BaseFlow {
  readonly name = 'Docs search flow';

  protected async start(): Promise<void> {
    await this.page.goto('https://playwright.dev/');
    await this.page.getByRole('button', { name: 'Search' }).click();
    await this.page.getByPlaceholder('Search docs').fill('locators');
  }

  protected async verify(): Promise<void> {
    // The interesting part: this flow verifies a VALUE, not a URL.
    // The shared `run()` skeleton did not need to change at all.
    await expect(this.page.getByPlaceholder('Search docs')).toHaveValue('locators');
    await this.page.keyboard.press('Escape');
  }
}

/**
 * Exposed to tests as a simple API: give me any flow, I run it.
 * The caller is abstracted away from start/verify entirely.
 */
async function runFlows(flows: BaseFlow[]): Promise<void> {
  for (const flow of flows) {
    // `test.step` + the abstract `name` property = readable reports.
    await test.step(flow.name, async () => {
      await flow.run();
    });
  }
}

test.describe('OOP 05 — abstraction', () => {
  test('tests only know run(), not the individual steps', async ({ page }) => {
    const flows: BaseFlow[] = [new GettingStartedFlow(page), new DocsSearchFlow(page)];

    // Two very different journeys, one public entry point.
    await runFlows(flows);
  });

  test('a flow owns its own definition of success', async ({ page }) => {
    // Same `run()` -> different assertions inside verify().
    const searchFlow = new DocsSearchFlow(page);
    await searchFlow.run();

    expect(searchFlow.name).toBe('Docs search flow');
  });

  test('abstraction hides the internal steps', async ({ page }) => {
    const flow = new GettingStartedFlow(page);

    // Available: the public template method.
    await flow.run();

    // Not available (compile errors if uncommented):
    //   flow.start();  // protected
    //   flow.verify(); // protected
    //
    // Tests cannot accidentally call the steps in the wrong order.
    expect(page.url()).toContain('/docs/intro');
  });
});

/**
 * KEY TAKEAWAY — ABSTRACTION
 * The test says "run this flow". It does not say "click here, then fill there,
 * then assert this". The abstract class defines the required shape, each
 * concrete flow supplies the details, and the template method guarantees the
 * correct order forever.
 *
 * Rule of thumb: abstract the PROCESS, not the data. If the only thing shared
 * is a list of locators, a plain class (file 01) is simpler.
 */

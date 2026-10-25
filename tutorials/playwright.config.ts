/**
 * A tiny standalone config just for this tutorials/ folder.
 *
 * Why this file exists: the main playwright.config.ts at the repo root
 * sets `testDir: './tests'`, so the runner never looks inside tutorials/.
 * Rather than touching the main config, this local config points the
 * runner at THIS folder instead — keeping the tutorials fully isolated
 * from the rest of the framework.
 *
 * Run tutorial 1 with:
 *   npx playwright test --config=tutorials/playwright.config.ts
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.', // look for *.spec.ts files right here in tutorials/
  fullyParallel: true,
  reporter: 'list', // simple console output — no HTML report needed for a tutorial
});

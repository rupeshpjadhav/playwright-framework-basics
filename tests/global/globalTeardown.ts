// Global Teardown
//
// A global teardown file runs ONCE after ALL test files across ALL projects have finished.
// Use it for cleanup tasks like:
//   - Clearing test data from a database
//   - Stopping external services
//   - Deleting temporary files
//   - Generating summary reports
//
// To wire this into your project, add to playwright.config.ts:
//   export default defineConfig({
//     globalTeardown: './tests/global/globalTeardown.ts',
//     ...
//   });

import type { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("[Global Teardown] All tests finished.");
  console.log("[Global Teardown] Cleanup complete.");
}

export default globalTeardown;

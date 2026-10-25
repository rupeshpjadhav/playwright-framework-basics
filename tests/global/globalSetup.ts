// Global Setup
//
// A global setup file runs ONCE before ALL test files across ALL projects.
// Use it for one-time tasks like:
//   - Loading environment variables
//   - Seeding a database
//   - Starting external services
//   - Generating shared test data
//
// To wire this into your project, add to playwright.config.ts:
//   export default defineConfig({
//     globalSetup: './tests/global/globalSetup.ts',
//     ...
//   });
//
// The function receives the full Playwright config as an argument.

import * as dotenv from "dotenv";
import * as path from "path";
import type { FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  // Load environment variables from .env file.
  const envPath = path.resolve(process.cwd(), ".env");
  dotenv.config({ path: envPath });

  // Store a timestamp so tests can verify that global setup ran.
  process.env.GLOBAL_SETUP_TIMESTAMP = new Date().toISOString();

  console.log("[Global Setup] Environment loaded successfully.");
  console.log(`[Global Setup] Base URL: ${process.env.APP_URL}`);
  console.log(`[Global Setup] Timestamp: ${process.env.GLOBAL_SETUP_TIMESTAMP}`);
}

export default globalSetup;

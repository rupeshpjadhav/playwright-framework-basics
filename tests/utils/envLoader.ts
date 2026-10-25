import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from a `.env` file in the project root.
// This makes it possible to use values like URLs and credentials from environment config.
export function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  dotenv.config({ path: envPath });
  return process.env;
}

// Retrieve a named environment variable and throw a helpful error if it's missing.
export function getEnvValue(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

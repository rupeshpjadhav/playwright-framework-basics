import * as fs from "fs";

// Read a Java-style properties file and return its key/value pairs.
// This utility function is reusable across any tests that need data from `.properties` files.
export function readProperties(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf8");
  const values: Record<string, string> = {};

  // Each line in a properties file may define a key=value pair.
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    // Ignore comments and blank lines.
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

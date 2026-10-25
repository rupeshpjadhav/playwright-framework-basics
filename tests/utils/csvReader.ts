// CSV Test Data Reader
//
// Reads test data from a CSV file and returns it as an array of objects.
// Each row becomes an object with column headers as keys.
// CSV is useful for tabular test data — easy to edit in Excel or Google Sheets.
//
// Usage:
//   const rows = readCsv("tests/data/login-data.csv");
//   // rows[0] = { username: "student", password: "Password123", expected: "success" }
//   // rows[1] = { username: "invaliduser", password: "Password123", expected: "Your username is invalid!" }

import * as fs from "fs";

// Reads a CSV file and returns an array of objects.
// First row is treated as headers; subsequent rows are data.
export function readCsv(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    return [];
  }

  // First line contains column headers.
  const headers = lines[0].split(",").map((h) => h.trim());

  // Each subsequent line is a data row.
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || "";
    }
    rows.push(row);
  }

  return rows;
}

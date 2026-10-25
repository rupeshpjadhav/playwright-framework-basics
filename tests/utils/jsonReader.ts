// JSON Test Data Reader
//
// Reads test data from a JSON file and returns it as a typed object.
// JSON is a common alternative to .properties files — it supports nested objects,
// arrays, and complex data structures natively.
//
// Usage:
//   const data = readJson<LoginData>("tests/data/login-data.json");
//   console.log(data.valid.username); // "student"

import * as fs from "fs";

// Generic function that reads a JSON file and parses it into type T.
// The generic <T> allows TypeScript to infer the shape of the returned data.
export function readJson<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content) as T;
}

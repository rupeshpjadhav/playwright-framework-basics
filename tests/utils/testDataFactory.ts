// Test Data Factory using @faker-js/faker
//
// Generates dynamic, random test data for each test run.
// Benefits:
//   - Avoids hardcoded test data that can become stale
//   - Catches edge cases by varying input each run
//   - Useful for form testing, registration flows, and generating unique entries
//
// faker provides realistic data generators for names, emails, passwords,
// addresses, phone numbers, dates, and much more.
//
// Usage:
//   const user = generateUserData();
//   console.log(user.username);  // "john_doe_83"
//   console.log(user.email);     // "john.doe@example.com"

import { faker } from "@faker-js/faker";

// STRUCTURING TEST DATA VIA INTERFACES
// An interface defines the shape (blueprint) of a test data object —
// what fields it must have and what type each field is.
// Every object typed as UserData MUST include all these fields with the correct types.
// A missing field, a typo in a field name, or a wrong type causes a TypeScript
// compile-time error before any test runs — catching bugs early.
export interface UserData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
}

// Same concept applied to address data — a separate interface for a separate concern.
// Splitting into focused interfaces (UserData, AddressData) keeps each contract small
// and reusable independently.
export interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// EXPORTING DATA MODULES
// The `export` keyword makes interfaces and functions available to other files.
// This file acts as a centralised data module — one place that owns how test
// data is created. Test files import only what they need via named imports.
// To change data generation (e.g. switch faker to a different library), update
// this one file; every test that imports from here gets the change automatically.

// Generates a random user profile.
export function generateUserData(): UserData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    firstName,
    lastName,
    username: faker.internet.username({ firstName, lastName }),
    email: faker.internet.email({ firstName, lastName }),
    password: faker.internet.password({ length: 12 }),
    phone: faker.phone.number(),
  };
}

// Generates a random address.
export function generateAddressData(): AddressData {
  return {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    country: faker.location.country(),
  };
}

// Generates a random string of specified length — useful for boundary testing.
export function generateRandomString(length: number): string {
  return faker.string.alphanumeric(length);
}

// Generates a random number within a range.
export function generateRandomNumber(min: number, max: number): number {
  return faker.number.int({ min, max });
}

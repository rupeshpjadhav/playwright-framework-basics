import { test, expect } from "@playwright/test";

test("title test", async ({ page }) => {
  await page.goto("https://practicetestautomation.com/practice-test-login/");
  await expect(page).toHaveTitle("Test Login | Practice Test Automation");
});

test("valid login test", async ({ page }) => {
  await page.goto("https://practicetestautomation.com/practice-test-login/");

  //await page.getByRole("textbox", { name: "Username" }).click();
  await page.getByRole("textbox", { name: "Username" }).fill("student");

  //await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("Password123");

  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();

  await page.getByRole("link", { name: "Log out" }).click();
});

test("invalid username test", async ({ page }) => {
  await page.goto("https://practicetestautomation.com/practice-test-login/");

  await page.getByRole("textbox", { name: "Username" }).click();
  await page.getByRole("textbox", { name: "Username" }).fill("invaliduser");

  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("Password123");

  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.locator("#error").getByText("Your username is invalid!")).toBeVisible();
  //await expect(page.getByText("Your username is invalid!")).toBeVisible();
});

test("invalid password test", async ({ page }) => {
  await page.goto("https://practicetestautomation.com/practice-test-login/");

  await page.getByRole("textbox", { name: "Username" }).click();
  await page.getByRole("textbox", { name: "Username" }).fill("student");

  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("invalidpassword");

  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.locator("#error").getByText("Your password is invalid!")).toBeVisible();
});

import { test, expect } from "@playwright/test";

test("title test", async ({ page }) => {
  await page.goto("https://testautomationpractice.blogspot.com/");
  await expect(page).toHaveTitle(/Automation /);
});

test("link test", async ({ page }) => {
  await page.goto("https://testautomationpractice.blogspot.com/");
  await page.getByRole("link", { name: "PlaywrightPractice" }).click();
  await expect(page.getByRole("heading", { name: "Playwright" })).toBeVisible();
});

test("getRoleTest", async ({ page }) => {
  await page.goto("https://testautomationpractice.blogspot.com/");
  await page.getByRole("link", { name: "PlaywrightPractice" }).click();
  await expect(page.getByRole("heading", { name: "Playwright" })).toBeVisible();
  await page.getByRole("button", { name: "Primary Action" }).click();
  await expect(
    page.getByRole("button", { name: "Primary Action" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Toggle Button" }).click();
  await expect(
    page.getByRole("button", { name: "Toggle Button" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Username:" }).fill("rupeshj");
    await expect(page.getByRole("textbox", { name: "Username:" })).toHaveValue("rupeshj");
    // Fill the password field with the value "123456" and verify it by storing as variable
    const passwordField = page.getByRole("textbox", { name: "Password:"});
    await passwordField.fill("123456");
    await expect(passwordField).toHaveValue("123456");
  await page.getByRole("checkbox", { name: "Accept terms" }).check();
  await page.getByRole("button", { name: "Div with button role" }).click();
  await page.getByText("This is an important alert").click();
  await expect(page.getByText("This is an important alert")).toBeVisible();
  await page
    .locator("#role-locators")
    .getByRole("link", { name: "Home" })
    .click();
  await page
    .locator("#role-locators")
    .getByRole("link", { name: "Products" })
    .click();
  await page
    .locator("#role-locators")
    .getByRole("link", { name: "Contact" })
    .click();
  await expect(
    page.locator("#role-locators").getByRole("link", { name: "Home" }),
  ).toBeVisible();
  await expect(
    page.locator("#role-locators").getByRole("link", { name: "Products" }),
  ).toBeVisible();
  await expect(
    page.locator("#role-locators").getByRole("link", { name: "Contact" }),
  ).toBeVisible();
});

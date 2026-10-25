import { Page, Locator, expect } from "@playwright/test";

// Page object model for the login page.
// This class encapsulates page locators and actions in one reusable component.
export class LoginPage {
  page: Page;
  usernameField: Locator;
  passwordField: Locator;
  submitButton: Locator;
  successHeading: Locator;
  errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define all page locators in the constructor.
    // These locators are reused by every action method.
    this.usernameField = page.getByRole("textbox", { name: "Username" });
    this.passwordField = page.getByRole("textbox", { name: "Password" });
    this.submitButton = page.getByRole("button", { name: "Submit" });
    this.successHeading = page.getByRole("heading", { name: "Logged In Successfully" });
    this.errorMessage = page.locator("#error");
  }

  // Navigate to the login page URL.
  async navigateTo(url: string) {
    await this.page.goto(url);
  }

  // Enter the username text into the username field.
  async enterUsername(username: string) {
    await this.usernameField.fill(username);
  }

  // Enter the password text into the password field.
  async enterPassword(password: string) {
    await this.passwordField.fill(password);
  }

  // Click the submit button to send the login form.
  async clickSubmit() {
    await this.submitButton.click();
  }

  // Combined login action that enters username, password, and submits.
  async login(username: string, password: string) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickSubmit();
  }

  // Verify that the login succeeded by checking the success heading.
  async verifyLoginSuccess() {
    await expect(this.successHeading).toBeVisible();
  }

  // Verify that an error message is shown after failed login.
  async verifyErrorMessage(expectedMessage: string) {
    await expect(this.errorMessage).toContainText(expectedMessage);
  }
}

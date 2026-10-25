// Dialog Handling — alert, confirm, prompt
//
// Browsers have three types of native JavaScript dialogs:
//
//   alert("message")          → informational, one OK button
//   confirm("message")        → returns true (OK) or false (Cancel)
//   prompt("message", default) → returns entered text, or null if cancelled
//
// These dialogs BLOCK script execution until dismissed.
// In Playwright, you MUST register a handler BEFORE the action that
// triggers the dialog — otherwise the test hangs waiting for user input.
//
// TWO WAYS TO HANDLE DIALOGS
//
//   page.on("dialog", handler)    → handles EVERY dialog that appears (persistent)
//   page.once("dialog", handler)  → handles the NEXT dialog only (one-time)
//
// THE DIALOG OBJECT
//   dialog.type()     → "alert" | "confirm" | "prompt" | "beforeunload"
//   dialog.message()  → the message text shown to the user
//   dialog.accept(text?) → click OK (for prompt, optionally supply input text)
//   dialog.dismiss()  → click Cancel (or close)
//
// PRACTICE SITE
//   https://testautomationpractice.blogspot.com/
//   Buttons: "Simple Alert" (#alertBtn), "Confirmation Alert" (#confirmBtn), "Prompt Alert" (#promptBtn)
//
// RUNNING THESE TESTS
//   npx playwright test tests/interactions-dialogs.spec.ts --project=chromium

import { test, expect } from "@playwright/test";

const PRACTICE_URL = "https://testautomationpractice.blogspot.com/";

// ─────────────────────────────────────────────────────────────
// TEST 1: Simple Alert — accept and verify
//
// An alert has one button (OK). You MUST accept it or the test hangs.
// ─────────────────────────────────────────────────────────────

test("dialog: accept a simple alert", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  // Register the handler BEFORE clicking the button that triggers the dialog.
  // If you click first, the dialog appears before your handler is registered
  // and the test hangs indefinitely.
  page.once("dialog", async (dialog) => {
    // Verify this is an alert dialog.
    expect(dialog.type()).toBe("alert");

    // Verify the message text is what we expect.
    expect(dialog.message()).toBe("I am an alert box!");

    console.log(`[Dialog] Alert received: "${dialog.message()}"`);

    // Accept the dialog (clicks the OK button).
    await dialog.accept();
  });

  // Now trigger the dialog by clicking the button.
  await page.locator("#alertBtn").click();

  // After the dialog is dismissed, the page is interactive again.
  // Verify the page is still functional.
  await expect(page.locator("#alertBtn")).toBeVisible();
  console.log("[Dialog] Alert accepted — page continues normally");
});

// ─────────────────────────────────────────────────────────────
// TEST 2: Confirmation dialog — accept (OK)
//
// confirm() returns true when the user clicks OK.
// ─────────────────────────────────────────────────────────────

test("dialog: accept a confirmation dialog (click OK)", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    expect(dialog.message()).toBe("Press a button!");

    console.log(`[Dialog] Confirm received: "${dialog.message()}"`);

    // Accept = click OK → the JS function receives true.
    await dialog.accept();
  });

  await page.locator("#confirmBtn").click();

  // After accepting, the page shows a result in #demo.
  // Both confirm and prompt write their result to the same #demo element.
  await expect(page.locator("#demo")).toContainText("You pressed OK!");
  console.log("[Dialog] Confirm accepted — result verified");
});

// ─────────────────────────────────────────────────────────────
// TEST 3: Confirmation dialog — dismiss (Cancel)
//
// confirm() returns false when the user clicks Cancel.
// ─────────────────────────────────────────────────────────────

test("dialog: dismiss a confirmation dialog (click Cancel)", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");

    console.log(`[Dialog] Confirm received: "${dialog.message()}"`);

    // Dismiss = click Cancel → the JS function receives false.
    await dialog.dismiss();
  });

  await page.locator("#confirmBtn").click();

  // After dismissing, the result is written to #demo.
  await expect(page.locator("#demo")).toContainText("You pressed Cancel!");
  console.log("[Dialog] Confirm dismissed — cancel result verified");
});

// ─────────────────────────────────────────────────────────────
// TEST 4: Prompt dialog — enter text and accept
//
// prompt() shows an input field. Playwright passes text via dialog.accept(text).
// ─────────────────────────────────────────────────────────────

test("dialog: enter text in a prompt and accept", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  const nameToEnter = "Playwright User";

  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("prompt");
    expect(dialog.message()).toContain("Please enter your name");

    // The default value pre-filled in the prompt input.
    console.log(`[Dialog] Prompt default value: "${dialog.defaultValue()}"`);
    console.log(`[Dialog] Entering: "${nameToEnter}"`);

    // Pass the text to accept — this is what the user would type.
    await dialog.accept(nameToEnter);
  });

  await page.locator("#promptBtn").click();

  // The prompt function outputs: "Hello {name}! How are you today?"
  await expect(page.locator("#demo")).toContainText(`Hello ${nameToEnter}`);
  console.log(`[Dialog] Prompt accepted with "${nameToEnter}" — result verified`);
});

// ─────────────────────────────────────────────────────────────
// TEST 5: Prompt dialog — cancel (dismiss)
//
// If the user cancels a prompt, JS receives null.
// ─────────────────────────────────────────────────────────────

test("dialog: dismiss a prompt (cancel)", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("prompt");

    console.log(`[Dialog] Prompt received — dismissing (Cancel)`);

    // Dismiss = click Cancel → JS receives null.
    await dialog.dismiss();
  });

  await page.locator("#promptBtn").click();

  // The prompt function outputs: "User cancelled the prompt." on dismiss.
  await expect(page.locator("#demo")).toContainText("User cancelled the prompt.");
  console.log("[Dialog] Prompt dismissed — cancel result verified");
});

// ─────────────────────────────────────────────────────────────
// TEST 6: page.on() — handle multiple dialogs persistently
//
// page.once() handles only the NEXT dialog.
// page.on() handles EVERY dialog that appears.
// Use page.on() when multiple dialogs can appear during a test.
// ─────────────────────────────────────────────────────────────

test("dialog: page.on() handles multiple dialogs", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  const dialogLog: { type: string; message: string }[] = [];

  // Register a PERSISTENT handler — fires for every dialog throughout the test.
  page.on("dialog", async (dialog) => {
    dialogLog.push({ type: dialog.type(), message: dialog.message() });
    console.log(`[Dialog] Caught: type="${dialog.type()}" message="${dialog.message()}"`);

    // Accept all dialogs automatically.
    await dialog.accept();
  });

  // Trigger the first dialog.
  await page.locator("#alertBtn").click();

  // Small wait to let the first dialog handler run.
  await page.waitForTimeout(500);

  // Trigger the second dialog.
  await page.locator("#confirmBtn").click();
  await page.waitForTimeout(500);

  // Verify both dialogs were captured.
  expect(dialogLog).toHaveLength(2);
  expect(dialogLog[0].type).toBe("alert");
  expect(dialogLog[1].type).toBe("confirm");

  console.log(`[Dialog] Total dialogs handled: ${dialogLog.length}`);
});

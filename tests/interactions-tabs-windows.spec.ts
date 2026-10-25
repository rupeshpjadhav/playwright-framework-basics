// Multiple Tabs & Windows
//
// When a web application opens a new browser tab or window (via a link with
// target="_blank" or via window.open()), Playwright provides ways to get
// a reference to the new page and interact with it.
//
// KEY CONCEPTS
//
//   BrowserContext   → one browser instance — can hold many pages (tabs)
//   Page             → a single browser tab
//
//   All pages in the same context share: cookies, localStorage, sessions.
//   A new context is isolated — fresh cookies, no shared storage.
//
// HOW TO CAPTURE A NEW TAB
//
//   Method 1: context.waitForEvent("page")
//     Returns a promise that resolves when a new page is created.
//     Start the promise BEFORE the action that opens the tab.
//
//   Method 2: page.waitForEvent("popup")
//     Same as above but listens on the page level.
//
// PRACTICE SITE
//   https://testautomationpractice.blogspot.com/
//   "New Tab" button   → window.open("https://www.pavantestingtools.com/")
//   "Popup Windows"    → opens selenium.dev AND playwright.dev simultaneously
//
// RUNNING THESE TESTS
//   npx playwright test tests/interactions-tabs-windows.spec.ts --project=chromium

import { test, expect } from "@playwright/test";

const PRACTICE_URL = "https://testautomationpractice.blogspot.com/";

// ─────────────────────────────────────────────────────────────
// TEST 1: Open a new tab and interact with it
//
// "New Tab" button calls window.open("https://www.pavantestingtools.com/")
// ─────────────────────────────────────────────────────────────

test("tabs: open new tab and interact with it", async ({ page, context }) => {
  await page.goto(PRACTICE_URL);

  // IMPORTANT: Start listening for the new page BEFORE clicking.
  // waitForEvent("page") returns a Promise that resolves when a new
  // page is added to this browser context.
  const newPagePromise = context.waitForEvent("page");

  // Click the button that triggers window.open().
  await page.getByRole("button", { name: "New Tab" }).click();

  // Await the promise — this gives us a reference to the new tab.
  const newTab = await newPagePromise;

  // Wait for the new tab to finish loading.
  await newTab.waitForLoadState("domcontentloaded");

  console.log(`[Tabs] New tab URL: ${newTab.url()}`);

  // Verify the new tab opened the correct URL.
  expect(newTab.url()).toContain("pavantestingtools");

  // Verify the new tab has a title (it loaded something).
  const newTabTitle = await newTab.title();
  console.log(`[Tabs] New tab title: ${newTabTitle}`);
  expect(newTabTitle.length).toBeGreaterThan(0);

  // The ORIGINAL page is still accessible — the main tab didn't navigate away.
  await expect(page.getByRole("button", { name: "New Tab" })).toBeVisible();
  console.log(`[Tabs] Original page URL still: ${page.url()}`);

  // Close the new tab when done.
  await newTab.close();
});

// ─────────────────────────────────────────────────────────────
// TEST 2: Switch between original and new tab
//
// Shows how to work with two tabs simultaneously:
// perform actions on the new tab, then switch back.
// ─────────────────────────────────────────────────────────────

test("tabs: switch between original and new tab", async ({ page, context }) => {
  await page.goto(PRACTICE_URL);

  const newPagePromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "New Tab" }).click();
  const newTab = await newPagePromise;
  await newTab.waitForLoadState("domcontentloaded");

  // Interact with the NEW tab.
  console.log(`[Tabs] Switched to new tab: ${newTab.url()}`);
  const newTabTitle = await newTab.title();
  expect(newTabTitle.length).toBeGreaterThan(0);

  // Switch back to the ORIGINAL tab by referencing `page`.
  // In Playwright, `page` always refers to the original tab.
  console.log(`[Tabs] Switching back to original tab: ${page.url()}`);
  await page.bringToFront(); // makes the original tab the active one

  // Verify we're back on the original page.
  await expect(page.locator("#alertBtn")).toBeVisible();
  await expect(page).toHaveURL(PRACTICE_URL);

  await newTab.close();
});

// ─────────────────────────────────────────────────────────────
// TEST 3: Multiple popup windows opened simultaneously
//
// "Popup Windows" button opens TWO new windows at once:
//   - selenium.dev
//   - playwright.dev
//
// Use context.pages() to get all open pages.
// ─────────────────────────────────────────────────────────────

test("tabs: handle multiple popup windows", async ({ page, context }) => {
  await page.goto(PRACTICE_URL);

  // We expect 2 new pages to open. We'll wait for each one.
  const firstPopupPromise  = context.waitForEvent("page");
  const secondPopupPromise = context.waitForEvent("page");

  // Click the button that opens two windows simultaneously.
  await page.locator("#PopUp").click();

  const firstPopup  = await firstPopupPromise;
  const secondPopup = await secondPopupPromise;

  await firstPopup.waitForLoadState("domcontentloaded");
  await secondPopup.waitForLoadState("domcontentloaded");

  console.log(`[Tabs] First popup URL:  ${firstPopup.url()}`);
  console.log(`[Tabs] Second popup URL: ${secondPopup.url()}`);

  // Verify both popups opened — check by URL content (flexible to redirects).
  const urls = [firstPopup.url(), secondPopup.url()];
  console.log(`[Tabs] All popup URLs: ${JSON.stringify(urls)}`);

  // At least one popup should be selenium.dev
  const hasSelenium = urls.some((u) => u.includes("selenium"));
  expect(hasSelenium, "selenium.dev popup expected").toBeTruthy();

  // Both popups must have navigated somewhere (not about:blank).
  expect(firstPopup.url()).not.toBe("about:blank");
  expect(secondPopup.url()).not.toBe("about:blank");

  // context.pages() returns ALL open pages — original + both popups.
  const allPages = context.pages();
  console.log(`[Tabs] Total open tabs: ${allPages.length}`);
  expect(allPages.length).toBeGreaterThanOrEqual(2); // original + at least 1 popup

  await firstPopup.close();
  await secondPopup.close();
});

// ─────────────────────────────────────────────────────────────
// TEST 4: page.waitForEvent("popup") — page-level listener
//
// Alternative to context.waitForEvent("page").
// Used when the popup is triggered by clicking a specific element
// and you want to associate the listener with that page action.
// ─────────────────────────────────────────────────────────────

test("tabs: page.waitForEvent popup", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  // page.waitForEvent("popup") resolves when a new window/tab is opened
  // by THIS page (via window.open or target="_blank" link).
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "New Tab" }).click();
  const popup = await popupPromise;

  await popup.waitForLoadState("domcontentloaded");

  console.log(`[Tabs] Popup URL: ${popup.url()}`);
  expect(popup.url()).toContain("pavantestingtools");

  await popup.close();
});

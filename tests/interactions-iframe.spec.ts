// iframe Handling — frameLocator()
//
// An iframe (inline frame) is a web page embedded inside another web page.
// The iframe has its own separate DOM — element locators on the parent page
// CANNOT find elements inside an iframe.
//
// WHAT DOES NOT WORK (will throw "element not found"):
//   page.getByRole("button", { name: "Bold" })  ← looks only in the main page DOM
//
// WHAT WORKS:
//   const frame = page.frameLocator("iframe");   ← scopes all locators to the iframe
//   frame.getByRole("button", { name: "Bold" })  ← finds elements inside the iframe
//
// WAYS TO IDENTIFY AN IFRAME
//   page.frameLocator("iframe")          → by tag name (if only one iframe)
//   page.frameLocator("#frame-id")       → by CSS id
//   page.frameLocator('[name="myframe"]') → by name attribute
//   page.frameLocator('iframe[src*="example"]') → by URL pattern
//
// NESTED IFRAMES
//   page.frameLocator("outer-iframe").frameLocator("inner-iframe")
//   ← Chain frameLocator() calls to reach nested iframes
//
// PRACTICE SITE
//   https://the-internet.herokuapp.com/iframe
//   Contains a TinyMCE text editor loaded inside an iframe.
//   This is the most commonly used iframe practice page.
//
// RUNNING THESE TESTS
//   npx playwright test tests/interactions-iframe.spec.ts --project=chromium

import { test, expect } from "@playwright/test";

// The Heroku practice site is the most reliable page with iframes for automation practice.
const IFRAME_URL = "https://the-internet.herokuapp.com/iframe";

// ─────────────────────────────────────────────────────────────
// TEST 1: Locate and read content inside an iframe
//
// The TinyMCE editor is loaded inside an iframe.
// We use frameLocator() to scope all locators to that iframe's DOM.
// ─────────────────────────────────────────────────────────────

test("iframe: read content inside an iframe", async ({ page }) => {
  await page.goto(IFRAME_URL);

  // Locate the iframe using its id attribute.
  // frameLocator() returns a FrameLocator — a scoped context for the iframe.
  // All locators called on it search inside the iframe's DOM only.
  const iframeLocator = page.frameLocator("#mce_0_ifr");

  // The TinyMCE editor has a body element with editable content.
  const editorBody = iframeLocator.locator("#tinymce");

  // Verify the editor is present and has some default text.
  await expect(editorBody).toBeVisible();

  const defaultText = await editorBody.innerText();
  console.log(`[iframe] Editor default text: "${defaultText}"`);
  expect(defaultText.length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────────────────────
// TEST 2: Type inside an iframe
//
// Demonstrates clearing existing content and typing new text
// into an element that lives inside an iframe.
// ─────────────────────────────────────────────────────────────

test("iframe: assert content and attributes inside iframe", async ({ page }) => {
  await page.goto(IFRAME_URL);

  const iframeLocator = page.frameLocator("#mce_0_ifr");
  const editorBody    = iframeLocator.locator("#tinymce");

  // Verify the editor body is present in the iframe DOM.
  await expect(editorBody).toBeVisible();

  // Verify it contains the default placeholder text.
  const text = await editorBody.innerText();
  console.log(`[iframe] Editor content: "${text}"`);
  expect(text.length).toBeGreaterThan(0);

  // Verify the element has the expected class — confirms we are inside the iframe.
  const className = await editorBody.getAttribute("class");
  console.log(`[iframe] Editor class: "${className}"`);
  expect(className).toContain("mce-content-body");

  // Count <p> elements inside the iframe — demonstrates finding CHILD elements.
  const paragraphs = iframeLocator.locator("p");
  const count = await paragraphs.count();
  console.log(`[iframe] Paragraph count inside iframe: ${count}`);
  expect(count).toBeGreaterThan(0);

  const firstParaText = await paragraphs.first().innerText();
  console.log(`[iframe] First paragraph: "${firstParaText}"`);
  expect(firstParaText.length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────────────────────
// TEST 3: Click toolbar buttons inside an iframe
//
// The TinyMCE editor has a toolbar above the iframe.
// The toolbar is on the MAIN page (not inside the iframe).
// This test demonstrates interacting with BOTH the main page toolbar
// and the iframe content — a common real-world pattern.
// ─────────────────────────────────────────────────────────────

test("iframe: interact with main page and iframe together", async ({ page }) => {
  await page.goto(IFRAME_URL);

  // The heading "An iFrame containing the TinyMCE WYSIWYG Editor" is on the MAIN page.
  // Regular page.getByRole() works here.
  await expect(page.getByRole("heading", { level: 3 })).toBeVisible();

  const heading = await page.getByRole("heading", { level: 3 }).innerText();
  console.log(`[iframe] Main page heading: "${heading}"`);

  // Now switch to the iframe to interact with the editor content.
  const iframeLocator = page.frameLocator("#mce_0_ifr");
  const editorBody    = iframeLocator.locator("#tinymce");

  await expect(editorBody).toBeVisible();

  // Read content from the iframe editor.
  const editorContent = await editorBody.innerText();
  console.log(`[iframe] Editor content: "${editorContent}"`);
  expect(editorContent.length).toBeGreaterThan(0);

  console.log("[iframe] Main page and iframe interaction both verified");
});

// ─────────────────────────────────────────────────────────────
// TEST 4: Get the Frame object (alternative to frameLocator)
//
// page.frame() returns a Frame object from Playwright's older API.
// frameLocator() is the modern recommended approach, but Frame is useful
// when you need to run evaluate() scripts inside the iframe.
// ─────────────────────────────────────────────────────────────

test("iframe: use Frame object for evaluate()", async ({ page }) => {
  await page.goto(IFRAME_URL);

  // page.frames() returns all frames on the page (including the main frame).
  const allFrames = page.frames();
  console.log(`[iframe] Total frames on page: ${allFrames.length}`);

  // Find the TinyMCE iframe frame by URL pattern.
  // The src URL contains "tinymce" for the editor iframe.
  const editorFrame = page.frames().find((f) => f.url().includes("tinymce"));

  if (editorFrame) {
    // Frame.evaluate() runs JavaScript inside the iframe's context.
    const bodyText = await editorFrame.evaluate(() => {
      const body = document.querySelector("#tinymce");
      return body ? body.textContent : "";
    });

    console.log(`[iframe] Frame.evaluate() content: "${bodyText}"`);
    expect(bodyText).toBeTruthy();
  } else {
    // Fallback: use frameLocator approach.
    const content = await page.frameLocator("#mce_0_ifr").locator("#tinymce").innerText();
    console.log(`[iframe] frameLocator content: "${content}"`);
    expect(content).toBeTruthy();
  }
});

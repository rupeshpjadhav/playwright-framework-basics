// Drag and Drop — locator.dragTo()
//
// Drag and drop is a user interaction where an element is pressed (mousedown),
// moved across the screen, and released (mouseup) on a target.
//
// PLAYWRIGHT DRAG AND DROP METHODS
//
//   Method 1: locator.dragTo(targetLocator)          ← simplest, recommended
//     Automatically calculates source and target centers and performs the drag.
//
//   Method 2: page.dragAndDrop(sourceSelector, targetSelector)  ← page-level
//     Selector-based version, does the same as dragTo() under the hood.
//
//   Method 3: Manual mouse events (for complex cases)
//     page.mouse.move(x, y)
//     page.mouse.down()
//     page.mouse.move(targetX, targetY, { steps: N })  ← N steps = smoother drag
//     page.mouse.up()
//
// WHEN TO USE MANUAL MOUSE EVENTS
//   Some libraries (jQuery UI, Sortable.js) detect drag speed.
//   A single-step move can be ignored by these libraries.
//   Using steps: 10 or more simulates a more realistic drag trajectory.
//
// PRACTICE SITE
//   https://testautomationpractice.blogspot.com/
//   #draggable — "Drag me to my target"   (uses jQuery UI draggable)
//   #droppable — "Drop here"               (uses jQuery UI droppable)
//
// RUNNING THESE TESTS
//   npx playwright test tests/interactions-drag-drop.spec.ts --project=chromium

import { test, expect } from "@playwright/test";

const PRACTICE_URL = "https://testautomationpractice.blogspot.com/";

// ─────────────────────────────────────────────────────────────
// TEST 1: Basic drag and drop — locator.dragTo()
//
// The simplest approach. Playwright handles all mouse events internally.
// ─────────────────────────────────────────────────────────────

test("drag-drop: basic drag to target using dragTo()", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  const draggable = page.locator("#draggable");
  const droppable = page.locator("#droppable");

  // Verify both elements exist before attempting the drag.
  await expect(draggable).toBeVisible();
  await expect(droppable).toBeVisible();

  const initialText = await droppable.innerText();
  console.log(`[DragDrop] Before drag — droppable text: "${initialText}"`);

  // dragTo() presses the draggable, moves to the droppable center, and releases.
  await draggable.dragTo(droppable);

  // After a successful drop, jQuery UI updates the droppable text to "Dropped!".
  await expect(droppable).toContainText("Dropped!");
  console.log("[DragDrop] Drop confirmed — droppable text updated");
});

// ─────────────────────────────────────────────────────────────
// TEST 2: Drag and drop using page.dragAndDrop()
//
// Page-level alternative using CSS selectors instead of locators.
// ─────────────────────────────────────────────────────────────

test("drag-drop: page.dragAndDrop() selector-based", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  await expect(page.locator("#draggable")).toBeVisible();
  await expect(page.locator("#droppable")).toBeVisible();

  // page.dragAndDrop() takes CSS selectors for source and target.
  // Internally equivalent to draggable.dragTo(droppable).
  await page.dragAndDrop("#draggable", "#droppable");

  await expect(page.locator("#droppable")).toContainText("Dropped!");
  console.log("[DragDrop] page.dragAndDrop() completed successfully");
});

// ─────────────────────────────────────────────────────────────
// TEST 3: dragTo() with explicit sourcePosition and targetPosition
//
// Sometimes you need precise control over WHERE on an element the drag
// starts and WHERE it ends — for example:
//   - A card that can only be dragged from its header, not its body
//   - A resize handle at a specific corner of an element
//   - A sortable list where drop position determines sort order
//
// dragTo() accepts optional sourcePosition and targetPosition offsets
// (in pixels, relative to the element's top-left corner).
//
// NOTE ON MANUAL MOUSE EVENTS (page.mouse.move/down/up):
//   Raw mouse events often DO NOT work with jQuery UI draggable because
//   jQuery UI registers drag only through specific jQuery event bindings,
//   not native browser mousemove events. Always prefer dragTo() or
//   dragAndDrop() over manual mouse events for jQuery UI elements.
// ─────────────────────────────────────────────────────────────

test("drag-drop: dragTo() with explicit source and target positions", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  const draggable = page.locator("#draggable");
  const droppable = page.locator("#droppable");

  await expect(draggable).toBeVisible();
  await expect(droppable).toBeVisible();

  const dragBox = await draggable.boundingBox();
  const dropBox = await droppable.boundingBox();

  if (!dragBox || !dropBox) {
    throw new Error("Could not get bounding boxes for drag/drop elements");
  }

  console.log(`[DragDrop] Source element: ${JSON.stringify(dragBox)}`);
  console.log(`[DragDrop] Target element: ${JSON.stringify(dropBox)}`);

  // dragTo() with explicit positions:
  //   sourcePosition: where on the source element to grab (relative to its top-left)
  //   targetPosition: where on the target element to drop (relative to its top-left)
  await draggable.dragTo(droppable, {
    sourcePosition: { x: dragBox.width  / 2, y: dragBox.height / 2 },  // grab from center
    targetPosition: { x: dropBox.width  / 2, y: dropBox.height / 2 },  // drop at center
  });

  await expect(droppable).toContainText("Dropped!");
  console.log("[DragDrop] dragTo() with explicit positions — drop confirmed");
});

// ─────────────────────────────────────────────────────────────
// TEST 4: Verify drag element state before and after drop
//
// Demonstrates a full assertion pattern: check initial state,
// perform drag, verify final state of both elements.
// ─────────────────────────────────────────────────────────────

test("drag-drop: verify element states before and after drop", async ({ page }) => {
  await page.goto(PRACTICE_URL);

  const draggable = page.locator("#draggable");
  const droppable = page.locator("#droppable");

  // ── BEFORE DRAG ─────────────────────────────────────────────
  await expect(draggable).toBeVisible();
  await expect(droppable).toBeVisible();

  const beforeDrag = await droppable.innerText();
  console.log(`[DragDrop] Before: droppable says "${beforeDrag}"`);

  // The droppable should not say "Dropped!" before the drag.
  expect(beforeDrag).not.toContain("Dropped!");

  const draggableText = await draggable.innerText();
  console.log(`[DragDrop] Dragging: "${draggableText}"`);

  // ── PERFORM DRAG ────────────────────────────────────────────
  await draggable.dragTo(droppable);

  // ── AFTER DRAG ──────────────────────────────────────────────
  const afterDrag = await droppable.innerText();
  console.log(`[DragDrop] After: droppable says "${afterDrag}"`);

  // The droppable text changes to "Dropped!" on successful drop.
  await expect(droppable).toContainText("Dropped!");
});

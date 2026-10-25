// Network Mocking & Interception — page.route()
//
// page.route() intercepts every network request that matches a URL pattern
// BEFORE it reaches the server. You can then:
//
//   fulfill()  — Return a fake response immediately (mock the server).
//                The browser never actually contacts the real server.
//
//   abort()    — Cancel the request entirely.
//                The browser receives a network error for that URL.
//
//   continue() — Let the request proceed as normal, optionally modifying
//                headers or the request body before it goes out.
//
// WHY USE NETWORK MOCKING?
//   - Speed: replace slow real API calls with instant fake responses.
//   - Isolation: test UI behaviour without depending on a backend being up.
//   - Control: simulate error states (500, 401, 429) that are hard to trigger
//     against a real server.
//   - Determinism: always return the exact same data so tests are repeatable.
//   - Security: avoid hitting real payment or email APIs during tests.
//
// URL PATTERNS accepted by page.route():
//   - Exact URL:    "https://example.com/api/login"
//   - Glob pattern: "**/api/**"
//   - RegExp:       /.*\/api\/login.*/
//
// RUNNING THESE TESTS
//   npx playwright test tests/login-network-mock.spec.ts
//   npx playwright test tests/login-network-mock.spec.ts --project=chromium

import { test, expect } from "@playwright/test";

const LOGIN_URL = "https://practicetestautomation.com/practice-test-login/";

// ─────────────────────────────────────────────────────────────
// TEST 1: Block images to speed up page load
//
// Images are often the largest resources on a page.
// Blocking them during automated tests speeds up navigation
// without affecting the functional elements (forms, buttons, text).
// ─────────────────────────────────────────────────────────────

test("network: block images to speed up page load", async ({ page }) => {
  // Register a route handler for all image resource types.
  // The glob "**/*" matches any URL; we filter by resourceType() inside.
  await page.route("**/*", (route) => {
    const type = route.request().resourceType();

    // Abort requests for images, fonts, and stylesheets.
    // These don't affect test logic but add load time.
    if (["image", "font", "stylesheet"].includes(type)) {
      route.abort();    // cancel — browser gets a network error for this resource
    } else {
      route.continue(); // all other requests (HTML, JS, XHR) proceed normally
    }
  });

  const start = Date.now();
  await page.goto(LOGIN_URL);
  const loadTime = Date.now() - start;

  console.log(`[Network Mock] Page loaded in ${loadTime}ms (images blocked)`);

  // The login form elements must still be present and functional.
  await expect(page.getByRole("textbox", { name: "Username" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  await expect(page.getByRole("button",  { name: "Submit"   })).toBeVisible();
});

// ─────────────────────────────────────────────────────────────
// TEST 2: Fulfill — return a fake/mocked API response
//
// This is the most powerful mocking technique.
// We intercept a request and return a hand-crafted response
// without ever contacting the real server.
//
// Use case: test how your UI handles a specific API response
// (e.g., a 500 error, a slow response, or custom JSON data)
// without needing the backend to be in that state.
// ─────────────────────────────────────────────────────────────

test("network: fulfill — mock a JSON API response", async ({ page }) => {
  // Intercept requests to the JSONPlaceholder API and return fake data.
  await page.route("**/jsonplaceholder.typicode.com/posts/1", (route) => {
    // fulfill() returns a complete fake HTTP response.
    // The browser receives this as if it came from the real server.
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        title: "Mocked Title — Returned by Playwright",
        body: "This response never touched the real server.",
        userId: 99,
      }),
    });
  });

  // Navigate to the login page as normal (not mocked).
  await page.goto(LOGIN_URL);

  // Now make an API call from inside the browser using fetch().
  // Playwright intercepts it and returns our mocked response.
  const apiData = await page.evaluate(async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    return res.json();
  });

  // Verify the mocked data came back (not the real server data).
  expect(apiData.title).toBe("Mocked Title — Returned by Playwright");
  expect(apiData.userId).toBe(99);

  console.log("[Network Mock] API response was intercepted and mocked successfully");
});

// ─────────────────────────────────────────────────────────────
// TEST 3: Fulfill — simulate a server error (500)
//
// It is very hard to make a real server return a 500 error on demand.
// With page.route() you can simulate any error code instantly.
// This lets you test how your UI handles failures gracefully.
// ─────────────────────────────────────────────────────────────

test("network: fulfill — simulate 500 server error response", async ({ page }) => {
  // Mock any request to the JSONPlaceholder API with a 500 error.
  await page.route("**/jsonplaceholder.typicode.com/**", (route) => {
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Internal Server Error (simulated)" }),
    });
  });

  await page.goto(LOGIN_URL);

  // Make a fetch() from the browser — it will receive the 500 response.
  const status = await page.evaluate(async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    return res.status;
  });

  expect(status).toBe(500);
  console.log("[Network Mock] 500 error simulated successfully");
});

// ─────────────────────────────────────────────────────────────
// TEST 4: Abort — block a specific resource entirely
//
// abort() drops the request — the browser receives a network error.
// Use this to test offline behaviour, blocked CDN scripts,
// or to prevent analytics/tracking calls during tests.
// ─────────────────────────────────────────────────────────────

test("network: abort — block a specific URL", async ({ page }) => {
  // Track whether the blocked URL was actually intercepted.
  let wasIntercepted = false;

  // Block any request to Google Analytics (a common pattern in CI tests).
  await page.route("**/google-analytics.com/**", (route) => {
    wasIntercepted = true;
    console.log(`[Network Mock] Blocked: ${route.request().url()}`);
    route.abort(); // The browser gets a "net::ERR_FAILED" for this URL.
  });

  await page.goto(LOGIN_URL);

  // The login page should still load and be fully functional.
  await expect(page.getByRole("textbox", { name: "Username" })).toBeVisible();
  await expect(page.getByRole("button",  { name: "Submit"   })).toBeVisible();

  // Note: Google Analytics may or may not be used by this specific site.
  // This test demonstrates the pattern regardless of whether it intercepts.
  console.log(`[Network Mock] Google Analytics blocked: ${wasIntercepted}`);
});

// ─────────────────────────────────────────────────────────────
// TEST 5: Continue — modify a request before it goes out
//
// continue() lets the original request proceed but with modifications:
//   - Add/change request headers (e.g., inject an auth token)
//   - Change the POST body
//   - Override the URL
//
// Use case: inject authentication headers for API tests
// without having to log in through the UI first.
// ─────────────────────────────────────────────────────────────

test("network: continue — add custom request headers", async ({ page }) => {
  // Intercept all requests and add a custom header before they proceed.
  await page.route("**/*", (route) => {
    route.continue({
      headers: {
        // Preserve all existing headers.
        ...route.request().headers(),
        // Add a custom automation marker header.
        // On a real project this could be: 'Authorization': 'Bearer <token>'
        "X-Automated-Test": "playwright",
        "X-Test-Environment": "local",
      },
    });
  });

  await page.goto(LOGIN_URL);
  await expect(page.getByRole("textbox", { name: "Username" })).toBeVisible();

  console.log("[Network Mock] Custom headers injected into all requests");
});

// ─────────────────────────────────────────────────────────────
// TEST 6: Intercept and log all requests made during a test
//
// A read-only interception — inspect every request/response
// without modifying anything. Useful for debugging or
// verifying that specific API calls were made.
// ─────────────────────────────────────────────────────────────

test("network: intercept and log all requests", async ({ page }) => {
  const capturedRequests: { method: string; url: string }[] = [];

  // page.on("request") fires for every outgoing request (read-only, no routing).
  page.on("request", (req) => {
    capturedRequests.push({ method: req.method(), url: req.url() });
  });

  await page.goto(LOGIN_URL);
  await page.getByRole("textbox", { name: "Username" }).fill("student");
  await page.getByRole("textbox", { name: "Password" }).fill("Password123");
  await page.getByRole("button",  { name: "Submit"   }).click();
  await expect(page.getByRole("heading", { name: "Logged In Successfully" })).toBeVisible();

  console.log(`[Network Mock] Total requests captured: ${capturedRequests.length}`);

  // Log the first 5 requests for demonstration.
  capturedRequests.slice(0, 5).forEach((r) => {
    console.log(`  ${r.method} ${r.url}`);
  });

  // At minimum the page navigation request must have been captured.
  expect(capturedRequests.length).toBeGreaterThan(0);

  const navigationRequest = capturedRequests.find((r) =>
    r.url.includes("practice-test-login")
  );
  expect(navigationRequest).toBeDefined();
});

// API Testing — Playwright's built-in `request` context
//
// Playwright has a built-in HTTP client called APIRequestContext.
// It lets you make REST API calls (GET, POST, PUT, DELETE, etc.)
// directly from your test code — without opening a browser page.
//
// WHY TEST APIS SEPARATELY?
//   Browser UI tests are slow: they open a browser, navigate, render HTML,
//   find elements, click, and wait. An API test is 10-50x faster because
//   it sends HTTP requests directly over the network.
//
//   Use API tests for:
//     - Verifying backend logic without the UI
//     - Setting up test data before a UI test (e.g., create a user via API,
//       then test the UI login — faster than registering through the form)
//     - Contract testing — verifying the API shape hasn't changed
//
// PLAYWRIGHT FIXTURES USED
//   `request` — Playwright's built-in APIRequestContext fixture.
//               Available in every test just like `page`.
//               No extra import or setup needed.
//
// TARGET API
//   JSONPlaceholder (https://jsonplaceholder.typicode.com/)
//   A free, public fake REST API used for prototyping and testing.
//   Supports: /posts, /users, /todos, /comments, /albums, /photos
//
// RUNNING ONLY API TESTS
//   npx playwright test tests/api-request.spec.ts
//   npx playwright test tests/api-request.spec.ts --project=chromium

import { test, expect } from "@playwright/test";

const BASE_URL = "https://jsonplaceholder.typicode.com";

// ─────────────────────────────────────────────────────────────
// TEST 1: GET a single resource
//
// The most basic API test — fetch one item and verify its shape.
// `request.get()` sends an HTTP GET request and returns a response object.
// ─────────────────────────────────────────────────────────────

test("api: GET /posts/1 returns correct post", async ({ request }) => {
  // Send a GET request to /posts/1.
  // `request` is injected by Playwright just like `page`.
  const response = await request.get(`${BASE_URL}/posts/1`);

  // Assert the HTTP status code is 200 OK.
  // `response.ok()` returns true for any 2xx status code.
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  // Parse the response body as JSON.
  const body = await response.json();

  // Verify the response shape — the API contract.
  // If the backend renames "title" to "heading", this test catches it immediately.
  expect(body).toHaveProperty("id", 1);
  expect(body).toHaveProperty("userId");
  expect(body).toHaveProperty("title");
  expect(body).toHaveProperty("body");

  // Verify data types — title must be a non-empty string.
  expect(typeof body.title).toBe("string");
  expect(body.title.length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────────────────────
// TEST 2: GET a list of resources
//
// Verifies that a collection endpoint returns an array
// with the expected count and item shape.
// ─────────────────────────────────────────────────────────────

test("api: GET /posts returns list of 100 posts", async ({ request }) => {
  const response = await request.get(`${BASE_URL}/posts`);

  expect(response.status()).toBe(200);

  const posts = await response.json();

  // The response must be an array, not an object.
  expect(Array.isArray(posts)).toBeTruthy();

  // JSONPlaceholder has exactly 100 posts.
  expect(posts).toHaveLength(100);

  // Spot-check the first item has all required fields.
  const first = posts[0];
  expect(first).toHaveProperty("id");
  expect(first).toHaveProperty("userId");
  expect(first).toHaveProperty("title");
  expect(first).toHaveProperty("body");
});

// ─────────────────────────────────────────────────────────────
// TEST 3: GET with query parameters
//
// Many APIs support filtering via query params: /posts?userId=1
// Playwright's request.get() accepts a `params` option for this.
// ─────────────────────────────────────────────────────────────

test("api: GET /posts filtered by userId returns matching posts", async ({ request }) => {
  const response = await request.get(`${BASE_URL}/posts`, {
    // `params` is automatically URL-encoded and appended as a query string.
    // This sends: GET /posts?userId=1
    params: { userId: 1 },
  });

  expect(response.status()).toBe(200);

  const posts = await response.json();

  // User 1 has exactly 10 posts in JSONPlaceholder.
  expect(posts).toHaveLength(10);

  // Every returned post must belong to userId 1.
  // This verifies the API actually filtered, not just returned everything.
  for (const post of posts) {
    expect(post.userId).toBe(1);
  }
});

// ─────────────────────────────────────────────────────────────
// TEST 4: POST — create a new resource
//
// POST sends a request body to create a new record.
// JSONPlaceholder fakes the creation (doesn't persist),
// but returns 201 Created with the new resource including an id.
// ─────────────────────────────────────────────────────────────

test("api: POST /posts creates a new post and returns 201", async ({ request }) => {
  // Define the request body — the new resource to create.
  const newPost = {
    title: "Playwright API Test",
    body: "This post was created by an automated API test.",
    userId: 1,
  };

  // `request.post()` sends a POST with a JSON body.
  // The `data` option sets Content-Type: application/json automatically.
  const response = await request.post(`${BASE_URL}/posts`, {
    data: newPost,
  });

  // 201 Created — the resource was successfully created.
  expect(response.status()).toBe(201);

  const body = await response.json();

  // The API echoes back the posted fields plus an assigned id.
  expect(body.title).toBe(newPost.title);
  expect(body.body).toBe(newPost.body);
  expect(body.userId).toBe(newPost.userId);

  // JSONPlaceholder assigns id 101 to new posts.
  expect(body).toHaveProperty("id");
  expect(typeof body.id).toBe("number");
});

// ─────────────────────────────────────────────────────────────
// TEST 5: Check response headers
//
// APIs communicate metadata through HTTP headers:
//   Content-Type  — format of the response body (application/json)
//   Cache-Control — caching behaviour
//   X-RateLimit   — rate limit remaining (on real APIs)
// ─────────────────────────────────────────────────────────────

test("api: GET /posts/1 response has correct Content-Type header", async ({ request }) => {
  const response = await request.get(`${BASE_URL}/posts/1`);

  // response.headers() returns all headers as a plain object (lowercase keys).
  const headers = response.headers();

  // The API must return JSON, not HTML or plain text.
  expect(headers["content-type"]).toContain("application/json");
});

// ─────────────────────────────────────────────────────────────
// TEST 6: 404 — resource not found
//
// Negative testing at the API level — verify the correct
// error status is returned for invalid resource IDs.
// ─────────────────────────────────────────────────────────────

test("api: GET /posts/9999 returns 404 not found", async ({ request }) => {
  // Post ID 9999 does not exist in JSONPlaceholder.
  const response = await request.get(`${BASE_URL}/posts/9999`);

  // The API must return 404 Not Found, not 200 with an empty body.
  expect(response.status()).toBe(404);

  // response.ok() must be false for 4xx/5xx responses.
  expect(response.ok()).toBeFalsy();
});

// ─────────────────────────────────────────────────────────────
// TEST 7: API + UI combined
//
// The most powerful pattern: use the API to set up state, then
// verify it in the UI (or vice versa).
//
// Real-world example: call a login API to get an auth token,
// set it as a cookie, then navigate to a protected page —
// skipping the slow UI login form entirely.
//
// This demo: fetch a post via API, verify its title,
// then check the same content in the UI version of the page.
// ─────────────────────────────────────────────────────────────

test("api: verify post via API before checking UI", async ({ request, page }) => {
  // Step 1: Fetch the post data via API (fast).
  const apiResponse = await request.get(`${BASE_URL}/posts/1`);
  expect(apiResponse.ok()).toBeTruthy();
  const post = await apiResponse.json();

  // Step 2: Verify the API returned a valid post with a title.
  expect(post.title).toBeTruthy();
  expect(post.id).toBe(1);

  // Step 3: If there were a UI page for this post, you would navigate to it
  // and verify the same title appears on screen.
  // This pattern avoids repeating the same assertion in two places:
  // the API confirms the data exists; the UI confirms it's displayed.
  //
  // Example (commented — this URL does not exist in JSONPlaceholder):
  // await page.goto(`https://example.com/posts/${post.id}`);
  // await expect(page.getByRole("heading")).toContainText(post.title);

  // For now we just confirm the API contract is solid.
  expect(typeof post.title).toBe("string");
  expect(post.userId).toBeGreaterThan(0);
});

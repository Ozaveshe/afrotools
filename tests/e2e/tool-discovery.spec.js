const { test, expect } = require("@playwright/test");

async function quietExternalNoise(page) {
  await page.route("**/*", async function (route) {
    const url = new URL(route.request().url());
    if (url.hostname === "www.googletagmanager.com") {
      return route.fulfill({ contentType: "application/javascript; charset=utf-8", body: "" });
    }
    if (url.hostname === "fonts.googleapis.com") {
      return route.fulfill({ contentType: "text/css; charset=utf-8", body: "" });
    }
    if (url.hostname === "fonts.gstatic.com") return route.abort();
    return route.continue();
  });
}

test("/tools/ ships a crawlable static directory", async ({ request }) => {
  const response = await request.get("/tools/");
  expect(response.status()).toBeLessThan(400);

  const html = await response.text();
  const cards = html.match(/data-tool-card/g) || [];
  expect(cards.length).toBeGreaterThanOrEqual(100);
  expect(html).toContain("Nigeria PAYE Calculator");
  expect(html).toContain("PDF Workspace");
  expect(html).not.toMatch(/>\s*No tools found\s*</i);
});

test("tool search finds Nigeria PAYE and PDF Workspace, then clears back to full results", async ({ browser }) => {
  test.setTimeout(90000);

  const page = await browser.newPage();
  await quietExternalNoise(page);

  await page.goto("/tools/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#tools-container a[href]").first()).toBeVisible();

  const initialCount = await page.locator("#tools-container a[href]").count();
  expect(initialCount).toBeGreaterThanOrEqual(100);
  await expect(page.locator("#no-results")).toBeHidden();

  await page.locator("#tool-search").fill("Nigeria PAYE");
  await expect(page.getByRole("link", { name: /nigeria paye calculator/i })).toBeVisible();

  await page.locator("#tool-search").fill("PDF");
  await expect(page.getByRole("link", { name: /pdf workspace/i }).first()).toBeVisible();

  await page.locator("#tool-search").fill("");
  await page.locator("#country-filter").selectOption("all");
  await page.locator("#status-filter").selectOption("all");
  await page.locator("#language-filter").selectOption("all");

  await expect(async function () {
    const resetCount = await page.locator("#tools-container a[href]").count();
    expect(resetCount).toBeGreaterThanOrEqual(100);
  }).toPass();
});

test("/search/ finds flagship apps and exposes all registry category filters", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/search/?q=afrofuel", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: /afrofuel/i })).toHaveAttribute("href", "/tools/fuel-tracker/");

  await page.locator("#search-input").fill("gasoline");
  await expect(page.getByRole("link", { name: /afrofuel/i })).toBeVisible();

  await page.locator("#search-input").fill("finance market data");
  await expect(page.locator(".result-card").first()).toBeVisible();

  await page.locator("#search-input").fill("ivory coast tax");
  await expect(page.getByRole("link", { name: /côte|cote|ivoire/i }).first()).toBeVisible();

  await page.locator("#more-filters summary").click();
  await expect(page.getByRole("button", { name: /transport & logistics/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /government & civic/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /creative economy/i })).toBeVisible();

  await page.getByRole("button", { name: /creative economy/i }).click();
  await page.locator("#search-input").fill("AfroStream");
  await expect(page.getByRole("link", { name: /afrostream/i })).toBeVisible();
});

test("/search/ uses the local AI router for practical sentence-style prompts", async ({ page }) => {
  await quietExternalNoise(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/search/?q=n%20electrical%20engineer%20in%20Ghana", { waitUntil: "domcontentloaded" });

  const firstResult = page.locator("#results-container a[href]").first();
  await expect(firstResult).toContainText(/CV|Resume/i, { timeout: 10000 });
  await expect(firstResult).toHaveAttribute("href", "/tools/cv-builder/");
  await expect(firstResult).toContainText(/AI match/i);
  await expect(page.locator("#results-container").first()).not.toContainText("No tools found");
  const cvReport = await page.evaluate(function () {
    return window.AfroToolsAIIntentAnalytics.getReport();
  });
  expect(cvReport.surfaceBreakdown.some(function (item) { return item.name === "search_page"; })).toBe(true);
  expect(cvReport.topSelectedTools.some(function (item) { return item.name === "cv-builder"; })).toBe(true);
  expect(JSON.stringify(cvReport)).not.toContain("electrical engineer");

  await page.locator("#search-input").fill("Get Ghana passport documents fees and next steps");
  const passportResult = page.locator("#results-container a[href]").first();
  await expect(passportResult).toContainText(/Passport Application Checklist/i);
  await expect(passportResult).toHaveAttribute("href", "/tools/passport-checklist/");
  const passportReport = await page.evaluate(function () {
    return window.AfroToolsAIIntentAnalytics.getReport();
  });
  expect(passportReport.topSelectedTools.some(function (item) { return item.name === "passport-checklist"; })).toBe(true);
  expect(JSON.stringify(passportReport)).not.toContain("Ghana passport documents");
});

test("/tools/ directory search uses category and synonym terms", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/tools/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#tools-container a[href]").first()).toBeVisible();

  await page.locator("#tool-search").fill("gasoline");
  await expect(page.getByRole("link", { name: /afrofuel/i })).toBeVisible();

  await page.locator("#tool-search").fill("government civic");
  await expect(page.getByRole("link", { name: /passport|national id|voter|government/i }).first()).toBeVisible();
});

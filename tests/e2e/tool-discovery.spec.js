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

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

test("Import Duty renders reviewed source metadata without overclaiming", async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto("/tools/import-duty/", { waitUntil: "domcontentloaded" });

  const meta = page.locator('[data-source-meta-id="import-duty-planning-rates"]').first();
  await expect(meta).toContainText("Reviewed source");
  await expect(meta).toContainText("Final customs assessment may differ");
  await expect(meta).not.toContainText("Official verified");
});

test("Scholarship Finder renders provider-feed source metadata", async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto("/tools/scholarship-finder/", { waitUntil: "domcontentloaded" });

  const meta = page.locator('[data-source-meta-id="scholarship-provider-feed"]').first();
  await expect(meta).toContainText("Reviewed source");
  await expect(meta).toContainText("Verify deadlines and eligibility");
  await expect(meta).not.toContainText("Official verified");
});

test("AfroFuel renders estimated snapshot confidence", async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto("/tools/fuel-tracker/", { waitUntil: "domcontentloaded" });

  const meta = page.locator('[data-source-meta-id="afrofuel-static-snapshot"]').first();
  await expect(meta).toContainText("Estimated");
  await expect(meta).toContainText("Fuel prices may vary");
  await expect(meta).not.toContainText("Official verified");
});

test("AI command cards show source hints without claiming official verification", async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto("/ai/?q=Import%20a%202016%20Toyota%20Axio%20into%20Nigeria&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await expect(card).toContainText("Uses reviewed import-duty planning assumptions");
  await expect(card).toContainText("Confirm with customs");
  await expect(card).not.toContainText("Official verified");
});

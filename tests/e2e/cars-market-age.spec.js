const { test, expect } = require("@playwright/test");

test.use({ viewport: { width: 390, height: 844 }, trace: "off" });

test("2005 Camry shows a sourced local price without an import action", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/cars/nigeria/toyota/camry/2005/");

  await expect(page.locator(".cars-market-evidence")).toContainText("NGN 4,600,000");
  await expect(page.locator(".cars-market-evidence")).toContainText("Local Used");
  await expect(page.locator("#carsApp")).toContainText("Import eligibility warning");
  await expect(page.locator("#carsApp a", { hasText: "Run Car Import Cost" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("French 2005 Camry page labels the import total inapplicable", async ({ page }) => {
  await page.goto("/fr/cars/nigeria/toyota/camry/2005/");
  await expect(page.locator("main")).toContainText("4 600 000");
  await expect(page.locator("main")).toContainText("Non applicable");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

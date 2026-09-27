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

test("2018 Camry shows reviewed local and UAE asks with an editable import handoff", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/cars/nigeria/toyota/camry/2018/");

  await expect(page.locator("#carsApp .cars-price-layer", { hasText: "Dated local asking price" })).toContainText("25,300,000");
  await expect(page.locator("#carsApp .cars-price-layer", { hasText: "Dated source-market asking price" })).toContainText("USD $9,600 - $12,300");
  await expect(page.locator(".cars-market-evidence").first()).toContainText("AED 39,250");
  await expect(page.locator("#carsApp .cars-hero-image")).toHaveAttribute("src", /toyota-camry-2018-hero\.webp/);
  expect(await page.locator("#carsApp .cars-hero-image").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator("#carsApp a", { hasText: "Run Car Import Cost" })).toHaveAttribute("href", /source=uae.*price=10700/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("car directory counts priced vehicles and offers one Camry catalog option", async ({ page }) => {
  await page.goto("/cars/");
  await expect(page.locator("#carsApp")).toContainText("26 priced vehicles");
  await expect(page.locator('#carsCatalogOptions option[value="2018 Toyota Camry"]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

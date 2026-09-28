const { test, expect } = require("@playwright/test");

test.use({ viewport: { width: 390, height: 844 }, trace: "retain-on-failure" });
for (const [model, price] of [["rav4", "12200"], ["camry", "10700"]]) {
  test("static " + model + " import link prefills the reviewed engine capacity", async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem("afrotools_cookie_consent", "declined"));
    await page.goto("/cars/nigeria/toyota/" + model + "/2018/");
    const link = page.getByRole("link", { name: "Estimate import cost for this car", exact: true });
    await link.click();
    await expect(page).toHaveURL(/\/tools\/car-import-cost\/nigeria\/\?/);
    await expect(page.locator("#carImportCountry")).toHaveValue("NG");
    await expect(page.locator("#carImportYear")).toHaveValue("2018");
    await expect(page.locator("#carImportPurchasePrice")).toHaveValue(price);
    await expect(page.locator("#carImportSourceMarket")).toHaveValue("uae");
    await expect(page.locator("#carImportEngineCc")).toHaveValue("2500");
    await expect(page.locator("#carImportResults")).toBeVisible();
    await page.locator("#carImportEngineCc").fill("2600");
    await expect(page.locator("#carImportEngineCc")).toHaveValue("2600");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test("English and French RAV4 source-price conversions share the dated forex ledger", async ({ page }) => {
  const ledger = require("../../data/forex/latest.json");
  const value = 12200 * ledger.rates.NGN;
  await page.goto("/cars/nigeria/toyota/rav4/2018/");
  await expect(page.locator("#carsApp .cars-price-layer").filter({ hasText: "Dated source-market asking price" }))
    .toContainText(new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value));
  await page.goto("/fr/cars/nigeria/toyota/rav4/2018/");
  const sourceRow = page.getByRole("row").filter({ hasText: "Prix demandé marché source" });
  await expect(sourceRow.locator('[data-label="Devise locale"]'))
    .toContainText(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value));
  const note = page.locator("[data-car-fx-rate]");
  await expect(note).toHaveAttribute("data-car-fx-rate", String(ledger.rates.NGN));
  await expect(note).toContainText(ledger.timestamp.slice(0, 10));
  await expect(note).toContainText(ledger.source);
  await expect(note).toContainText("pas un cours en temps réel");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

const { test, expect } = require("@playwright/test");

const cases = [
  ["/fr/agriculture/export-docs/?country=ghana", "#country", "GH"],
  ["/fr/agriculture/vaccination-schedule/?country=kenya", "#country", "KE"],
  ["/fr/agriculture/crop-insurance/?country=nigeria", "#country", "NG"],
  ["/fr/agriculture/poultry-roi/?country=rwanda", "#countryCode", "RW"]
];

for (const [route, selector, value] of cases) {
  test(`${route} preserves country context on the native French owner`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator(selector)).toHaveValue(value);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("iframe")).toHaveCount(0);
  });
}

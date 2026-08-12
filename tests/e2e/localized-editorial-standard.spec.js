const { test, expect } = require("@playwright/test");

for (const route of ["/fr/blog/lobola-price-2026/", "/fr/blog/vat-rates-africa-2026/"]) {
  test(`${route} reviewed article standard reflows`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator("[data-fr-editorial-standard]")).toBeVisible();
    await expect(page.locator("[data-fr-editorial-standard] details").first()).toBeVisible();
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 750, height: 844 });
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

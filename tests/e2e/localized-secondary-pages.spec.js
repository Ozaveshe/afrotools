const { test, expect } = require("@playwright/test");

const cases = [
  ["/fr/categories/", "input[data-category-search]", "agriculture", "[data-category-card]"],
  ["/sw/makundi/", "input[data-category-search]", "kilimo", "[data-category-card]"],
  ["/fr/changelog/", "input[data-change-search]", "sécurité", "[data-change-entry]"],
  ["/sw/mabadiliko/", "input[data-change-search]", "usalama", "[data-change-entry]"],
];

for (const [route, input, query, rows] of cases) {
  test(`${route} filters locally and reflows`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await page.locator(input).fill(query);
    await expect(page.locator(`${rows}:visible`)).not.toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

for (const route of ["/fr/advertise/", "/sw/tangaza/", "/fr/suggest-tool/", "/sw/pendekeza-zana/"]) {
  test(`${route} exposes a usable labelled form at effective 200%`, async ({ page }) => {
    await page.setViewportSize({ width: 780, height: 900 });
    await page.goto(route);
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    const form = page.locator("main form[data-netlify=true]");
    await expect(form).toBeVisible();
    const unlabeled = await form.locator("input:not([type=hidden]),select,textarea").evaluateAll((controls) => controls.filter((control) => !control.labels || !control.labels.length).length);
    expect(unlabeled).toBe(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

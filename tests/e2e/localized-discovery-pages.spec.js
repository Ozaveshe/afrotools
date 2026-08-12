const { test, expect } = require("@playwright/test");

const cases = [
  ["/fr/african/", false],
  ["/sw/afrika/", false],
  ["/fr/demande-entreprise/", true],
  ["/sw/ombi-la-biashara/", true],
  ["/fr/widgets/", false],
  ["/sw/widgets/", false]
];

for (const [route, serviceForm] of cases) {
  test(`${route} discovery handoff is usable on mobile and reflow`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(route);
    const standard = page.locator("[data-localized-discovery-standard]");
    await expect(standard).toBeVisible();
    if (serviceForm) {
      await standard.locator('input[name="organisation"]').fill("Example cooperative");
      await standard.locator('input[name="market"]').fill("Kenya");
      await standard.locator('textarea[name="workflow"]').fill("A reproducible planning workflow");
      await standard.locator('input[name="email"]').fill("example@example.com");
      await expect(standard.locator('button[type="submit"]')).toBeEnabled();
    } else {
      const search = standard.locator('input[type="search"]');
      await search.fill("VAT");
      await expect(search).toHaveValue("VAT");
    }
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 750, height: 844 });
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

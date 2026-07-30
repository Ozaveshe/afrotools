const { test, expect } = require("@playwright/test");
const manifest = require("../../data/localization/fr-trade-import-parity.json");

for (const route of manifest.routes) {
  test(`${route.id}: French route shell is usable at 320px`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 760 });
    await page.goto(route.french, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", /^fr/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${route.french}`);
    await expect(page.locator(`link[rel="alternate"][hreflang="en"]`)).toHaveAttribute("href", `https://afrotools.com${route.english}`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 375, height: 760 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.evaluate(() => { document.documentElement.style.zoom = ""; });
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("French Trade hub exposes the exact 22-owner programme", async ({ page }) => {
  await page.goto("/fr/trade/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#tool-grid a")).toHaveCount(22);
  const hrefs = await page.locator("#tool-grid a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(new Set(hrefs)).toEqual(new Set(manifest.routes.map((route) => route.french)));
});

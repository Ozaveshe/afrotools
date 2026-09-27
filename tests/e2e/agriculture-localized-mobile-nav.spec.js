const { expect, test } = require('@playwright/test');

const routes = [
  { locale: 'French country', path: '/fr/agriculture/crop-yield/nigeria.html' },
  { locale: 'French singleton', path: '/fr/agriculture/commodity-prices/' },
  { locale: 'Swahili country', path: '/sw/kilimo/mavuno/nigeria/' },
  { locale: 'Swahili singleton', path: '/sw/zana/ratiba-ya-chanjo-za-mifugo/' },
];

for (const { locale, path } of routes) {
  for (const width of [320, 390]) {
    test(`${locale} agriculture navigation remains usable at ${width}px`, async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      await page.setViewportSize({ width, height: 700 });
      await page.goto(path);

      const links = page.locator('.site-nav a');
      const themeToggle = page.locator('#themeToggle');
      await expect(links).toHaveCount(3);

      for (const theme of ['light', 'dark']) {
        await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);

        for (const link of await links.all()) {
          await expect(link).toBeVisible();
          const box = await link.boundingBox();
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
          expect(await link.evaluate((element) => {
            const box = element.getBoundingClientRect();
            return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === element;
          })).toBe(true);
        }

        await expect(themeToggle).toBeVisible();
        expect((await themeToggle.boundingBox()).height).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      }

      await page.locator('.brand').focus();
      await page.keyboard.press('Tab');
      await expect(links.first()).toBeFocused();
      await themeToggle.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      expect(pageErrors).toEqual([]);
    });
  }
}

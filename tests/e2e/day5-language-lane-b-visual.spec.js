const { test, expect } = require('@playwright/test');
const path = require('node:path');

const routes = [
  { slug: 'amharic-translator', setup: async (page) => page.getByLabel('Search English, Amharic or romanisation').fill('Selam') },
  { slug: 'zulu-translator', setup: async (page) => page.getByLabel('Search English, isiZulu or pronunciation cue').fill('Sawubona') },
  { slug: 'arabic-numerals', setup: async (page) => page.getByLabel('Text containing digits').fill('Ref 007 / ١٢ / ۴۵') },
  { slug: 'transliterate', setup: async (page) => { await page.getByLabel('Output script mapping').selectOption('arabic'); await page.getByLabel('Latin input').fill('bint'); } }
];

for (const route of routes) {
  test(`${route.slug} desktop and mobile visual evidence`, async ({ page }) => {
    const artifact = (...parts) => path.join(process.cwd(), 'artifacts', 'day5-language-external-lane-b', ...parts);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/tools/${route.slug}/`);
    await route.setup(page);
    await page.screenshot({ path: artifact(`${route.slug}-desktop-deep.png`), fullPage: true });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await route.setup(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: artifact(`${route.slug}-mobile-dark-deep.png`), fullPage: true });
  });
}

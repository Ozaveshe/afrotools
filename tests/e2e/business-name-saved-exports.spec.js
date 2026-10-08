const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdf = require('pdf-parse');

test.use({ trace: 'off', video: 'off', screenshot: 'off' });
const locales = [
  ['en', '/tools/business-name-gen/', 'Saved shortlist'],
  ['fr', '/fr/tools/generateur-nom-entreprise/', 'Sélection enregistrée'],
  ['sw', '/sw/zana/kitengeneza-jina-la-biashara/', 'Majina yaliyohifadhiwa']
];

for (const [locale, route, heading] of locales) {
  test(`${locale} retains saved names across batches in every export`, async ({ page }, info) => {
    // Capture application copy output without requiring native clipboard permission.
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: async text => { window.__copied = text; } }
    }));
    await page.goto(route);
    const selected = new Set();
    for (const keywords of ['trust, payments, quick', 'river, cocoa, orchard', 'stone, mountain, cloud']) {
      await page.locator('#keywords').fill(keywords);
      await page.locator('.bnw-form button[type=submit]').click();
      const names = await page.locator('.bnw-name h3').allTextContents();
      for (let index = 0; index < names.length; index++) {
        const button = page.locator('.bnw-save').nth(index);
        if (!selected.has(names[index])) {
          await button.click();
          selected.add(names[index]);
        }
      }
    }
    const saved = await page.locator('[data-saved] li').allTextContents();
    expect(saved.length).toBeGreaterThan(35);
    await page.locator('#keywords').fill('copper, sunrise, meadow');
    await page.locator('.bnw-form button[type=submit]').click();
    const contents = {};
    let parsed;
    for (const format of ['json', 'csv', 'pdf']) {
      const pending = page.waitForEvent('download');
      await page.locator(`[data-export="${format}"]`).click();
      const download = await pending;
      const file = info.outputPath(`synthetic-shortlist.${format}`);
      await download.saveAs(file);
      const bytes = fs.readFileSync(file);
      if (format === 'pdf') parsed = await pdf(bytes);
      contents[format] = format === 'pdf' ? parsed.text : bytes.toString('utf8');
    }
    expect(JSON.parse(contents.json).savedShortlist).toEqual(saved);
    expect(parsed.numpages).toBeGreaterThan(1);
    await page.locator('[data-copy]').click();
    await expect.poll(() => page.evaluate(() => typeof window.__copied)).toBe('string');
    const copied = await page.evaluate(() => window.__copied);
    for (const name of saved) {
      expect(contents.csv).toContain(name);
      expect(contents.pdf).toContain(name);
      expect(copied).toContain(name);
    }
    expect(contents.pdf).toContain(heading);
    expect(copied).toContain(heading);
  });
}

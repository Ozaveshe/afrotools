'use strict';
const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const routes = [
  ['en', '/tools/currency-converter/'],
  ['fr', '/fr/tools/convertisseur-devises/'],
  ['sw', '/sw/zana/kibadilishaji-sarafu/']
];
for (const [locale, route] of routes) for (const width of [320, 1280]) {
  test(`${locale} ${width}px native CSV preserves retained date and manual source`, async ({ page }) => {
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
    const date = new Date(Date.now() - 2 * 86400000).toISOString();
    const data = { schemaVersion: 1, base: 'USD', source: 'fawazahmed', timestamp: new Date(Date.now() - 3600000).toISOString(),
      rates: { NGN: 1500, KES: 130 }, retained_rate_codes: ['NGN'],
      rate_observations: { NGN: { rate: 1500, observed_at: date, source: 'frankfurter' } } };
    await page.route('**/api/forex?base=USD', handler => handler.fulfill({ status: 503, body: '{}' }));
    await page.route('**/data/forex/latest.json', handler => handler.fulfill({ contentType: 'application/json', body: JSON.stringify(data) }));
    await page.setViewportSize({ width, height: 850 });
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.goto(route + '?from=USD&to=NGN');
    await expect(page.locator('#fxConvert')).toBeEnabled();
    await page.locator('#fxAmount').fill('100'); await page.locator('#fxConvert').click();
    await expect(page.locator('#fxResult')).toBeVisible();
    const download = page.waitForEvent('download'); await page.locator('#fxCsv').click();
    const csv = fs.readFileSync(await (await download).path(), 'utf8');
    expect(csv).toContain('150000'); expect(csv).toContain(date); expect(csv.toLowerCase()).toContain('frankfurter');
    expect(csv).toContain('USD'); expect(csv).toContain('NGN');
    await expect(page.locator('.fr-finance-export-contract')).toHaveCount(0);
    await page.locator('input[name="rateMode"][value="manual"]').check();
    await expect(page.locator('#fxResult')).toBeHidden();
    await page.locator('#fxManualRate').fill('2'); await page.locator('#fxConvert').click();
    const manualDownload = page.waitForEvent('download'); await page.locator('#fxCsv').click();
    const manualCsv = fs.readFileSync(await (await manualDownload).path(), 'utf8');
    expect(manualCsv).toContain('200'); expect(manualCsv).not.toContain(date); expect(manualCsv.toLowerCase()).not.toContain('frankfurter');
    await page.locator('#fxAmount').fill('101'); await expect(page.locator('#fxResult')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    expect(errors).toEqual([]); expect(writes).toEqual([]);
  });
}

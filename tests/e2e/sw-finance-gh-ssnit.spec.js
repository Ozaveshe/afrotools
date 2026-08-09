const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

test.describe('Swahili Ghana SSNIT', () => {
  test('calculates and reopens all exports', async ({ page }) => {
    const raw = [];
    page.on('request', request => {
      if (!request.url().startsWith('http://127.0.0.1:4173/')) raw.push(request.url());
    });
    await page.goto('/sw/zana/kikokotoo-ssnit-ghana/');
    await page.getByRole('button', { name: 'Kokotoa SSNIT' }).click();
    await expect(page.locator('#ss-total')).toContainText('12,765');
    let pending = page.waitForEvent('download');
    await page.locator('#ss-csv').click();
    let download = await pending;
    expect(fs.readFileSync(await download.path(), 'utf8')).toContain('"tier_1_remittance","9315"');
    pending = page.waitForEvent('download');
    await page.locator('#ss-json').click();
    download = await pending;
    expect(JSON.parse(fs.readFileSync(await download.path(), 'utf8')).estimate.payroll.totalContribution).toBe(12765);
    pending = page.waitForEvent('download');
    await page.locator('#ss-pdf').click();
    download = await pending;
    const pdf = await pdfParse(fs.readFileSync(await download.path()));
    expect(pdf.text).toContain('Makadirio ya kupanga ya SSNIT Ghana');
    expect(raw.filter(url => /69000|50000|12765/.test(url))).toEqual([]);
  });

  for (const width of [320, 375]) test(`reflows ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/kikokotoo-ssnit-ghana/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  });

  test('200%, dark, keyboard and metadata', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto('/sw/zana/kikokotoo-ssnit-ghana/');
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; document.documentElement.dataset.theme = 'dark'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBeTruthy();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kikokotoo-ssnit-ghana/');
  });
});

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const routes = [
  ['/somalia/so-vat', 'Somalia VAT status & consumption-tax evidence', 'What the 2026 federal evidence supports'],
  ['/fr/somalia/so-vat', 'Statut TVA Somalie & preuves fiscales', 'Ce que prouvent les données fédérales 2026'],
  ['/sw/somalia/kikokotoo-vat/', 'Hali ya VAT Somalia & ushahidi wa kodi', 'Ushahidi wa shirikisho wa 2026 unaunga mkono nini']
];

for (const [route, title, heading] of routes) test(`${route} is a fail-closed evidence reference`, async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('.gnv-hero h1')).toHaveText(title);
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  await expect(page.locator('input[type="number"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('1.1700');
  await expect(page.locator('body')).not.toContainText('SRTD');
  await expect(page.locator('[data-tool-verification-panel] a[href*="mof.gov.so"]')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('Somalia evidence reference supports mobile, dark, reduced motion, zoom, keyboard and real PDF', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/somalia/so-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.locator('.gnv-card').first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  await page.evaluate(() => { document.documentElement.style.zoom = '1'; document.documentElement.setAttribute('data-theme', 'dark'); });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
  const pending = page.waitForEvent('download');
  await page.locator('#soPdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('somalia-consumption-tax-evidence-status.pdf');
  const buffer = fs.readFileSync(await download.path());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  const parsed = await pdfParse(buffer);
  expect(parsed.text).toContain('Somalia VAT status & consumption-tax evidence');
  expect(parsed.text).toContain('not a tax calculator');
});

test('Somalia evidence reference durable visual proof', async ({ browser }) => {
  const dir = path.resolve('artifacts/day3-vat-somalia-20260723');
  fs.mkdirSync(dir, { recursive: true });
  for (const item of [{ width: 320, theme: 'system-dark' }, { width: 375, theme: 'light' }, { width: 768, theme: 'manual-dark' }]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/somalia/so-vat');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: path.join(dir, `somalia-tax-status-${item.width}-${item.theme}.png`), fullPage: true });
    await context.close();
  }
});

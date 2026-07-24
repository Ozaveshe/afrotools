const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

test('central bank rate reference is freshness-gated, private and responsive', async ({ page }) => {
  const errors = [], nonGet = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') nonGet.push(request.postData() || ''); });
  await page.setViewportSize({ width: 320, height: 760 }); await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/interest-rate-ref/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#snapshot-status')).toContainText('Reviewed snapshot');
  await expect(page.locator('#verified-count')).toHaveText('6'); await expect(page.locator('#excluded-count')).toHaveText('9');
  await expect(page.locator('#median-rate')).toHaveText('5.00%'); await expect(page.locator('#highest-rate')).toHaveText('26.50%'); await expect(page.locator('#lowest-rate')).toHaveText('2.25%');
  await expect(page.locator('#rate-body tr')).toHaveCount(6); await expect(page.locator('#rate-body')).not.toContainText('Ghana');
  await expect(page.locator('#rate-body a')).toHaveCount(6);
  await page.fill('#rate-search', 'Kenya'); await expect(page.locator('#rate-body tr')).toHaveCount(1); await expect(page.locator('#rate-body')).toContainText('8.75%'); await page.fill('#rate-search', '');

  const csvDownload = page.waitForEvent('download'); await page.click('#rates-csv'); const csv = fs.readFileSync(await (await csvDownload).path(), 'utf8');
  expect(csv).toContain('"Nigeria","NG","CBN","26.50"'); expect(csv).not.toContain('"Ghana"'); expect(csv.trim().split('\n')).toHaveLength(7);
  const pdfDownload = page.waitForEvent('download'); await page.click('#rates-pdf'); const pdf = await pdfParse(fs.readFileSync(await (await pdfDownload).path()));
  expect(pdf.text).toContain('African Central Bank Rates'); expect(pdf.text).toContain('Reviewed committed snapshot'); expect(pdf.text).toContain('Nigeria - Monetary Policy Rate');
  await page.setViewportSize({ width: 375, height: 812 }); await page.screenshot({ path: 'artifacts/interest-rate-reference-vip-375-dark.png', fullPage: true });

  const stale = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/rates/latest.json'), 'utf8'));
  stale.countries.forEach(row => { if (row.policy_rate_verified_at) row.policy_rate_verified_at = '2020-01-01T00:00:00.000Z'; });
  await page.route('**/data/rates/latest.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stale) })); await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#snapshot-status')).toContainText('Rates withheld'); await expect(page.locator('#rate-body tr')).toHaveCount(0); await expect(page.locator('#rates-csv')).toBeDisabled();
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  expect(await page.locator('input').evaluateAll(nodes => nodes.every(node => node.labels && node.labels.length > 0))).toBe(true);
  for (const width of [320, 360, 375, 768]) { await page.setViewportSize({ width, height: 820 }); expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), 'document overflow at '+width+'px').toBe(false); }
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; }); expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  expect(nonGet).toEqual([]); expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /rate|bank|interest/i.test(key)))).toEqual([]); expect(errors).toEqual([]);
});

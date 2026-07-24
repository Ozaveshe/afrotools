const fs = require('fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

test('crypto CGT VIP fails closed, calculates exact jurisdiction results and exports locally', async ({ page }) => {
  const errors = [], nonGet = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') nonGet.push(request.postData() || ''); });
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/crypto-tax/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('every trade');
  await expect(page.locator('#cc-tax')).toHaveText('No estimate');
  await page.click('#cc-form button[type="submit"]');
  await expect(page.locator('#cc-status')).toContainText('confirm with a qualified adviser');
  await page.selectOption('#cc-classification', 'capital-confirmed');
  await page.check('#cc-confirm');
  await page.click('#cc-form button[type="submit"]');
  await expect(page.locator('#cc-tax')).toContainText(/1[,\s]*410[,\s]*000/);

  await page.selectOption('#cc-country', 'KE');
  await page.fill('#cc-proceeds', '10000000'); await page.fill('#cc-cost', '4000000'); await page.fill('#cc-sell-costs', '500000');
  await page.selectOption('#cc-classification', 'capital-confirmed'); await page.check('#cc-confirm'); await page.click('#cc-form button[type="submit"]');
  await expect(page.locator('#cc-tax')).toContainText(/825[,\s]*000/);

  await page.selectOption('#cc-country', 'ZA');
  await page.fill('#cc-proceeds', '2500000'); await page.fill('#cc-cost', '1750000'); await page.fill('#cc-sell-costs', '0'); await page.fill('#cc-za-income', '500000');
  await page.selectOption('#cc-classification', 'capital-confirmed'); await page.check('#cc-confirm'); await page.click('#cc-form button[type="submit"]');
  await expect(page.locator('#cc-tax')).toContainText(/101[,\s]*816/);
  await expect(page.locator('#cc-breakdown')).toContainText('R50,000 annual exclusion');

  await page.selectOption('#cc-country', 'GH');
  await page.fill('#cc-proceeds', '300000'); await page.fill('#cc-cost', '190000'); await page.fill('#cc-sell-costs', '10000');
  await page.selectOption('#cc-classification', 'capital-confirmed'); await page.check('#cc-confirm'); await page.click('#cc-form button[type="submit"]');
  await expect(page.locator('#cc-tax')).toContainText(/15[,\s]*000/);
  const csvDownload = page.waitForEvent('download'); await page.click('#cc-csv');
  const csv = fs.readFileSync(await (await csvDownload).path(), 'utf8');
  expect(csv).toContain('"Country","Ghana"'); expect(csv).toContain('"Estimated tax","GHS\u00a015,000.00"');
  const pdfDownload = page.waitForEvent('download'); await page.click('#cc-pdf');
  const pdf = await pdfParse(fs.readFileSync(await (await pdfDownload).path()));
  expect(pdf.text).toContain('Crypto Capital-Gains Estimate'); expect(pdf.text).toContain('Confirmed treatment'); expect(pdf.text).toContain('capital account');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'artifacts/crypto-cgt-vip-375-dark.png', fullPage: true });

  await page.selectOption('#cc-classification', 'mining-staking-reward'); await page.click('#cc-form button[type="submit"]');
  await expect(page.locator('#cc-tax')).toHaveText('No estimate'); await expect(page.locator('#cc-status')).toContainText('No estimate produced');
  expect(await page.locator('#cc-form input,#cc-form select').evaluateAll(nodes => nodes.every(node => node.labels && node.labels.length > 0))).toBe(true);
  for (const width of [320, 360, 375, 768]) { await page.setViewportSize({ width, height: 820 }); expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false); }
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  expect(nonGet).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /crypto|cgt|wallet|holding/i.test(key)))).toEqual([]);
  expect(errors).toEqual([]);
});

const fs = require('fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

test('pension projection VIP is exact, evidence-gated, private and responsive', async ({ page }) => {
  const errors = [], nonGet = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') nonGet.push(request.postData() || ''); });
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/pension-proj/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('evidence');
  await page.click('#pension-form button[type="submit"]');
  await expect(page.locator('#pension-error')).toContainText('Confirm that the balance');
  await page.check('#scheme-confirmed'); await page.check('#assumptions-confirmed');
  await page.fill('#years', '1'); await page.fill('#annual-return', '12'); await page.fill('#annual-fee', '0'); await page.fill('#inflation', '6'); await page.fill('#contribution-growth', '0');
  await page.click('#pension-form button[type="submit"]');
  await expect(page.locator('#ending-balance')).toContainText(/2[,.\s]*384[,.\s]*649/);
  await expect(page.locator('#future-contributions')).toContainText(/1[,.\s]*200[,.\s]*000/);
  await expect(page.locator('#real-value')).toContainText(/2[,.\s]*249[,.\s]*669/);
  await expect(page.locator('#sensitivity')).toContainText('not probabilities');

  const csvDownload = page.waitForEvent('download'); await page.click('#csv-result');
  const csv = fs.readFileSync(await (await csvDownload).path(), 'utf8');
  expect(csv).toContain('Year,Projected balance (NGN)'); expect(csv).toContain('1,2384649.79');
  const pdfDownload = page.waitForEvent('download'); await page.click('#pdf-result');
  const pdf = await pdfParse(fs.readFileSync(await (await pdfDownload).path()));
  expect(pdf.text).toContain('Pension Projection Planning Brief'); expect(pdf.text).toContain('Current provider statement'); expect(pdf.text).toContain('User assumptions only');
  await page.setViewportSize({ width: 375, height: 812 }); await page.screenshot({ path: 'artifacts/pension-projection-vip-375-dark.png', fullPage: true });

  await page.fill('#source-date', '2020-01-01'); await page.click('#pension-form button[type="submit"]');
  await expect(page.locator('#pension-error')).toContainText('more than 366 days old');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  expect(await page.locator('#pension-form input').evaluateAll(nodes => nodes.every(node => node.labels && node.labels.length > 0))).toBe(true);
  for (const width of [320, 360, 375, 768]) { await page.setViewportSize({ width, height: 820 }); expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false); }
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; }); expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  expect(nonGet).toEqual([]); expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /pension|retire|balance|contribution/i.test(key)))).toEqual([]); expect(errors).toEqual([]);
});

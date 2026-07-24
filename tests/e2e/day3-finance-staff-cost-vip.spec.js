const fs = require('fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

test('staff cost VIP is evidence-gated, exact, private and responsive', async ({ page }) => {
  const errors = [], nonGet = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') nonGet.push(request.postData() || ''); });
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/staff-cost/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('without inventing payroll law');
  await expect(page.locator('#scp-total')).toHaveText('No budget');
  await page.click('#scp-form button[type="submit"]');
  await expect(page.locator('#scp-status')).toContainText('reviewed as employment');
  await page.check('#scp-status-confirm'); await page.check('#scp-source-confirm'); await page.click('#scp-form button[type="submit"]');
  await expect(page.locator('#scp-total')).toContainText(/44[,\s]*362[,\s]*500/);
  await expect(page.locator('#scp-metrics')).toContainText(/3[,\s]*696[,\s]*875/);
  await expect(page.locator('#scp-metrics')).toContainText('47.88%');
  await expect(page.locator('#scp-evidence')).toContainText('Current payroll adviser schedule');

  const csvDownload = page.waitForEvent('download'); await page.click('#scp-csv');
  const csv = fs.readFileSync(await (await csvDownload).path(), 'utf8');
  expect(csv).toContain('"Headcount","5"'); expect(csv).toContain('"Total staff budget","NGN\u00a044,362,500.00"');
  const pdfDownload = page.waitForEvent('download'); await page.click('#scp-pdf');
  const pdf = await pdfParse(fs.readFileSync(await (await pdfDownload).path()));
  expect(pdf.text).toContain('Staff Cost Planning Brief'); expect(pdf.text).toContain('Source label'); expect(pdf.text).toContain('Current payroll adviser schedule');
  await page.setViewportSize({ width: 375, height: 812 }); await page.screenshot({ path: 'artifacts/staff-cost-vip-375-dark.png', fullPage: true });

  await page.fill('#scp-source-date', '2020-01-01'); await page.click('#scp-form button[type="submit"]');
  await expect(page.locator('#scp-total')).toHaveText('No budget'); await expect(page.locator('#scp-status')).toContainText('over one year old');
  expect(await page.locator('#scp-form input').evaluateAll(nodes => nodes.every(node => node.labels && node.labels.length > 0))).toBe(true);
  for (const width of [320, 360, 375, 768]) { await page.setViewportSize({ width, height: 820 }); expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false); }
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; }); expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  expect(nonGet).toEqual([]); expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /staff|salary|payroll|employee/i.test(key)))).toEqual([]); expect(errors).toEqual([]);
});

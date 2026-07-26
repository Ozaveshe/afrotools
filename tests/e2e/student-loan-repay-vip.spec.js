const { test, expect } = require('@playwright/test');
const path = require('node:path');

const route = '/tools/student-loan-repay/';

test.beforeEach(async ({ page }) => {
  await page.goto(route);
});

test('uses self-hosted typography and has no program presets', async ({ page }) => {
  await expect(page.locator('body')).toHaveCSS('font-family', /DM Sans/);
  await expect(page.locator('select')).toHaveCount(0);
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/NELFUND|HELB|NSFAS|SLTF/);
  expect(await page.locator('link[href*="fonts.googleapis.com"]').count()).toBe(0);
  await expect(page.getByLabel('Current loan balance')).toBeVisible();
  await expect(page.getByLabel('Annual fixed interest rate (%)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Calculate repayment' })).toBeVisible();
});

test('calculates a zero-rate plan and validates missing values', async ({ page }) => {
  await page.getByRole('button', { name: 'Calculate repayment' }).click();
  await expect(page.getByRole('alert')).toContainText('Loan amount');
  await page.locator('#slr-label').fill('NGN');
  await page.locator('#slr-amount').fill('1000');
  await page.locator('#slr-rate').fill('0');
  await page.locator('#slr-years').fill('0.833333');
  await page.getByRole('button', { name: 'Calculate repayment' }).click();
  await expect(page.locator('#slr-result')).toBeVisible();
  await expect(page.locator('#slr-grid')).toContainText('NGN 100.00');
  await expect(page.locator('#slr-grid')).toContainText('NGN 0.00');
});

test('extra payments reduce time and interest', async ({ page }) => {
  await page.locator('#slr-amount').fill('100000');
  await page.locator('#slr-rate').fill('12');
  await page.locator('#slr-years').fill('3');
  await page.locator('#slr-extra').fill('1000');
  await page.getByRole('button', { name: 'Calculate repayment' }).click();
  await expect(page.locator('#slr-grid')).toContainText('Estimated time saved');
  await expect(page.locator('#slr-grid')).toContainText('Estimated interest saved');
  await expect(page.locator('#slr-schedule tbody tr')).toHaveCount(13);
});

test('fits a 320px viewport and print/PDF renders', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.locator('#slr-amount').fill('10000');
  await page.locator('#slr-rate').fill('5');
  await page.locator('#slr-years').fill('2');
  await page.getByRole('button', { name: 'Calculate repayment' }).click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  let printed = false;
  await page.exposeFunction('recordPrint', () => { printed = true; });
  await page.evaluate(() => { window.print = () => window.recordPrint(); });
  await page.getByRole('button', { name: 'Print / save PDF' }).click();
  expect(printed).toBe(true);
  const pdf = await page.pdf({ format: 'A4' });
  expect(pdf.length).toBeGreaterThan(1000);
});

test('does not transmit entered financial values', async ({ page }) => {
  const traffic = [];
  page.on('request', request => {
    traffic.push(request.url() + (request.postData() || ''));
  });
  await page.locator('#slr-amount').fill('987654321');
  await page.locator('#slr-rate').fill('7');
  await page.locator('#slr-years').fill('4');
  await page.getByRole('button', { name: 'Calculate repayment' }).click();
  await page.waitForTimeout(200);
  expect(traffic.join(' ')).not.toContain('987654321');
});

test('captures desktop, mobile dark and 200 percent visual proof', async ({ page }) => {
  const artifact = name => path.join(process.cwd(), 'artifacts', 'day5-student-loan-repay-vip', name);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: artifact('desktop-light.png'), fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: artifact('mobile-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 750, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.screenshot({ path: artifact('text-200-dark.png'), fullPage: true });
});

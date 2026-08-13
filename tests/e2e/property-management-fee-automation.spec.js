'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__propertyFeeClipboard = '';
    window.__propertyFeeWrites = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => { window.__propertyFeeClipboard = String(value); }
      }
    });
    for (const name of ['localStorage', 'sessionStorage']) {
      const storage = window[name];
      const original = storage.setItem.bind(storage);
      storage.setItem = (key, value) => {
        window.__propertyFeeWrites.push({ name, key, value });
        return original(key, value);
      };
    }
  });
});

test('annual fee summary, renewal handoff and text export stay local', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const requests = [];
  page.on('request', (request) => requests.push({
    url: request.url(),
    method: request.method(),
    resourceType: request.resourceType(),
    postData: request.postData() || ''
  }));
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/tools/property-mgmt-fees/');
  await page.waitForLoadState('networkidle');
  const form = page.locator('[data-property-workflow] form');
  await form.locator('[name=market]').selectOption('GH');
  for (const [name, value] of Object.entries({
    currency: 'GHS_PRIVATE_42',
    rent: '1000',
    rate: '10',
    lettingMonths: '1',
    newLets: '1',
    renewalMonths: '0.5',
    renewals: '2',
    fixed: '100',
    taxRate: '20',
    reviewDate: '2026-11-15'
  })) await form.locator(`[name=${name}]`).fill(value);

  const requestCountBeforeCalculation = requests.length;
  const writeCountBeforeCalculation = await page.evaluate(() => window.__propertyFeeWrites.length);
  await form.getByRole('button', { name: 'Build annual cost summary' }).click();

  const output = page.locator('[data-result]');
  await expect(output).toContainText('Annual scenario total: GHS_PRIVATE_42 3,960');
  await expect(output).toContainText('Continuing-year estimate (no new-let fee): GHS_PRIVATE_42 2,760');
  await expect(output).toContainText('Renewal review date: 2026-11-15');
  await expect(output).toContainText('Reminder status: not scheduled');
  await expect(output).toContainText('https://gra.gov.gh/e-services/e-vat/');
  const calculationRequests = requests.slice(requestCountBeforeCalculation);
  expect(calculationRequests.some((request) => {
    const payload = `${request.url}\n${request.postData}`;
    return payload.includes('GHS_PRIVATE_42') || payload.includes('2026-11-15');
  })).toBe(false);
  expect(await page.evaluate(() => window.__propertyFeeWrites.length)).toBe(writeCountBeforeCalculation);

  await page.locator('[data-action=copy]').click();
  expect(await page.evaluate(() => window.__propertyFeeClipboard)).toContain('Annual scenario total: GHS_PRIVATE_42 3,960');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-action=download]').click()
  ]);
  expect(download.suggestedFilename()).toBe('afrotools-property-management-fee-handoff.txt');
  const exported = await fs.promises.readFile(await download.path(), 'utf8');
  expect(exported).toContain('Source context checked: 2026-08-13');
  expect(exported).toContain('Renewal fees (0.5 month(s) x 2 renewal(s)): GHS_PRIVATE_42 1,000');
  expect(exported).toContain('Reminder status: not scheduled');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});

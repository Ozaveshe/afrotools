'use strict';

const { test, expect } = require('@playwright/test');
const { FRENCH_ENERGY_APPS } = require('../../scripts/lib/french-energy-parity-contract');

test.use({ viewport: { width: 360, height: 800 } });

test('French electricity localization stays idempotent and mobile-safe', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/fr/tools/compteur-prepaye/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const body = await page.locator('body').innerText();
  expect(body).toContain('Ouganda');
  expect(body).not.toMatch(/OO+uganda/i);
  await expect(page.locator('#electricityCountry option[value="UG"]')).toHaveText('Ouganda');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('English prepaid compatibility CTA wraps without mobile overflow', async ({ page }) => {
  await page.goto('/tools/prepaid-meter/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/tools/prepaid-meter/');
  await expect(page.locator('.prepaid-meter-compatibility__cta')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('all French energy owners remain stable at mobile width', async ({ browser }) => {
  const failures = [];
  for (const app of FRENCH_ENERGY_APPS) {
    const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(app.frRoute, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(220);
    const state = await page.evaluate(() => ({
      body: document.body.innerText,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    if (!response || response.status() !== 200 || /OO+uganda/i.test(state.body) || state.overflow > 1 || errors.length) {
      failures.push({ route: app.frRoute, status: response && response.status(), overflow: state.overflow, errors });
    }
    await page.close();
  }
  expect(failures).toEqual([]);
});

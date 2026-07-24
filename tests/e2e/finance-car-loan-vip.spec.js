const { test, expect } = require('@playwright/test');

const routes = [
  { path: '/tools/car-loan/', lang: 'en' },
  { path: '/fr/tools/pret-automobile/', lang: 'fr' },
  { path: '/sw/zana/mkopo-wa-gari/', lang: 'sw' }
];

async function fillPlan(page) {
  const values = {
    '#cl-price': '12000', '#cl-deposit': '2000', '#cl-rate': '0',
    '#cl-months': '10', '#cl-income': '5000', '#cl-debts': '500',
    '#cl-insurance': '100', '#cl-fuel': '200', '#cl-maintenance': '50',
    '#cl-other': '50', '#cl-source': 'Synthetic lender offer',
    '#cl-date': '2026-07-22'
  };
  for (const [selector, value] of Object.entries(values)) await page.locator(selector).fill(value);
  await page.locator('#cl-form button[type="submit"]').click();
}

for (const route of routes) test(`${route.lang} car-loan route is exact, private and mobile-safe`, async ({ page }) => {
  const errors = [], nonGet = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (request.method() !== 'GET') nonGet.push(request.url()); });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(route.path, { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('lang', route.lang);
  expect((await page.title()).length).toBeLessThanOrEqual(60);
  await expect(page.locator('link[rel="alternate"]')).toHaveCount(4);
  expect(await page.locator('#cl-form input').evaluateAll(inputs => inputs.every(input =>
    input.labels && input.labels.length === 1 && input.labels[0].textContent.trim().length > 0
  ))).toBe(true);
  await page.locator('#cl-price').focus();
  await expect(page.locator('#cl-price')).toBeFocused();
  await fillPlan(page);
  for (const [id, value] of [['#cl-principal', 10000], ['#cl-payment', 1000],
    ['#cl-finance', 0], ['#cl-operating', 400], ['#cl-monthly-total', 1400],
    ['#cl-outlay', 16000], ['#cl-cash-after', 3100]]) {
    const digits = await page.locator(id).textContent();
    expect(Number(digits.replace(/[^0-9.-]/g, ''))).toBe(value);
  }
  await expect(page.locator('#cl-debt-load')).toHaveText('30.0%');
  await expect(page.locator('#cl-schedule tr')).toHaveCount(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /car|loan/i.test(key)))).toEqual([]);
  expect(nonGet).toEqual([]);
  expect(errors).toEqual([]);
  await page.locator('#cl-price').fill('13000');
  await expect(page.locator('#cl-results')).toBeHidden();
});

test('car-loan exports stay local and stale evidence clears the result', async ({ page }) => {
  const downloads = [];
  await page.addInitScript(() => {
    window.__pdfArgs = null;
    window.addEventListener('DOMContentLoaded', () => {
      window.AfroTools = window.AfroTools || {};
      window.AfroTools.pdf = { generate: async args => { window.__pdfArgs = args; } };
    });
  });
  await page.goto('/tools/car-loan/');
  await fillPlan(page);
  page.on('download', download => downloads.push(download));
  for (const id of ['#cl-csv', '#cl-json']) {
    const download = page.waitForEvent('download');
    await page.locator(id).click();
    await download;
  }
  await page.locator('#cl-pdf').click();
  expect(await page.evaluate(() => ({
    noGate: window.__pdfArgs.noGate,
    skipGate: window.__pdfArgs.skipGate,
    rows: window.__pdfArgs.sections[0].rows.length
  }))).toEqual({ noGate: true, skipGate: true, rows: 10 });
  expect(downloads.length).toBe(2);
  await page.locator('#cl-date').fill('2025-01-01');
  await page.locator('#cl-form button[type="submit"]').click();
  await expect(page.locator('#cl-error')).toContainText('365 days');
  await expect(page.locator('#cl-results')).toBeHidden();
});

test('manual and system dark mode remain stable at 320px and 200% equivalent', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/tools/car-loan/');
  await page.locator('html').evaluate(node => node.setAttribute('data-theme', 'dark'));
  await fillPlan(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'artifacts/car-loan-dark-320-zoom200-equivalent.png', fullPage: true });
});

test('tablet layout remains stable at 768px', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/tools/car-loan/');
  await fillPlan(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('compact widget requires a sourced offer and matches the engine', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/widgets/iframe/financial-car-loan.html?theme=dark');
  await page.locator('#aw-price').fill('12000');
  await page.locator('#aw-deposit').fill('2000');
  await page.locator('#aw-rate').fill('0');
  await page.locator('#aw-months').fill('10');
  await page.locator('#aw-calc').click();
  await expect(page.locator('#aw-error')).toContainText('checked date within 365 days');
  await page.locator('#aw-source').fill('Synthetic lender offer');
  await page.locator('#aw-date').fill('2026-07-22');
  await page.locator('#aw-calc').click();
  await expect(page.locator('#aw-result')).toContainText(/KES\s+1,000/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

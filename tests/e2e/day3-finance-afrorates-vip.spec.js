const { test, expect } = require('@playwright/test');

const routes = [
  { path: '/tools/afrorates/', language: 'en' },
  { path: '/fr/tools/afrotaux/', language: 'fr' },
  { path: '/sw/zana/viwango-benki/', language: 'sw' },
];

for (const route of routes) {
  test(`${route.language} AfroRates route fails over to the reviewed snapshot`, async ({ page }) => {
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 375, height: 760 });
    await page.goto(route.path);
    await expect(page.locator('#ar-status')).toHaveAttribute('data-state', 'fallback');
    await expect(page.locator('#ar-verified')).toHaveText('6');
    await expect(page.locator('#ar-withheld')).toHaveText('9');
    await expect(page.locator('#ar-body tr')).toHaveCount(6);
    await expect(page.locator('html')).toHaveAttribute('lang', route.language);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('AfroRates filters, sorts, darkens and fails closed when both data paths fail', async ({ page }) => {
  await page.goto('/tools/afrorates/?country=KE');
  await expect(page.locator('#ar-body tr')).toHaveCount(1);
  await expect(page.locator('#ar-body')).toContainText('Kenya');
  await page.locator('#ar-search').fill('Nigeria');
  await expect(page.locator('#ar-body tr')).toHaveCount(1);
  await page.locator('#ar-search').fill('');
  await page.locator('#ar-sort').selectOption('rate-desc');
  await expect(page.locator('#ar-body tr').first()).toContainText('Nigeria');
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await expect(page.locator('.ar-page')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

  await page.addInitScript(() => { window.__AFRORATES_FORCE_API__ = true; });
  await page.route('**/api/rates?metric=policy_rate', (request) => request.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.route('**/data/rates/latest.json', (request) => request.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.reload();
  await expect(page.locator('#ar-status')).toHaveAttribute('data-state', 'blocked');
  await expect(page.locator('#ar-body tr')).toHaveCount(0);
  await expect(page.locator('#ar-csv')).toBeDisabled();
  await expect(page.locator('#ar-pdf')).toBeDisabled();
});

test('AfroRates rejects a mixed API response and uses the strict static fallback', async ({ page }) => {
  const snapshot = require('../../data/rates/latest.json');
  await page.addInitScript(() => { window.__AFRORATES_FORCE_API__ = true; });
  await page.route('**/api/rates?metric=policy_rate', (request) => request.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ timestamp: snapshot.timestamp, coverage: { candidate_count: 15 }, countries: snapshot.countries }),
  }));
  await page.goto('/tools/afrorates/');
  await expect(page.locator('#ar-status')).toHaveAttribute('data-state', 'fallback');
  await expect(page.locator('#ar-body tr')).toHaveCount(6);
});

test('AfroRates CSV and PDF exports stay local and use only reviewed rows', async ({ page }) => {
  await page.goto('/tools/afrorates/');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#ar-csv').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('afrorates-reviewed-policy-rates.csv');
  await expect(page.locator('#ar-action-status')).toContainText('downloaded locally');

  await page.evaluate(() => {
    window.__pdfPayload = null;
    window.AfroTools.pdf = { generate: async (payload) => { window.__pdfPayload = payload; } };
  });
  await page.locator('#ar-pdf').click();
  await expect.poll(() => page.evaluate(() => window.__pdfPayload && window.__pdfPayload.sections[0].rows.length)).toBe(6);
  await expect(page.locator('#ar-action-status')).toContainText('generated locally');
});

test('AfroRates remains usable at 320px, 768px and 200% zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/tools/afrorates/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.locator('#ar-search')).toBeVisible();
  await expect(page.locator('#ar-csv')).toBeVisible();

  await page.setViewportSize({ width: 768, height: 820 });
  await page.evaluate(() => { document.body.style.zoom = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.locator('#ar-body tr').first()).toBeVisible();

  await page.evaluate(() => { document.body.style.zoom = '100%'; document.documentElement.dataset.theme = 'dark'; });
  await page.setViewportSize({ width: 375, height: 760 });
  await page.screenshot({ path: 'test-results/afrorates-vip-375-dark.png', fullPage: true });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.screenshot({ path: 'test-results/afrorates-vip-1200-light.png', fullPage: true });
});

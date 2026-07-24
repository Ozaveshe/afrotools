const { test, expect } = require('@playwright/test');

test('fuel tracker is source-gated, correct, private and mobile-safe', async ({ page }) => {
  const consoleErrors = [];
  const unexpectedWrites = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', (request) => { if (request.method() !== 'GET' && request.method() !== 'HEAD') unexpectedWrites.push(request.method() + ' ' + request.url()); });
  await page.addInitScript(() => {
    window.__storageWrites = [];
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      window.__storageWrites.push(String(key));
      return original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/tools/fuel-tracker/', { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toContainText('Fuel costs');
  await expect(page.locator('#fuel-data-status')).toContainText('Nigeria petrol snapshot');
  await expect(page.locator('#fuel-source')).toHaveAttribute('href', /globalpetrolprices\.com/);
  await expect(page.locator('#fuel-coverage')).toContainText(/of 54 rows/);
  const consent = page.getByRole('dialog', { name: 'Cookie consent' });
  if (await consent.isVisible().catch(() => false)) await consent.getByRole('button', { name: 'Close' }).click();
  await page.evaluate(() => { window.__storageWrites = []; });
  await page.locator('#fuel-rate').fill('1.5');
  await page.locator('#fuel-hours').fill('8');
  await page.locator('#fuel-days').fill('26');
  await page.locator('#fuel-price').fill('1000');
  await page.locator('#fuel-calc').click();
  await expect(page.locator('#fuel-monthly-cost')).toContainText('312,000');
  await expect(page.locator('#fuel-monthly-litres')).toHaveText('312 L');
  await expect(page.locator('#fuel-annual-cost')).toContainText('3,744,000');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#fuel-csv').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('afrofuel-generator-estimate.csv');
  const stream = await download.createReadStream();
  let csv = '';
  for await (const chunk of stream) csv += chunk.toString();
  expect(csv).toContain('"monthly_cost","312000"');
  await page.evaluate(() => { window.__printCalls = 0; window.print = () => { window.__printCalls += 1; }; });
  await page.locator('#fuel-print').click();
  expect(await page.evaluate(() => window.__printCalls)).toBe(1);
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.locator('body').evaluate((body) => body.clientWidth));
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(page.locator('.fuel-card').first()).toHaveCSS('background-color', 'rgb(16, 32, 26)');
  await page.screenshot({ path: 'artifacts/fuel-tracker-vip-375-dark.png', fullPage: true });
  await page.locator('.fuel-hero').screenshot({ path: 'artifacts/fuel-tracker-vip-375-dark-hero.png' });
  await page.locator('#comparison-heading').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/fuel-tracker-vip-mobile-table.png', fullPage: false });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await expect(page.locator('#fuel-calc')).toBeVisible();
  expect(unexpectedWrites).toEqual([]);
  expect(await page.evaluate(() => window.__storageWrites)).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('stale snapshot never prefills or exports a result', async ({ page }) => {
  await page.route('**/data/fuel/latest.json', async (route) => {
    await route.fulfill({ json: { timestamp: '2026-07-22T00:00:00Z', countries: [{ code: 'NG', name: 'Nigeria', currency: 'NGN', last_updated: '2025-01-01', source_url: 'https://example.test', petrol: { price: 1000, usd: 1 } }] } });
  });
  await page.goto('/tools/fuel-tracker/');
  await expect(page.locator('#fuel-data-status')).toContainText('older than 45 days');
  await expect(page.locator('#fuel-price')).toHaveValue('');
  await expect(page.locator('#fuel-result')).toBeHidden();
  await expect(page.locator('#fuel-table-body')).toContainText('No rows currently pass');
});

test('source failure closes the price workflow', async ({ page }) => {
  await page.route('**/data/fuel/latest.json', (route) => route.abort());
  await page.goto('/tools/fuel-tracker/');
  await expect(page.locator('#fuel-data-status')).toContainText('Fuel snapshots are unavailable');
  await expect(page.locator('#fuel-calc')).toBeDisabled();
});

test('layout remains contained at 320, 375 and 768 pixels', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/tools/fuel-tracker/');
    await expect(page.locator('#fuel-data-status')).toContainText('snapshot');
    const size = await page.evaluate(() => ({ scroll: document.body.scrollWidth, client: document.body.clientWidth }));
    expect(size.scroll).toBeLessThanOrEqual(size.client);
    await expect(page.locator('#fuel-calc')).toBeVisible();
  }
});

test('launched French and Swahili companions keep honest canonical contracts', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/fr/tools/suivi-carburant/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/suivi-carburant/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /instantanés datés/i);
  const frenchText = await page.locator('body').innerText();
  expect(frenchText).not.toMatch(/mis à jour chaque semaine|sources officielles gouvernementales|estimation précise/i);
  await page.goto('/sw/zana/ufuatiliaji-bei-za-mafuta/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/ufuatiliaji-bei-za-mafuta/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/fuel-tracker/');
  await expect(page.locator('main')).toContainText('Thibitisha');
});

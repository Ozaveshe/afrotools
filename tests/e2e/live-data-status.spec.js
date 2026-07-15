const { test, expect } = require('@playwright/test');

function fuelCountries() {
  const rows = [
    ['NG', 'Nigeria', 'NGN', 'west'],
    ['GH', 'Ghana', 'GHS', 'west'],
    ['KE', 'Kenya', 'KES', 'east'],
    ['ZA', 'South Africa', 'ZAR', 'south'],
    ['EG', 'Egypt', 'EGP', 'north'],
    ['TZ', 'Tanzania', 'TZS', 'east'],
    ['UG', 'Uganda', 'UGX', 'east'],
    ['RW', 'Rwanda', 'RWF', 'east'],
    ['CM', 'Cameroon', 'XAF', 'central'],
    ['DZ', 'Algeria', 'DZD', 'north'],
    ['AO', 'Angola', 'AOA', 'central']
  ];
  return rows.map(function (row, index) {
    return {
      code: row[0],
      name: row[1],
      currency: row[2],
      region: row[3],
      petrol: { price: index === 0 ? 777 : 100 + index, usd: 0.7 + index / 100, unit: 'liter' },
      diesel: { price: 200 + index, usd: 0.8 + index / 100, unit: 'liter' },
      lpg: { price: 300 + index, usd: 0.9 + index / 100, unit: 'kg' },
      source: 'live-test-feed',
      source_state: 'third_party_snapshot',
      last_updated: '2026-07-13'
    };
  });
}

function electricityCountries() {
  const rows = [
    ['NG', 'Nigeria', 'NGN', 'west'],
    ['KE', 'Kenya', 'KES', 'east'],
    ['ZA', 'South Africa', 'ZAR', 'south'],
    ['GH', 'Ghana', 'GHS', 'west'],
    ['TZ', 'Tanzania', 'TZS', 'east'],
    ['UG', 'Uganda', 'UGX', 'east'],
    ['ET', 'Ethiopia', 'ETB', 'east'],
    ['EG', 'Egypt', 'EGP', 'north'],
    ['RW', 'Rwanda', 'RWF', 'east'],
    ['CM', 'Cameroon', 'XAF', 'central']
  ];
  return rows.map(function (row, index) {
    return {
      code: row[0],
      name: row[1],
      currency: row[2],
      region: row[3],
      provider: 'Fixture Utility',
      source: 'fixture-live-feed',
      last_updated: '2026-07-13',
      residential: { price_kwh_local: index === 0 ? 999 : 10 + index, price_kwh_usd: 0.1 }
    };
  });
}

test('AfroFX shows fallback freshness instead of silent placeholders', async ({ page }) => {
  await page.goto('/tools/currency-converter/');
  const status = page.locator('#updatedText');
  await expect(status).not.toContainText(/Checking|Loading|--/i, { timeout: 12000 });
  await expect(status).toContainText(/Source|Cached|Stale|Latest|Unavailable|Error/i);
  await expect(page.locator('#resultValue')).not.toHaveText('--');
});

test('AfroFuel renders a dated fallback status and table rows', async ({ page }) => {
  await page.route('**/api/fuel', function (route) {
    return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"offline"}' });
  });
  await page.goto('/tools/fuel-tracker/');
  const status = page.locator('#last-updated');
  await expect(status).not.toContainText(/Checking|Loading|--/i, { timeout: 12000 });
  await expect(status).toContainText(/Source|Cached|Stale|Latest|fallback|Unavailable|Error/i);
  await expect(page.locator('#fuel-data-fallback-note')).toContainText('Showing cached rates from 2026-04-15 — live rates unavailable.');
  await expect.poll(() => page.locator('#price-table-body tr').count()).toBeGreaterThan(10);
});

test('AfroFuel renders API values and hides the fallback warning', async ({ page }) => {
  await page.route('**/api/fuel', function (route) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        timestamp: '2026-07-13T06:00:00Z',
        source: 'fixture-live-feed',
        source_state: 'third_party_snapshot',
        countries: fuelCountries()
      })
    });
  });
  await page.goto('/tools/fuel-tracker/');
  await expect(page.locator('#selected-price-grid')).toContainText('777');
  await expect(page.locator('#fuel-data-fallback-note')).toBeHidden();
  await expect(page.locator('#fuel-source-meta')).toContainText('AfroTools live fuel feed');
});

test('Electricity estimator renders API tariffs and source state', async ({ page }) => {
  await page.route('**/api/electricity', function (route) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        timestamp: '2026-07-13T03:00:00Z',
        source: 'fixture-live-feed',
        countries: electricityCountries()
      })
    });
  });
  await page.goto('/tools/electricity-estimator/');
  await expect(page.locator('#tariffInfo')).toContainText('NGN 999/kWh');
  await expect(page.locator('#electricity-fallback-note')).toBeHidden();
  await expect(page.locator('#electricity-source-meta')).toContainText('AfroTools electricity API');
});

test('Electricity estimator discloses its dated inline fallback', async ({ page }) => {
  await page.route('**/api/electricity', function (route) {
    return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"offline"}' });
  });
  await page.goto('/tools/electricity-estimator/');
  await expect(page.locator('#electricity-fallback-note')).toContainText('Showing cached rates from 2026-03-28 — live rates unavailable.');
  await expect(page.locator('#tariffInfo')).toContainText('225/kWh');
});

test('AfroRates falls back from partial API data to a usable central bank snapshot', async ({ page }) => {
  await page.goto('/tools/afrorates/');
  const status = page.locator('#last-updated');
  await expect(status).not.toContainText(/Checking|Loading|--/i, { timeout: 12000 });
  await expect(status).toContainText(/Source|Cached|Stale|Latest|reference|Unavailable|Error/i);
  await expect(page.locator('#stat-median-rate')).not.toHaveText(/Checking|--/i);
  await expect.poll(() => page.locator('#rate-table-body tr').count()).toBeGreaterThan(10);
});

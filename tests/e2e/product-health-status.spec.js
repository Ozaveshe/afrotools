const { test, expect } = require('@playwright/test');

test('status page renders its static snapshot when live health APIs fail', async ({ page }) => {
  await page.route('**/api/data-freshness', (route) => route.fulfill({ status: 503, body: '{}' }));
  await page.route('**/api/afrostream/health', (route) => route.fulfill({ status: 503, body: '{}' }));
  await page.route('**/status/release.json', (route) => route.fulfill({ status: 404, body: '{}' }));

  await page.goto('/status/');
  await expect(page.locator('h1')).toHaveText('Product and data health');
  await expect(page.locator('#platformStatus .status-row')).toHaveCount(4);
  await expect(page.locator('#productStatus .status-row')).toHaveCount(8);
  await expect(page.locator('#healthSummary')).toContainText('Live checks are unavailable');
  await expect(page.locator('[data-product-id="afrostream"]')).toContainText('historical creator profiles');
  await expect(page.locator('#releaseStatus')).toContainText('No local or preview build is presented as production');
});

test('stale and degraded live evidence is visibly labelled', async ({ page }) => {
  await page.route('**/api/data-freshness', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      checked_at: '2026-08-22T12:00:00Z',
      overall_health: 'degraded',
      categories: {
        fuel: { status: 'stale', updatedAt: '2026-08-01T00:00:00Z', source: 'public-source', records_count: 54 },
        electricity: { status: 'ok', updatedAt: '2026-08-22T10:00:00Z', source: 'public-source', records_count: 5 },
        forex: { status: 'offline', updatedAt: null, source: null, records_count: 0 }
      },
      scholarship: { status: 'degraded', count: 0, lastCheckedAt: '2026-08-20T00:00:00Z' }
    })
  }));
  await page.route('**/api/afrostream/health', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: {
      generated_at: '2026-08-22T12:00:00Z',
      creators: { published: 407 }, streams: { total_published: 913 }, news: { total_published: 1106 },
      sources: { with_error: 1, stale_over_7d: 0 }
    } })
  }));
  await page.route('**/status/release.json', (route) => route.fulfill({ status: 404, body: '{}' }));

  await page.goto('/status/');
  await expect(page.locator('[data-product-id="fuel"] .status-badge')).toHaveText('Stale');
  await expect(page.locator('[data-product-id="fx"] .status-badge')).toHaveText('Temporarily unavailable');
  await expect(page.locator('[data-product-id="scholarships"] .status-badge')).toHaveText('Degraded');
  await expect(page.locator('[data-product-id="afrostream"] .status-badge')).toHaveText('Partial coverage');
});

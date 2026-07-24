const fs = require('fs');
const { test, expect } = require('@playwright/test');

function snapshot(currency) {
  const now = new Date();
  const sourceTime = new Date(now.getTime() - 90 * 1000).toISOString();
  return {
    status: 'fresh',
    source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
    scope: 'provider_reference_not_exchange_quote',
    currency,
    count: 3,
    fetchedAt: now.toISOString(),
    sourceUpdatedAt: sourceTime,
    latestSourceUpdatedAt: sourceTime,
    freshnessCeilingMinutes: 30,
    cache: 'miss',
    data: [
      { id: 'tether', symbol: 'USDT', name: 'Tether', usdPrice: 0.9995, localPrice: currency === 'ngn' ? 1371 : 16.36, usd24hChange: -0.03, local24hChange: 0.02, pegDistancePercent: -0.05, sourceUpdatedAt: sourceTime },
      { id: 'usd-coin', symbol: 'USDC', name: 'USDC', usdPrice: 1.0002, localPrice: currency === 'ngn' ? 1372 : 16.37, usd24hChange: 0.01, local24hChange: 0.03, pegDistancePercent: 0.02, sourceUpdatedAt: sourceTime },
      { id: 'dai', symbol: 'DAI', name: 'Dai', usdPrice: 0.9999, localPrice: currency === 'ngn' ? 1371.5 : 16.365, usd24hChange: null, local24hChange: null, pegDistancePercent: -0.01, sourceUpdatedAt: sourceTime }
    ]
  };
}

test('stablecoin EN and FR are native, receipted and fail closed', async ({ page }) => {
  const errors = [];
  const providerRequests = [];
  let fail = false;
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/api\.coingecko\.com/.test(request.url())) providerRequests.push(request.url());
  });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'accepted'));
  await page.route('**/.netlify/functions/crypto-stablecoins*', route => {
    const currency = new URL(route.request().url()).searchParams.get('currency') || 'ngn';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fail ? { status: 'unavailable', error: 'provider_unavailable' } : snapshot(currency))
    });
  });

  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/crypto/stablecoins/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.__stablecoinSnapshotReady)).toBe(true);
  await expect(page.locator('[data-status]')).toHaveText('Fresh');
  await expect(page.locator('[data-count]')).toHaveText('3');
  await expect(page.locator('[data-stablecoin-body] tr')).toHaveCount(3);
  await expect(page.locator('select[data-currency] option')).toHaveCount(2);
  await expect(page.locator('body')).toContainText('not an exchange premium');
  await expect(page.locator('body')).not.toContainText('Best Price');
  await expect(page.locator('body')).not.toContainText('Binance P2P');

  const csvDownload = page.waitForEvent('download');
  await page.click('[data-export-csv]');
  const csv = fs.readFileSync(await (await csvDownload).path(), 'utf8');
  expect(csv).toContain('provider_reference_not_exchange_quote');
  expect(csv).toContain('CoinGecko');
  expect(csv).toContain('peg_distance');

  const jsonDownload = page.waitForEvent('download');
  await page.click('[data-export-json]');
  const exported = JSON.parse(fs.readFileSync(await (await jsonDownload).path(), 'utf8'));
  expect(exported.scope).toBe('provider_reference_not_exchange_quote');
  expect(exported.source.name).toBe('CoinGecko');
  expect(exported.data).toHaveLength(3);

  await page.locator('html').evaluate(node => node.setAttribute('data-theme', 'dark'));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'artifacts/crypto-stablecoins-vip-en-375-dark.png' });

  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 820 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });

  fail = true;
  await page.click('[data-refresh]');
  await expect(page.locator('[data-status]')).toHaveText('Unavailable');
  await expect(page.locator('[data-stablecoin-body] tr')).toHaveCount(0);
  await expect(page.locator('[data-message]')).toContainText('No cached, estimated or platform prices');

  fail = false;
  await page.goto('/fr/crypto/stablecoins/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.__stablecoinSnapshotReady)).toBe(true);
  await expect(page.locator('[data-status]')).toHaveText('Récent');
  await expect(page.locator('[data-stablecoin-body] tr')).toHaveCount(3);
  await expect(page.locator('h1')).toContainText('sans fausses cotations');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.locator('html').evaluate(node => node.removeAttribute('data-theme'));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'artifacts/crypto-stablecoins-vip-fr-375-light.png' });

  expect(await page.locator('[data-stablecoin-snapshot] select,[data-stablecoin-snapshot] button').evaluateAll(nodes =>
    nodes.every(node => node.tagName === 'BUTTON'
      ? Boolean((node.getAttribute('aria-label') || node.textContent || '').trim())
      : Boolean(node.labels && node.labels.length > 0))
  )).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /crypto|coin|price/i.test(key)))).toEqual([]);
  expect(providerRequests).toEqual([]);
  expect(errors).toEqual([]);
});

const fs = require('fs');
const { test, expect } = require('@playwright/test');

const { snapshot } = require('../support/crypto-market-fixture');

test('crypto prices EN and FR show only receipted snapshots and fail closed', async ({ page }) => {
  const errors = [];
  const providerRequests = [];
  let fail = false;
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/api\.coingecko\.com/.test(request.url())) providerRequests.push(request.url());
  });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'accepted');
  });
  await page.route('**/.netlify/functions/crypto-image*', route => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><circle cx="17" cy="17" r="16" fill="#159264"/></svg>'
  }));
  await page.route('**/.netlify/functions/crypto-prices*', route => {
    const currency = new URL(route.request().url()).searchParams.get('currency') || 'ngn';
    if (fail) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'unavailable', error: 'provider_unavailable' })
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(snapshot(currency))
    });
  });

  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/crypto/prices/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.__cryptoPricesReady)).toBe(true);
  await expect(page.locator('[data-status]')).toHaveText('Fresh');
  await expect(page.locator('[data-count]')).toHaveText('3');
  await expect(page.locator('.cp-market-row')).toHaveCount(3);
  await expect(page.locator('select[data-currency] option')).toHaveCount(2);
  await expect(page.locator('body')).toContainText('never a made-up conversion');

  await page.fill('[data-search]', 'ethereum');
  await expect(page.locator('.cp-market-row')).toHaveCount(1);
  await page.fill('[data-search]', '');
  await page.locator('.cp-detail-button').first().click();
  await expect(page.locator('.cp-detail-row:not([hidden])')).toContainText('Provider updated');

  const csvDownload = page.waitForEvent('download');
  await page.click('[data-export-csv]');
  const csvPath = await (await csvDownload).path();
  const csv = fs.readFileSync(csvPath, 'utf8');
  expect(csv).toContain('"source","CoinGecko"');
  expect(csv).toContain('"source_updated_at_oldest"');
  expect(csv).toContain('"currency","NGN"');

  const jsonDownload = page.waitForEvent('download');
  await page.click('[data-export-json]');
  const jsonPath = await (await jsonDownload).path();
  const exported = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  expect(exported.source.name).toBe('CoinGecko');
  expect(exported.freshnessCeilingMinutes).toBe(30);
  expect(exported.count).toBe(3);

  const documentElement = page.locator('html');
  await documentElement.evaluate(node => node.setAttribute('data-theme', 'dark'));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'artifacts/crypto-prices-vip-en-375-dark.png' });

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
  await expect(page.locator('.cp-market-row')).toHaveCount(0);
  await expect(page.locator('[data-message]')).toContainText('No cached or estimated prices');

  fail = false;
  await page.goto('/fr/crypto/prices/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.__cryptoPricesReady)).toBe(true);
  await expect(page.locator('[data-status]')).toHaveText('Récent');
  await expect(page.locator('.cp-market-row')).toHaveCount(3);
  await expect(page.locator('h1')).toContainText('avec leur reçu');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.locator('html').evaluate(node => node.removeAttribute('data-theme'));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'artifacts/crypto-prices-vip-fr-375-light.png' });

  expect(await page.locator('[data-crypto-prices] input,[data-crypto-prices] select,[data-crypto-prices] button').evaluateAll(nodes =>
    nodes.every(node => node.tagName === 'BUTTON'
      ? Boolean((node.getAttribute('aria-label') || node.textContent || '').trim())
      : Boolean(node.labels && node.labels.length > 0))
  )).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /crypto|coin|price/i.test(key)))).toEqual([]);
  expect(providerRequests).toEqual([]);
  expect(errors).toEqual([]);
});

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

const snapshot = {
  status: 'fresh',
  source: { name: 'CoinGecko', url: 'https://www.coingecko.com/' },
  currency: 'ngn',
  fetchedAt: new Date().toISOString(),
  sourceUpdatedAt: new Date(Date.now() - 120000).toISOString(),
  latestSourceUpdatedAt: new Date(Date.now() - 60000).toISOString(),
  freshnessCeilingMinutes: 30,
  data: [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 100000000, price_change_percentage_24h_in_currency: 2 },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 5000000, price_change_percentage_24h_in_currency: null },
  ],
};

async function mockMarket(page) {
  await page.route('**/api/crypto/prices?*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(snapshot),
  }));
}

test('English portfolio is private, lot-based, exportable and mobile-safe', async ({ page }) => {
  const external = [];
  page.on('request', request => {
    if (/api\.coingecko|\/api\/crypto-portfolio|\/api\/crypto-advisor|supabase/i.test(request.url())) external.push(request.url());
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => localStorage.setItem('aft_theme', 'dark'));
  await mockMarket(page);
  await page.goto('/crypto/portfolio/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('without uploading');
  await expect(page.locator('[data-el=status]')).toContainText('Fresh market');
  await expect(page.locator('[data-el=source]')).toHaveText('CoinGecko');
  await page.locator('[data-el=asset]').selectOption('bitcoin');
  await page.locator('[data-el=quantity]').fill('2');
  await page.locator('[data-el=cost]').fill('120000000');
  await page.locator('[data-el=label]').fill('=HYPERLINK("<img src=x onerror=alert(1)>")');
  await page.getByRole('button', { name: 'Add lot' }).click();
  await page.locator('[data-el=asset]').selectOption('bitcoin');
  await page.locator('[data-el=quantity]').fill('1');
  await page.getByRole('button', { name: 'Add lot' }).click();
  await expect(page.locator('[data-el=totalValue]')).toContainText('300,000,000');
  await expect(page.locator('[data-el=knownCost]')).toContainText('120,000,000');
  await expect(page.locator('[data-el=pnl]')).toContainText('80,000,000');
  await expect(page.locator('[data-el=coverage]')).toHaveText('66.7%');
  await expect(page.locator('tbody img')).toHaveCount(0);
  await expect(page.locator('[data-el=currency]')).toBeDisabled();
  expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(375);
  const localLotsLayout = await page.locator('.cp-table-wrap').evaluate(section => {
    const toolbar = section.querySelector('.cp-btns').getBoundingClientRect();
    const scroller = section.querySelector('.cp-table-scroll');
    const scrollRect = scroller.getBoundingClientRect();
    return {
      sectionWidth: section.getBoundingClientRect().width,
      toolbarWidth: toolbar.width,
      scrollerWidth: scrollRect.width,
      tableWidth: scroller.querySelector('table').getBoundingClientRect().width,
      scrollerBelowToolbar: scrollRect.top >= toolbar.bottom,
      hasIntentionalTableScroll: scroller.scrollWidth > scrollRect.width,
    };
  });
  expect(localLotsLayout.sectionWidth).toBeGreaterThanOrEqual(330);
  expect(localLotsLayout.toolbarWidth).toBeGreaterThanOrEqual(295);
  expect(localLotsLayout.scrollerWidth).toBeGreaterThanOrEqual(295);
  expect(localLotsLayout.scrollerBelowToolbar).toBe(true);
  expect(localLotsLayout.hasIntentionalTableScroll).toBe(true);
  expect(localLotsLayout.tableWidth).toBeGreaterThanOrEqual(780);
  const [csvDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
  expect(csvDownload.suggestedFilename()).toBe('crypto-portfolio.csv');
  expect(fs.readFileSync(await csvDownload.path(), 'utf8')).toContain('"\'=HYPERLINK');
  const [pdfDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export PDF' }).click()]);
  expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
  const parsedPdf = await pdfParse(fs.readFileSync(await pdfDownload.path()));
  expect(parsedPdf.text).toContain('Crypto portfolio snapshot');
  expect(parsedPdf.text).toContain('CoinGecko');
  expect(parsedPdf.text).toContain('Cost coverage: 66.7%');
  expect(external).toEqual([]);
  await page.screenshot({ path: 'artifacts/crypto-portfolio-vip-en-375-dark.png', fullPage: true });
});

test('French surface is native and unavailable data fails closed', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route('**/api/crypto/prices?*', route => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'unavailable', error: 'provider_unavailable' }),
  }));
  await page.goto('/fr/crypto/portfolio/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('sans téléverser');
  await expect(page.locator('[data-el=status]')).toContainText('indisponibles');
  await expect(page.locator('[data-el=totalValue]')).toHaveText('—');
  await expect(page.locator('[data-el=asset] option')).toHaveCount(1);
  await page.screenshot({ path: 'artifacts/crypto-portfolio-vip-fr-desktop-light.png', fullPage: true });
});

test('missing held asset withholds all totals after validated JSON import', async ({ page }) => {
  await mockMarket(page);
  await page.goto('/crypto/portfolio/');
  await page.getByRole('button', { name: 'Import JSON' }).click();
  await page.locator('[data-el=importText]').fill(JSON.stringify({
    version: 1,
    currency: 'NGN',
    lots: [{ id: 'x', assetId: 'not-in-feed', symbol: 'NOPE', name: 'Missing asset', quantity: 1, cost: 10, acquiredOn: null, label: '' }],
  }));
  await page.getByRole('button', { name: 'Validate and import' }).click();
  await expect(page.locator('[data-el=status]')).toContainText('absent');
  await expect(page.locator('[data-el=totalValue]')).toHaveText('—');
  await expect(page.locator('[data-el=pnl]')).toHaveText('—');
});

const { test, expect } = require('@playwright/test');

const ROUTE = '/sw/zana/bei-na-akili-ya-gari/';

async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function parseCsvLine(line) {
  const cells = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(value); value = ''; }
    else value += char;
  }
  cells.push(value);
  return cells;
}

async function openLocal(page, external) {
  await page.route(/^https?:\/\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    external.push(route.request().url());
    return route.fulfill({ status: 204, body: '' });
  });
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#swCarCountry option')).toHaveCount(20);
  await expect(page.locator('#swCarMatches li')).toHaveCount(12);
}

test('native platform fails closed while preserving the full catalog workflow', async ({ page }) => {
  const external = [];
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await openLocal(page, external);

  await expect(page.locator('#swCarFreshness')).toContainText('imepitwa na muda');
  await expect(page.locator('#swCarFreshness')).toContainText('hatua za bei zimezuiwa');
  await expect(page.locator('#swCarRecommendation')).toBeDisabled();
  await expect(page.locator('#swCarDecision')).toContainText('zimezuiwa');
  await expect(page.locator('#swCarSources li')).toHaveCount(6);
  await expect(page.locator('#swCarCompare tr')).toHaveCount(4);
  await expect(page.locator('#swCarSourceDate')).toContainText('2026-');
  await expect(page.locator('#swCarLocalDate')).toContainText('2026-');

  await page.locator('#swCarSearch').fill('Hilux');
  await page.getByRole('button', { name: 'Onyesha rekodi' }).click();
  await expect(page.locator('#swCarMatches')).toContainText('Hilux');
  await expect(page.locator('#swCarVehicle')).toContainText('Hilux');

  await page.locator('#swCarRisk').fill('-1');
  await page.getByRole('button', { name: 'Onyesha rekodi' }).click();
  await expect(page.locator('#swCarError')).toContainText('Sahihisha namba');
  await expect(page.locator('#swCarVehicle')).toHaveText('—');
  await expect(page.locator('#swCarCompare')).toBeEmpty();
  await page.getByRole('button', { name: 'Weka upya' }).click();
  await expect(page.locator('#swCarError')).toBeEmpty();
  await expect(page.locator('#swCarVehicle')).not.toHaveText('—');

  await page.locator('#swCarWatch').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools.sw.car-price.watchlist.v1')));
  expect(saved).toHaveLength(1);
  expect(saved[0]).toEqual(expect.objectContaining({ vehicle: expect.any(String), countryCode: expect.any(String), sourceDate: expect.any(String) }));
  expect(Object.keys(saved[0]).sort()).toEqual(['countryCode', 'sourceDate', 'vehicle']);

  const jsonPending = page.waitForEvent('download');
  await page.locator('#swCarJson').click();
  const json = JSON.parse(await readDownload(await jsonPending));
  expect(json.currentPriceClaim).toBe(false);
  expect(json.recommendation).toBe('blocked');
  expect(json.sourceBandUsd).toHaveLength(3);
  expect(json.localBandUsd).toHaveLength(3);

  const csvPending = page.waitForEvent('download');
  await page.locator('#swCarCsv').click();
  const csv = await readDownload(await csvPending);
  const csvRows = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(csvRows[0]);
  const values = parseCsvLine(csvRows[1]);
  expect(values).toHaveLength(headers.length);
  expect(values[headers.indexOf('recommendation')]).toBe('blocked');
  expect(values[headers.indexOf('currentPriceClaim')]).toBe('false');

  const txtPending = page.waitForEvent('download');
  await page.locator('#swCarTxt').click();
  const txt = await readDownload(await txtPending);
  expect(txt).toContain('Hali: IMEZUIWA');
  expect(txt).toContain('si bei ya sasa wala pendekezo');

  await page.locator('#swCarCopy').click();
  await expect(page.locator('#swCarExportStatus')).toContainText('imenakiliwa');
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('mobile, zoom, themes, keyboard and search metadata remain sound', async ({ page }) => {
  const external = [];
  await page.setViewportSize({ width: 320, height: 900 });
  await openLocal(page, external);
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  const overflow320 = await page.evaluate(() => ({
    amount: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    metrics: ['.sw-car-shell', '.sw-car-grid', '.sw-car-result', '.sw-car-compare', '.sw-car-compare table'].map((selector) => { const node = document.querySelector(selector); const style = getComputedStyle(node); const rect = node.getBoundingClientRect(); return { selector, left: rect.left, right: rect.right, width: rect.width, display: style.display, grid: style.gridTemplateColumns, overflowX: style.overflowX, boxSizing: style.boxSizing, cssWidth: style.width, minWidth: style.minWidth }; }),
    shadows: Array.from(document.querySelectorAll('*')).filter((node) => node.shadowRoot).map((node) => ({ tag: node.tagName, id: node.id, hostWidth: node.getBoundingClientRect().width, shadowScroll: node.shadowRoot.documentElement?.scrollWidth || node.shadowRoot.firstElementChild?.scrollWidth || 0, children: Array.from(node.shadowRoot.querySelectorAll('*')).filter((child) => child.getBoundingClientRect().right > 321).slice(0, 5).map((child) => ({ tag: child.tagName, className: child.className, right: child.getBoundingClientRect().right })) })),
    elements: Array.from(document.querySelectorAll('body *')).filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
    }).slice(0, 12).map((node) => ({ tag: node.tagName, id: node.id, className: node.className, right: Math.round(node.getBoundingClientRect().right), scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }))
  }));
  expect(overflow320.amount, JSON.stringify(overflow320)).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await expect(page.locator('#swCarFreshness')).toBeVisible();
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; document.documentElement.style.fontSize = '100%'; });
  await page.keyboard.press('Tab');
  await expect(page.locator('body :focus').first()).toBeVisible();
  await page.locator('#swCarSearch').focus();
  await expect(page.locator('#swCarSearch')).toBeFocused();

  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://afrotools.com/sw/zana/bei-na-akili-ya-gari/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/cars/');
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/cars/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/car-price-intelligence.webp');
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema.inLanguage).toBe('sw');
  expect(schema.url).toBe('https://afrotools.com/sw/zana/bei-na-akili-ya-gari/');
  await expect(page.locator('#swCarArtwork')).toHaveAttribute('src', /assets\/img\//);
  const unnamed = await page.locator('#swCarPriceApp input,#swCarPriceApp select,#swCarPriceApp button').evaluateAll((nodes) => nodes.filter((node) => !node.labels?.length && !node.getAttribute('aria-label') && !node.textContent.trim()).map((node) => node.id));
  expect(unnamed).toEqual([]);
  expect(external).toEqual([]);
});

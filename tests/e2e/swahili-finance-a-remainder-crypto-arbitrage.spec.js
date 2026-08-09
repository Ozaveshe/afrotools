const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

const route = '/sw/zana/karatasi-ya-arbitrage-ya-crypto/';

function localDateTime(offsetMinutes) {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function openPrivate(page, context, width = 375) {
  await page.setViewportSize({ width, height: 900 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  const telemetry = { errors: [], failed: [], data: [], postBodies: [] };
  page.on('console', (message) => { if (message.type() === 'error') telemetry.errors.push(message.text()); });
  page.on('pageerror', (error) => telemetry.errors.push(error.message));
  page.on('requestfailed', (request) => telemetry.failed.push(request.url()));
  page.on('request', (request) => {
    if (['xhr', 'fetch', 'websocket'].includes(request.resourceType())) telemetry.data.push(request.url());
    if (request.method() !== 'GET' && request.postData()) telemetry.postBodies.push(request.postData());
  });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  return telemetry;
}

async function fillValid(page) {
  await page.locator('#aw-asset').fill('USDT');
  await page.locator('#aw-amount').fill('100');
  await page.locator('#aw-buy-label').fill('NJIA-SIRI-A');
  await page.locator('#aw-sell-label').fill('NJIA-SIRI-B');
  await page.locator('#aw-buy-debit').fill('150000');
  await page.locator('#aw-sell-credit').fill('156000');
  await page.locator('#aw-costs').fill('1000');
  await page.locator('#aw-buy-checked').fill(localDateTime(-10));
  await page.locator('#aw-buy-expiry').fill(localDateTime(50));
  await page.locator('#aw-sell-checked').fill(localDateTime(-8));
  await page.locator('#aw-sell-expiry').fill(localDateTime(52));
  await page.locator('#aw-confirm').check();
}

function parseCsv(text) {
  return text.trim().split(/\r?\n/).map((line) => {
    const cells = []; let cell = ''; let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"' && quoted && line[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === ',' && !quoted) { cells.push(cell); cell = ''; }
      else cell += ch;
    }
    cells.push(cell); return cells;
  });
}

test('native Swahili workflow, stale/reset/invalid states and every export reopen', async ({ page, context }) => {
  const telemetry = await openPrivate(page, context);
  await page.locator('#aw-form button[type="submit"]').click();
  await expect(page.locator('#aw-status')).toContainText('Jaza kila sehemu');
  await expect(page.locator('#aw-asset')).toBeFocused();
  await fillValid(page);
  await page.locator('#aw-form button[type="submit"]').click();
  await expect(page.locator('#aw-results')).toBeVisible();
  await expect(page.locator('#aw-net')).toContainText(/5[,.\s]?000/);
  await expect(page.locator('#aw-gross')).toContainText(/6[,.\s]?000/);
  await expect(page.locator('#aw-break-even')).toContainText(/151[,.\s]?000/);
  await expect(page.locator('#aw-return')).toHaveText('3.33%');

  await page.locator('#aw-copy').click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('Karatasi ya uwezekano wa arbitrage');
  expect(copied).toContain('NJIA-SIRI-A');
  expect(copied).not.toContain('Asset:');

  const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#aw-json').click()]);
  const jsonPath = await jsonDownload.path();
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  expect(json.language).toBe('sw');
  expect(json.outputs).toEqual(expect.objectContaining({ grossDifferenceNGN: 6000, netModeledDifferenceNGN: 5000, breakEvenSellCreditNGN: 151000 }));
  expect(json.inputs.buyRouteLabel).toBe('NJIA-SIRI-A');

  const [csvDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#aw-csv').click()]);
  const csv = parseCsv(fs.readFileSync(await csvDownload.path(), 'utf8'));
  expect(csv.find((row) => row[0] === 'net_modeled_difference_ngn')).toEqual(['net_modeled_difference_ngn', '5000']);
  expect(csv.find((row) => row[0] === 'break_even_sell_credit_ngn')).toEqual(['break_even_sell_credit_ngn', '151000']);

  const [pdfDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#aw-pdf').click()]);
  const pdfBuffer = fs.readFileSync(await pdfDownload.path());
  expect(pdfBuffer.subarray(0, 5).toString()).toBe('%PDF-');
  const parsed = await pdfParse(pdfBuffer);
  expect(parsed.numpages).toBeGreaterThanOrEqual(1);
  expect(parsed.text).toMatch(/USDT/);
  expect(parsed.text).toMatch(/151[,.\s]?000/);

  await page.locator('#aw-sell-credit').fill('157000');
  await expect(page.locator('#aw-results')).toBeHidden();
  await expect(page.locator('#aw-json')).toBeDisabled();
  await page.locator('#aw-reset').click();
  await expect(page.locator('#aw-asset')).toHaveValue('');
  await expect(page.locator('#aw-asset')).toBeFocused();
  expect(telemetry.postBodies).toEqual([]);
  const networkReceipt = JSON.stringify(telemetry.data.concat(telemetry.postBodies));
  expect(networkReceipt).not.toContain('NJIA-SIRI-A');
  expect(networkReceipt).not.toContain('NJIA-SIRI-B');
  expect(networkReceipt).not.toContain('150000');
  expect(networkReceipt).not.toContain('156000');
  expect(telemetry.errors).toEqual([]);
});

for (const width of [320, 375]) {
  test(`${width}px, dark theme, keyboard and reflow remain usable`, async ({ page, context }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    const telemetry = await openPrivate(page, context, width);
    await expect(page.locator('h1')).toContainText('arbitrage ya crypto');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.locator('#aw-asset').evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(200);
    expect(telemetry.errors).toEqual([]);
  });
}

test('200% reflow, SEO/schema, reciprocal hreflang and artwork are correct', async ({ page, context }) => {
  await openPrivate(page, context, 640);
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/karatasi-ya-arbitrage-ya-crypto/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://afrotools.com/sw/zana/karatasi-ya-arbitrage-ya-crypto/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/crypto/arbitrage/');
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/crypto/arbitrage/');
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/karatasi-ya-arbitrage-ya-crypto/');
  const schema = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(schema)[0]).toEqual(expect.objectContaining({ inLanguage: 'sw', applicationCategory: 'FinanceApplication' }));
  const artwork = await page.request.get('/assets/img/tools/crypto-arbitrage.webp');
  expect(artwork.status()).toBe(200);
  expect((await artwork.body()).length).toBeGreaterThan(1000);
});

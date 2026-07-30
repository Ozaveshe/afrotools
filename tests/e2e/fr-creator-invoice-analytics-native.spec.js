const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

async function readDownload(download) {
  const file = await download.path();
  return fs.readFileSync(file);
}

async function assertSurface(page, route, expectedLang) {
  const consoleErrors = [];
  const sensitiveRequests = [];
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => {
    if (/supabase|\/api\/|ai-advisor|anthropic|openai/i.test(request.url())) sensitiveRequests.push(request.url());
  });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', expectedLang);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(1);
  await expect(page.locator('meta[name="geo.region"]')).toHaveAttribute('content', '002');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/assets\/img\/tools\//);
  expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
  expect(await page.locator('iframe').count()).toBe(0);

  for (const theme of ['dark', 'light']) {
    await page.evaluate((nextTheme) => document.documentElement.setAttribute('data-theme', nextTheme), theme);
    expect(await page.evaluate(() => getComputedStyle(document.body).colorScheme || document.documentElement.dataset.theme)).toBeTruthy();
  }
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
  expect(sensitiveRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

for (const locale of [
  { lang: 'en', invoice: '/tools/creator-invoice/app.html', analytics: '/tools/creator-analytics/app.html' },
  { lang: 'fr', invoice: '/fr/tools/facture-createur/app.html', analytics: '/fr/tools/stats-createur/app.html' },
]) {
  test(`${locale.lang} creator invoice calculates, persists and reopens PDF JSON and TXT`, async ({ page }) => {
    await page.goto(locale.invoice, { waitUntil: 'domcontentloaded' });
    await page.locator('#ciTaxRate').fill('18');
    await page.locator('#ciDiscountValue').fill('10');
    await page.locator('[data-creator-invoice-app] form button[type="submit"]').click();
    await expect(page.locator('#ciPreviewTotal')).not.toHaveText('');
    const result = await page.evaluate(() => window.__creatorInvoiceLastResult);
    expect(result.valid).toBe(true);
    expect(result.items[0].description).toBeTruthy();
    expect(result.total).toBeGreaterThan(0);

    const jsonPending = page.waitForEvent('download');
    await page.locator('#ciJson').click();
    const json = JSON.parse((await readDownload(await jsonPending)).toString('utf8'));
    expect(json.invoiceNumber).toBe('INV-001');
    expect(json.total).toBe(result.total);

    const txtPending = page.waitForEvent('download');
    await page.locator('#ciText').click();
    const txt = (await readDownload(await txtPending)).toString('utf8');
    expect(txt).toContain('INV-001');
    expect(txt).toMatch(locale.lang === 'fr' ? /FACTURE/ : /INVOICE/);

    const pdfPending = page.waitForEvent('download');
    await page.locator('#ciPdf').click();
    const parsed = await pdfParse(await readDownload(await pdfPending));
    expect(parsed.text).toMatch(locale.lang === 'fr' ? /FACTURE/ : /INVOICE/);
    expect(parsed.text).toContain('INV-001');
    expect(parsed.text).toContain('Studio Kora');
    expect(parsed.text).toContain('TOTAL');

    await page.locator('#ciSave').click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#ciLoad').click();
    await expect(page.locator('#ciPreview')).toBeVisible();
    await page.locator('#ciIssuerName').fill('');
    await page.locator('[data-creator-invoice-app] form button[type="submit"]').click();
    await expect(page.locator('#ciError')).not.toHaveText('');
    await expect(page.locator('#ciPdf')).toBeDisabled();
    await assertSurface(page, locale.invoice, locale.lang);
  });

  test(`${locale.lang} creator analytics calculates, persists and reopens CSV and JSON`, async ({ page }) => {
    await page.goto(locale.analytics, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-creator-analytics-app] form button[type="submit"]').click();
    await expect(page.locator('#caPosts')).toHaveText('1');
    await expect(page.locator('#caEngagement')).toHaveText('8.00%');
    const summary = await page.evaluate(() => window.__creatorAnalyticsSummary);
    expect(summary.totalReach).toBe(10000);
    expect(summary.totalInteractions).toBe(800);

    const csvPending = page.waitForEvent('download');
    await page.locator('#caCsv').click();
    const csv = (await readDownload(await csvPending)).toString('utf8');
    const rows = csv.trim().split(/\r?\n/);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('engagement_rate_percent');
    expect(rows[1]).toContain('8.00');

    const jsonPending = page.waitForEvent('download');
    await page.locator('#caJson').click();
    const json = JSON.parse((await readDownload(await jsonPending)).toString('utf8'));
    expect(json.posts).toHaveLength(1);
    expect(json.summary.engagementRate).toBe(8);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#caPosts')).toHaveText('1');
    await page.locator('#caReach').fill('0');
    await page.locator('[data-creator-analytics-app] form button[type="submit"]').click();
    await expect(page.locator('#caError')).not.toHaveText('');
    await expect(page.locator('#caPosts')).toHaveText('1');
    await assertSurface(page, locale.analytics, locale.lang);
  });
}

test('French launchers are native, indexed and route into their local workspaces', async ({ page }) => {
  for (const item of [
    { launcher: '/fr/tools/facture-createur/', app: '/fr/tools/facture-createur/app' },
    { launcher: '/fr/tools/stats-createur/', app: '/fr/tools/stats-createur/app' },
  ]) {
    await assertSurface(page, item.launcher, 'fr');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator(`a[href="${item.app}"]`)).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Ouvrir le calculateur complet');
  }
});

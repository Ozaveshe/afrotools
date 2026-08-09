const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const route = '/sw/zana/kikokotoo-ushuru-wa-stampu-kenya/';

function observe(page) {
  const errors = [];
  const requests = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push({
    url: request.url(),
    method: request.method(),
    postData: request.postData() || ''
  }));
  return { errors, requests };
}

test('proves transfer oracle and parses local CSV, JSON and PDF exports', async ({ page }) => {
  const seen = observe(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto(route, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Kokotoa ushuru wa jedwali' }).click();
  await expect(page.locator('#ks-results')).toBeVisible();
  await expect(page.locator('#ks-payable')).toContainText(/600,000/);
  await expect(page.locator('#ks-band-result')).toContainText('Kipengele 12A');
  await expect(page.locator('#ks-boundary')).toContainText('Tathmini ya KRA');
  await expect(page.locator('#ks-status')).toContainText('Hakuna ulichoweka');
  await page.screenshot({ path: 'artifacts/sw-finance-ke-stamp-duty/375-light-transfer.png', fullPage: true });

  let pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pakua CSV' }).click();
  const csvDownload = await pending;
  expect(csvDownload.suggestedFilename()).toBe('makadirio-ushuru-stampu-kenya.csv');
  const csv = fs.readFileSync(await csvDownload.path(), 'utf8');
  const rows = csv.trim().split(/\r?\n/).map(line => line.match(/"(?:[^"]|"")*"/g).map(cell => cell.slice(1, -1).replace(/""/g, '"')));
  expect(rows[0]).toEqual(['kipengele', 'thamani']);
  expect(rows.find(row => row[0] === 'ushuru_wa_uhamisho')[1]).toBe('600000');
  expect(rows.find(row => row[0] === 'jumla_ya_makadirio')[1]).toBe('600000');

  pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pakua JSON' }).click();
  const jsonDownload = await pending;
  expect(jsonDownload.suggestedFilename()).toBe('makadirio-ushuru-stampu-kenya.json');
  const json = JSON.parse(fs.readFileSync(await jsonDownload.path(), 'utf8'));
  expect(json.language).toBe('sw');
  expect(json.calculation).toMatchObject({
    mode: 'uhamisho',
    location: 'ndani ya manispaa',
    dutiableValue: 15000000,
    transferDuty: 600000,
    payable: 600000
  });
  expect(json.calculation.rateLabel).toContain('Kipengele 12A');
  expect(json.calculation.boundary).toContain('Makadirio ya kupanga');

  pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pakua PDF' }).click();
  const pdfDownload = await pending;
  expect(pdfDownload.suggestedFilename()).toBe('makadirio-ushuru-stampu-kenya.pdf');
  const parsed = await pdfParse(fs.readFileSync(await pdfDownload.path()));
  expect(parsed.text).toContain('Makadirio ya ushuru wa stampu wa Kenya');
  expect(parsed.text).toMatch(/600,000/);
  expect(parsed.text).toContain('Kipengele 12A');
  expect(parsed.text).toContain('Kenya Law');

  expect(await page.locator('[data-ke-stamp-duty] input,[data-ke-stamp-duty] select').evaluateAll(elements =>
    elements.every(element => element.labels && element.labels.length)
  )).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /stamp|duty|ushuru/i.test(key)))).toEqual([]);
  expect(seen.errors).toEqual([]);
  const payloads = seen.requests.map(request => `${request.url}\n${request.postData}`).join('\n');
  for (const privateValue of ['15000000', '600000', '2026-07-23']) {
    expect(payloads).not.toContain(privateValue);
  }
  expect(seen.requests.filter(request => request.method !== 'GET')).toEqual([]);
});

test('proves lease oracle, invalid state and stale-result clearing', async ({ page }) => {
  const seen = observe(page);
  await page.goto(route);
  await page.locator('input[name="ks-mode"][value="lease"]').check();
  await page.locator('#ks-term-years').fill('2');
  await page.locator('#ks-annual-rent').fill('1200000');
  await page.locator('#ks-premium').fill('1000000');
  await page.getByRole('button', { name: 'Kokotoa ushuru wa jedwali' }).click();
  await expect(page.locator('#ks-rent-result')).toContainText(/12,000/);
  await expect(page.locator('#ks-premium-result')).toContainText(/40,000/);
  await expect(page.locator('#ks-payable')).toContainText(/52,000/);
  await expect(page.locator('#ks-band-result')).toContainText('zaidi ya mwaka mmoja');

  await page.locator('#ks-term-years').fill('0');
  await expect(page.locator('#ks-results')).toBeHidden();
  await expect(page.locator('#ks-status')).toContainText('Kokotoa tena');
  await page.getByRole('button', { name: 'Kokotoa ushuru wa jedwali' }).click();
  await expect(page.locator('#ks-error')).toContainText('zaidi ya miaka sifuri');
  await expect(page.locator('#ks-results')).toBeHidden();
  expect(seen.errors).toEqual([]);
});

for (const width of [320, 375]) {
  test(`reflows without clipping at ${width}px in system dark mode`, async ({ page }) => {
    const seen = observe(page);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(route);
    await page.getByRole('button', { name: 'Kokotoa ushuru wa jedwali' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
    expect(await page.locator('.ks-page').evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgb(247, 249, 252)');
    if (width === 320) await page.screenshot({ path: 'artifacts/sw-finance-ke-stamp-duty/320-dark-transfer.png', fullPage: true });
    expect(seen.errors).toEqual([]);
  });
}

test('supports 200% reflow, manual themes, keyboard focus, schema and reciprocal metadata', async ({ page }) => {
  const seen = observe(page);
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto(route);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
    document.documentElement.dataset.theme = 'dark';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  await page.keyboard.press('Tab');
  await expect(page.locator('.ks-skip')).toBeFocused();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${route}`);
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/ke-stamp-duty/');
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/ke-droits-timbre/');
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', `https://afrotools.com${route}`);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/ke-stamp-duty.webp');
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  const parsed = schemas.map(text => JSON.parse(text));
  expect(parsed.some(item => item['@type'] === 'WebApplication' && item.inLanguage === 'sw')).toBeTruthy();
  expect(parsed.some(item => item['@type'] === 'FAQPage' && item.inLanguage === 'sw')).toBeTruthy();
  expect(seen.errors).toEqual([]);

  for (const pair of [
    ['/tools/ke-stamp-duty/', route],
    ['/fr/tools/ke-droits-timbre/', route]
  ]) {
    await page.goto(pair[0]);
    await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', `https://afrotools.com${pair[1]}`);
  }
});

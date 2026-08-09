const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

const route = '/sw/zana/kikokotoo-wht-ghana/';

test('Swahili Ghana WHT calculates locally and reopens its advertised PDF', async ({ page }) => {
  const writes = [];
  const localFailures = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url());
  });
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1:43157/') && response.status() >= 400) {
      localFailures.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.goto(route);
  await page.locator('#grossAmount').fill('50000');
  await page.locator('#yearToDateBefore').fill('0');
  await page.locator('#category').selectOption('services');
  await page.getByRole('button', { name: 'Kokotoa rejea ya WHT' }).click();
  await expect(page.locator('#withheldResult')).toContainText('3,750');
  await expect(page.locator('#netResult')).toContainText('46,250');
  await expect(page.locator('#status')).toContainText('Rejea ya WHT imesasishwa');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pakua PDF ya faragha' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('afrotools-rejea-wht-ghana-2026-07-22.pdf');
  const file = await download.path();
  const bytes = fs.readFileSync(file);
  expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
  const parsed = await pdfParse(bytes);
  expect(parsed.text).toContain('Rejea ya WHT Ghana');
  expect(parsed.text).toMatch(/50.?000/);
  expect(parsed.text).toMatch(/3.?750/);
  expect(writes.every((url) => !decodeURIComponent(url).includes('50000'))).toBe(true);
  expect(writes.every((url) => !decodeURIComponent(url).includes('3750'))).toBe(true);
  expect(writes.every((url) => /google-analytics\.com|googlesyndication\.com/.test(url))).toBe(true);
  expect(localFailures).toEqual([]);
});

test('Swahili Ghana WHT passes mobile, zoom, theme, keyboard and metadata checks', async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kikokotoo-wht-ghana/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /gh-paye-2\.webp$/);
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('background-color', /rgb|rgba/);
});

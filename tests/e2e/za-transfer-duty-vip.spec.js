'use strict';

const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const fs = require('node:fs');
const isConsentModeTelemetry = (url) => /^(?:https:\/\/(?:www\.)?google-analytics\.com\/g\/collect|https:\/\/www\.google\.com\/g\/collect|https:\/\/pagead2\.googlesyndication\.com\/measurement\/conversion|https:\/\/www\.googletagmanager\.com\/td)/.test(url);

for (const route of ['/tools/za-transfer-duty/', '/fr/tools/za-droits-mutation/']) {
  test(`${route} calculates and creates a local PDF`, async ({ page }) => {
    const errors = [];
    const requests = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push({ url: request.url(), method: request.method() }));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    await page.locator('#td-form button[type=submit]').click();
    await expect(page.locator('#td-results')).toBeVisible();
    await expect(page.locator('#td-duty')).toContainText('67');
    const pending = page.waitForEvent('download');
    await page.locator('#td-pdf').click();
    const download = await pending;
    const parsed = await pdfParse(fs.readFileSync(await download.path()));
    expect(parsed.text).toContain(route.startsWith('/fr/') ? 'Calculez les droits sur la valeur reellement evaluee par SARS.' : 'South Africa transfer-duty estimate');
    expect(await page.evaluate(() => [...document.querySelectorAll('input,select')].every((element) => element.labels && element.labels.length))).toBeTruthy();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
    expect(errors).toEqual([]);
    expect(requests.filter((request) => !isConsentModeTelemetry(request.url) && (request.method !== 'GET' || /\.netlify\/functions|\/api\/|supabase|beacon/i.test(request.url)))).toEqual([]);
    if (route === '/tools/za-transfer-duty/') await page.screenshot({ path: 'artifacts/finance-row-102-za-transfer-duty/375-light-result.png', fullPage: true });
  });
}

test('uses greater value, fails closed by date, and covers responsive dark layouts', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/za-transfer-duty/');
  await page.locator('#td-consideration').fill('2000000');
  await page.locator('#td-other').fill('100000');
  await page.locator('#td-fair').fill('2200000');
  await page.locator('#td-form button[type=submit]').click();
  await expect(page.locator('#td-basis')).toContainText('2,200,000');
  await expect(page.locator('#td-duty')).toContainText('45,786');
  await page.locator('#td-date').fill('2026-03-31');
  await page.locator('#td-form button[type=submit]').click();
  await expect(page.locator('#td-error')).toContainText('1 April');
  await expect(page.locator('#td-results')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  await page.setViewportSize({ width: 768, height: 900 });
  await page.locator('#td-date').fill('2026-07-23');
  await page.evaluate(() => window.AfroTools.darkMode.set('dark'));
  await page.reload();
  await page.locator('#td-form button[type=submit]').click();
  await expect(page.locator('#td-results')).toBeVisible();
  await page.screenshot({ path: 'artifacts/finance-row-102-za-transfer-duty/768-dark.png', fullPage: true });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
});

test('creates a real local PDF document', async ({ page }) => {
  await page.goto('/tools/za-transfer-duty/');
  await page.locator('#td-form button[type=submit]').click();
  const pending = page.waitForEvent('download');
  await page.locator('#td-pdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  const stream = await download.createReadStream();
  let header = '';
  for await (const chunk of stream) {
    header += chunk.subarray(0, 4).toString('ascii');
    break;
  }
  expect(header).toBe('%PDF');
});

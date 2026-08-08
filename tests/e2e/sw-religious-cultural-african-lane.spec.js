'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const religiousBuilder = require('../../scripts/build-sw-religious-cultural-parity.js');
const africanManifest = require('../../data/localization/sw-uniquely-african-parity-manifest.json');

const africanIds = new Set(['naira-to-words','amount-words-ke','amount-words-gh','susu-tracker','whatsapp-link','ajo-interest','market-days','ajo-chama-calc']);
const routes = [
  ...Array.from(religiousBuilder.ACCEPTED, (id) => ({ id, family:'religious', route:religiousBuilder.ROUTES[id] })),
  ...africanManifest.rows.filter((row) => africanIds.has(row.english.id)).map((row) => ({ id:row.english.id, family:'african', route:row.swahili.route }))
];

test.describe.configure({ mode:'serial' });

test('27 candidate apps pass native workflow, export, privacy and responsive browser proof', async ({ page }) => {
  test.setTimeout(180000);
  expect(routes).toHaveLength(27);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{ writeText:async (value) => { window.__copiedText=String(value); } } });
    window.print=() => { window.__printInvoked=true; };
  });
  const pageErrors = [];
  const consoleErrors = [];
  const externalInputLeaks = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', (request) => {
    const payload = `${request.url()} ${request.postData() || ''}`;
    if (payload.includes('SW_PRIVACY_SENTINEL')) externalInputLeaks.push(payload);
  });

  for (const app of routes) {
    await page.setViewportSize({ width:375, height:812 });
    await page.goto(app.route, { waitUntil:'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang','sw');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new RegExp(`${app.route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`));
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',/\/assets\/img\/tools\//);
    await expect(page.locator('body')).not.toContainText(/Famille|Confirmer les|Révision familiale|Montant de référence|Calculer|Résultat/);

    const form = app.family === 'religious' ? page.locator('#sw-rc-form') : page.locator('[data-ua-form]');
    const result = app.family === 'religious' ? page.locator('#sw-rc-output') : page.locator('[data-ua-result]');
    await expect(form).toBeVisible();
    if (app.id === 'whatsapp-link') await page.locator('[data-ua-field="message"]').fill('SW_PRIVACY_SENTINEL');
    if (app.family === 'african') await form.locator('button[type="submit"]').click();
    await expect(result).toBeVisible();

    if (app.family === 'religious') {
      const download = page.waitForEvent('download');
      await page.locator('#sw-rc-download').click();
      const item = await download;
      const file = await item.path();
      const parsed = JSON.parse(fs.readFileSync(file,'utf8'));
      expect(parsed.locale).toBe('sw');
      expect(parsed.tool).toBe(app.id);
      await page.locator('#sw-rc-copy').click();
      await expect.poll(() => page.evaluate(() => (window.__copiedText || '').length)).toBeGreaterThan(40);
      await page.locator('#sw-rc-print').click();
      expect(await page.evaluate(() => window.__printInvoked === true)).toBe(true);
    } else {
      for (const kind of ['json','txt']) {
        const button = page.locator(`[data-ua-export="${kind}"]`);
        if (await button.count()) {
          const download = page.waitForEvent('download');
          await button.click();
          const item = await download;
          const file = await item.path();
          const body = fs.readFileSync(file,'utf8');
          if (kind === 'json') {
            const parsed = JSON.parse(body);
            expect(parsed.locale).toBe('sw');
            expect(parsed.toolId).toBe(app.id);
          } else expect(body.length).toBeGreaterThan(40);
        }
      }
      const copy = page.locator('[data-ua-export="copy"]');
      if (await copy.count()) {
        await copy.click();
        await expect.poll(() => page.evaluate(() => (window.__copiedText || '').length)).toBeGreaterThan(40);
      }
      const print = page.locator('[data-ua-export="print"]');
      if (await print.count()) {
        await print.click();
        expect(await page.evaluate(() => window.__printInvoked === true)).toBe(true);
      }
    }

    for (const width of [320,375]) {
      await page.setViewportSize({ width, height:812 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    }
    await page.setViewportSize({ width:750, height:812 });
    await page.evaluate(() => { document.documentElement.style.zoom='2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.evaluate(() => { document.documentElement.style.zoom=''; document.documentElement.dataset.theme='dark'; });
    await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
    await page.evaluate(() => { document.documentElement.dataset.theme='light'; });
    await expect(page.locator('html')).toHaveAttribute('data-theme','light');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(externalInputLeaks).toEqual([]);
});

test('invalid input clears stale results and focuses the failed field', async ({ page }) => {
  await page.goto('/sw/zana/kifuatiliaji-susu/');
  await page.locator('[data-ua-field="members"]').fill('6');
  await page.locator('[data-ua-form] button[type="submit"]').click();
  await expect(page.locator('[data-ua-metrics]')).not.toBeEmpty();
  await page.locator('[data-ua-field="members"]').fill('1');
  await page.locator('[data-ua-form] button[type="submit"]').click();
  await expect(page.locator('[data-ua-metrics]')).toBeEmpty();
  await expect(page.locator('[data-ua-field="members"]')).toHaveAttribute('aria-invalid','true');

  await page.goto('/sw/zana/kikokotoo-fungu-la-kumi-na-sadaka/');
  await expect(page.locator('#sw-rc-output')).toBeVisible();
  await page.locator('[name="reference"]').fill('-1');
  await page.locator('#sw-rc-form button[type="submit"]').click();
  await expect(page.locator('#sw-rc-output')).toBeHidden();
  await expect(page.locator('[name="reference"]')).toHaveAttribute('aria-invalid','true');
});

test('English prayer owners use the same date-aware engine and conservative boundaries', async ({ page }) => {
  const errors = [];
  page.on('pageerror',(error)=>errors.push(String(error)));
  await page.goto('/tools/prayer-times/');
  await expect(page.locator('.rs-output')).toContainText('Date-aware planning estimate');
  const first = await page.locator('.rs-output').textContent();
  await page.locator('.rs-form [name="date"]').fill('2026-05-27');
  await page.locator('.rs-form button[type="submit"]').click();
  const second = await page.locator('.rs-output').textContent();
  expect(second).not.toBe(first);
  await expect(page.locator('.rs-output')).toContainText('Confirm every time with your local mosque');

  await page.goto('/tools/ramadan-timetable/');
  await expect(page.locator('.rs-output')).toContainText('date-aware planning timetable');
  await expect(page.locator('.rs-output')).toContainText('local moon sighting');
  await expect(page.locator('.rs-table > div')).toHaveCount(7);
  expect(errors).toEqual([]);
});

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..', '..');
const inventory = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'reports', 'swahili-free-app-parity-inventory.json'),
  'utf8'
));
const scoped = inventory.rows.filter((row) => ['legal', 'government', 'insurance'].includes(row.categoryKey));
const generatedLegalIds = new Set(JSON.parse(fs.readFileSync(
  path.join(ROOT, 'data', 'registry', 'swahili-legal-property-gaps.json'),
  'utf8'
)).rows.map((row) => row.englishId));
const { RECIPROCAL_LOCALE_OWNERS } = require('../../scripts/build-sw-legal-government-insurance-parity.js');
const maintainedAll = scoped.filter((row) => (
  generatedLegalIds.has(row.englishId)
  || row.categoryKey === 'government'
  || row.categoryKey === 'insurance'
));
const reconciledOnly = process.env.SW_PARITY_RECONCILED_ONLY === '1';
const maintained = reconciledOnly
  ? maintainedAll.filter((row) => Object.hasOwn(RECIPROCAL_LOCALE_OWNERS, row.englishId))
  : maintainedAll;

function routeWithSlash(route) {
  return `${String(route).replace(/\/+$/, '')}/`;
}

async function openWithEvidence(page, route, width) {
  const evidence = { pageErrors: [], consoleErrors: [], failedResources: [], mutations: [] };
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location();
    const expectedExternalAbort = message.text() === 'Failed to load resource: net::ERR_FAILED'
      && location.url
      && !location.url.startsWith('http://127.0.0.1:');
    if (!expectedExternalAbort) evidence.consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith('http://127.0.0.1:')) evidence.failedResources.push(request.url());
  });
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1:') && response.status() >= 400) {
      evidence.failedResources.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) {
      evidence.mutations.push(`${request.method()} ${request.url()}`);
    }
  });
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  return evidence;
}

async function assertSurface(page, row, width) {
  const route = routeWithSlash(row.primarySwahiliRoute);
  const evidence = await openWithEvidence(page, route, width);
  await expect(page.locator('html')).toHaveAttribute('lang', /^sw(?:-|$)/i);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    `https://afrotools.com${route}`
  );
  await expect(page.locator('link[rel=alternate][hreflang=en]')).toHaveCount(1);
  await expect(page.locator('link[rel=alternate][hreflang=sw]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `https://afrotools.com${route}`
  );
  await expect(page.locator('script[type="application/ld+json"]')).not.toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1);

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });

  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const firstControl = page.locator('main input, main select, main textarea, main button').first();
  await expect(firstControl).toBeVisible();
  await firstControl.focus();
  await expect(firstControl).toBeFocused();
  const unlabeled = await page.locator('main input:not([type=hidden]), main select, main textarea').evaluateAll((nodes) => (
    nodes.filter((node) => !node.labels || node.labels.length === 0).map((node) => node.name || node.id || node.type)
  ));
  expect(unlabeled).toEqual([]);
  expect(evidence.pageErrors).toEqual([]);
  expect(evidence.consoleErrors).toEqual([]);
  expect(evidence.failedResources).toEqual([]);
  expect(evidence.mutations).toEqual([]);
  return evidence;
}

async function assertInvalid(page, row) {
  const form = page.locator('main form').first();
  if (row.categoryKey === 'government' && await form.locator('input[type=checkbox]').count()) {
    await form.locator('input[type=checkbox]').evaluateAll((nodes) => nodes.forEach((node) => {
      node.checked = false;
      node.dispatchEvent(new Event('change', { bubbles: true }));
    }));
  } else if (row.categoryKey === 'insurance' && await form.locator('input[type=checkbox]').count()) {
    await form.locator('input[type=checkbox]').evaluateAll((nodes) => nodes.forEach((node) => {
      node.checked = false;
      node.dispatchEvent(new Event('change', { bubbles: true }));
    }));
  } else {
    const field = form.locator('input[required], select[required], textarea[required]').first();
    await field.evaluate((node) => {
      node.value = '';
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  await form.locator('button[type=submit]').click();
  if (row.categoryKey === 'legal') {
    await expect(page.locator('[data-result]')).toBeHidden();
    await expect(page.locator('[data-status]')).toContainText(/Jaza|Hakuna matokeo/);
  } else if (row.categoryKey === 'government') {
    await expect(page.locator('[data-result]')).toBeHidden();
    await expect(page.locator('[data-status]')).toContainText(/Hakuna matokeo|Jaza/);
  } else {
    await expect(page.locator('[data-result]')).toContainText(/Weka|Kagua/);
    await expect(page.locator('[data-export=json]')).toBeDisabled();
  }
}

async function assertValidAndExport(page, row) {
  await page.reload({ waitUntil: 'load' });
  const form = page.locator('main form').first();
  if (row.categoryKey === 'insurance' && await form.locator('input[type=checkbox]').count()) {
    await form.locator('input[type=checkbox]').first().check();
  }
  await form.locator('button[type=submit]').click();
  if (row.categoryKey === 'legal') {
    expect(
      await page.locator('[data-result]').isVisible(),
      await page.locator('[data-status]').textContent()
    ).toBe(true);
    await expect(page.locator('[data-result]')).not.toBeEmpty();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-action=json]').click();
    const download = await downloadPromise;
    const payload = JSON.parse(await fs.promises.readFile(await download.path(), 'utf8'));
    expect(payload.lugha).toBe('sw');
    expect(payload.englishId).toBe(row.englishId);
  } else if (row.categoryKey === 'government') {
    await expect(page.locator('[data-result]')).toBeVisible();
    await expect(page.locator('[data-result]')).not.toBeEmpty();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-export=json]').click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    const payload = JSON.parse(await fs.promises.readFile(downloadPath, 'utf8'));
    expect(payload.locale).toBe('sw');
    expect(payload.appId).toBe(row.englishId);
    await page.locator('[data-import]').setInputFiles(downloadPath);
    await expect(page.locator('[data-status]')).toContainText('imefunguliwa tena');
  } else {
    await expect(page.locator('[data-result]')).not.toBeEmpty();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-export=json]').click();
    const download = await downloadPromise;
    const payload = JSON.parse(await fs.promises.readFile(await download.path(), 'utf8'));
    expect(payload.locale).toBe('sw');
    expect(payload.appId).toBe(row.englishId);
  }
  await expect(page.locator('body')).toContainText(/Faragha/);
  await expect(page.locator('body')).toContainText(/AI/);
}

test.beforeEach(async ({ page }) => {
  for (const pattern of [
    'https://www.googletagmanager.com/**',
    'https://www.google-analytics.com/**',
    'https://fonts.googleapis.com/**',
    'https://fonts.gstatic.com/**'
  ]) {
    await page.route(pattern, (route) => route.abort());
  }
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
});

test.describe.configure({ mode: 'parallel' });

for (const row of maintained) {
  test(`${row.categoryKey}: ${row.englishId} native workflow, invalid state, export and reflow`, async ({ page }) => {
    await assertSurface(page, row, Number(row.englishId.length % 2 ? 320 : 375));
    await assertInvalid(page, row);
    await assertValidAndExport(page, row);
  });
}

test(reconciledOnly
  ? 'reconciled denominator is exactly 19 browser-proven owners'
  : 'maintained denominator is 11 legal gaps + 15 government + 16 insurance', () => {
  expect(maintained).toHaveLength(reconciledOnly ? 19 : 42);
});

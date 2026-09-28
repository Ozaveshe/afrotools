const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const snapshot = require('../../data/afroatlas/research-indicators.json');

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

test('country navigation, local flags and two-name search work from the slashless route', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/tools/afroatlas');
  await expect(page.locator('#aa-grid .aa-country-link')).toHaveCount(54);
  await expect.poll(() => page.locator('[data-aa-country="NG"] img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.locator('[data-aa-country="NG"] .aa-country-link').press('Enter');
  await expect(page).toHaveURL(/\/country\/nigeria\/$/);
  await expect(page.getByRole('heading', { name: 'Nigeria economy and natural resources' })).toBeVisible();
  await expect(page.locator('#history tbody tr')).toHaveCount(10);
  await noOverflow(page);
  await page.goto('/tools/afroatlas/');
  await page.getByLabel('Find a country, capital, or resource').fill('Nigeria vs Kenya');
  await expect(page.locator('#aa-grid .aa-country-link')).toHaveCount(2);
  await page.getByLabel('Find a country, capital, or resource').press('Enter');
  await expect(page.getByRole('heading', { name: 'Nigeria vs Kenya' })).toBeVisible();
  await expect(page.locator('.aa-cmp-metric')).toHaveCount(9);
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('filters use canonical regions, country aliases, and a recoverable empty state', async ({ page }) => {
  await page.goto('/tools/afroatlas/');
  await page.locator('[data-aa-region="Central Africa"]').click();
  await expect(page.locator('[data-aa-country="CM"]')).toBeVisible();
  await expect(page.locator('[data-aa-country="NG"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await page.getByLabel('Find a country, capital, or resource').fill('Ivory Coast');
  await expect(page.locator('#aa-grid .aa-country-link')).toHaveCount(1);
  await expect(page.locator('[data-aa-country="CI"]')).toBeVisible();
  await page.getByLabel('Find a country, capital, or resource').fill('no such country');
  await expect(page.getByText('No countries match these filters.')).toBeVisible();
  await page.locator('#aa-reset-empty').click();
  await expect(page.locator('#aa-grid .aa-country-link')).toHaveCount(54);
});

test('a bounded shortlist persists country codes and keeps keyboard focus after removal', async ({ page }) => {
  await page.goto('/tools/afroatlas/');
  for (const code of ['NG', 'KE', 'GH', 'ZA']) await page.locator('#aa-grid [data-aa-shortlist="' + code + '"]').click();
  await page.locator('#aa-grid [data-aa-shortlist="EG"]').click();
  await expect(page.locator('#aa-workbench-status')).toContainText('four countries');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('afroatlas_shortlist_v1')))).toEqual(['NG', 'KE', 'GH', 'ZA']);
  await page.reload();
  await expect(page.locator('#aa-shortlist li')).toHaveCount(4);
  await expect(page.locator('#aa-shortlist').getByRole('link', { name: 'Compare first two countries' })).toHaveAttribute('href', /a=NG&b=KE/);
  await page.locator('#aa-shortlist [data-aa-shortlist="NG"]').press('Enter');
  await expect(page.locator('#aa-shortlist li')).toHaveCount(3);
  await expect(page.locator('#aa-shortlist [data-aa-shortlist="KE"]')).toBeFocused();
  await page.getByRole('button', { name: 'Clear shortlist', exact: true }).click();
  await expect(page.locator('#aa-shortlist')).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('afroatlas_shortlist_v1'))).toBeNull();
});

test('brief exports contain sources while synthetic personal notes stay out of storage and analytics', async ({ page }) => {
  const note = 'SYNTHETIC_PRIVATE_NOTE atlas-fixture';
  const outgoing = [];
  page.on('request', request => outgoing.push(request.url() + ' ' + (request.postData() || '')));
  await page.goto('/tools/afroatlas/?country=KE#brief-builder');
  await expect(page.locator('#aa-brief-country')).toHaveValue('KE');
  await page.evaluate(() => {
    window.__atlasEvents = [];
    window.AfroTools.analytics.track = (name, details) => window.__atlasEvents.push({ name, details });
  });
  await page.getByLabel('Research purpose').selectOption('trade');
  await page.getByLabel('Your research notes (optional)').fill(note);
  await page.getByRole('button', { name: 'Generate brief', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download brief', exact: true }).click();
  const download = await downloadPromise;
  const text = fs.readFileSync(await download.path(), 'utf8');
  expect(text).toContain('Kenya research brief');
  expect(text).toContain('Purpose: Trade research');
  expect(text).toContain('My research notes (unverified):\n' + note);
  expect(text).toContain('https://data.worldbank.org/indicator/');
  const stored = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  const events = await page.evaluate(() => window.__atlasEvents);
  expect(stored).not.toContain(note);
  expect(JSON.stringify(events)).not.toContain(note);
  expect(outgoing.join('\n')).not.toContain(note);
  expect(events.map(event => event.name)).toEqual(['afroatlas_brief_generate', 'afroatlas_brief_export']);
  await page.reload();
  await expect(page.getByLabel('Your research notes (optional)')).toHaveValue('');
});

test('comparison CSV reproduces the displayed shared years and missing observations', async ({ page }) => {
  await page.goto('/tools/afroatlas/compare?a=NG&b=KE');
  await expect(page.locator('#aa-year-mode')).toHaveValue('common');
  await expect(page.locator('.aa-cmp-metric').filter({ hasText: 'Electricity access' })).toContainText('percentage points higher');
  await expect(page.locator('.aa-cmp-metric').filter({ hasText: 'Exports of goods and services' })).toContainText('No comparable pair');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download comparison CSV', exact: true }).click();
  const text = fs.readFileSync(await (await downloadPromise).path(), 'utf8');
  expect(text.split('\r\n')).toHaveLength(10);
  expect(text).toContain('"GDP","current US$","Nigeria","' + snapshot.countries.NG.gdp.value + '","2025"');
  expect(text).toContain('"Missing observation"');
  await page.getByLabel('Second country').selectOption('NG');
  await page.getByRole('button', { name: 'Update comparison', exact: true }).click();
  await expect(page.locator('#aa-compare-status')).toHaveText('Choose two different countries.');
  await expect(page.locator('.aa-cmp-metric')).toHaveCount(0);
});

test('rankings support an exact year, retain negative growth and explain old resource links', async ({ page }) => {
  await page.goto('/tools/afroatlas/rankings?metric=growth&year=2020');
  await expect(page.locator('#aa-ranking-year')).toHaveValue('2020');
  await expect(page.locator('#aa-ranking-table caption')).toContainText('2020');
  const values = await page.locator('#aa-ranking-table tbody tr td:nth-child(3)').allTextContents();
  expect(values.some(value => value.startsWith('-'))).toBe(true);
  await page.goto('/tools/afroatlas/rankings?resource=oil');
  await expect(page.getByText(/Production rankings for crude oil need verified observation dates/)).toBeVisible();
  await page.getByRole('link', { name: 'Explore countries with this resource reference', exact: true }).click();
  await expect(page.locator('#aa-resource')).toHaveValue('oil');
  expect(await page.locator('#aa-grid .aa-country-link').count()).toBeLessThan(54);
});

test('local flags fail gracefully and storage failure reports an honest per-visit shortlist', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Synthetic storage unavailable'); }; });
  await page.route('**/assets/img/flags/afroatlas/ng.svg', route => route.abort());
  await page.goto('/tools/afroatlas/?country=NG');
  await expect(page.locator('[data-aa-country="NG"] .aa-twemoji-flag')).toHaveAttribute('aria-label', 'Nigeria flag');
  await expect(page.locator('[data-aa-country="NG"] img')).toBeHidden();
  await page.locator('#aa-grid [data-aa-shortlist="NG"]').click();
  await expect(page.locator('#aa-workbench-status')).toContainText('storage is unavailable');
  await expect(page.locator('#aa-shortlist li')).toHaveCount(1);
});

test('mobile country, comparison and source pages remain readable in dark mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('aft_theme', 'dark'));
  await page.setViewportSize({ width: 360, height: 800 });
  for (const route of ['/tools/afroatlas/', '/tools/afroatlas/country/nigeria/', '/tools/afroatlas/compare?a=NG&b=KE', '/tools/afroatlas/sources/']) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('h1')).toBeVisible();
    await noOverflow(page);
    if (route.includes('/country/')) {
      const cards = await page.locator('.aa-country-hero .aa-core-snapshot > div').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top));
      expect(cards).toHaveLength(3);
      expect(Math.max(...cards) - Math.min(...cards)).toBeLessThan(1);
    }
  }
  if (process.env.AFROATLAS_SCREENSHOTS === '1') {
    const directory = path.join(__dirname, '../../artifacts/afroatlas-research');
    fs.mkdirSync(directory, { recursive: true });
    await page.goto('/tools/afroatlas/country/nigeria/');
    await expect(page.locator('.aa-hero-flag img')).toBeVisible();
    await page.screenshot({ path: path.join(directory, 'country-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/tools/afroatlas/#countries');
    await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.screenshot({ path: path.join(directory, 'country-explorer.png') });
  }
});

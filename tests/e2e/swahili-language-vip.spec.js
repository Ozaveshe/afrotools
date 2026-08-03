'use strict';

const fs = require('node:fs/promises');
const { test, expect } = require('@playwright/test');

const APPS = [
  ['swahili-translator', '/sw/zana/mtafsiri-wa-kiswahili/'],
  ['yoruba-translator', '/sw/zana/mtafsiri-wa-kiyoruba/'],
  ['hausa-translator', '/sw/zana/mtafsiri-wa-kihausa/'],
  ['igbo-translator', '/sw/zana/mtafsiri-wa-kiigbo/'],
  ['amharic-translator', '/sw/zana/mtafsiri-wa-kiamhari/'],
  ['zulu-translator', '/sw/zana/mtafsiri-wa-kizulu/'],
  ['arabic-calc', '/sw/zana/nambari-za-kiarabu/'],
  ['transliterate', '/sw/zana/transliteration-ya-maandishi/'],
  ['pidgin-translator', '/sw/zana/mtafsiri-wa-pidgin-ya-nigeria/'],
  ['french-african', '/sw/zana/mtafsiri-wa-kifaransa-afrika/'],
  ['african-name-meaning', '/sw/zana/maana-ya-majina-ya-afrika/']
];

const WORKBENCH_APPS = new Set([
  'swahili-translator',
  'yoruba-translator',
  'hausa-translator',
  'igbo-translator',
  'zulu-translator',
  'arabic-calc',
  'pidgin-translator',
  'french-african'
]);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function prepare(page, route, width) {
  const failures = { page: [], console: [], mutations: [] };
  page.on('pageerror', (error) => failures.page.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location();
    const expectedThirdPartyAbort = message.text() === 'Failed to load resource: net::ERR_FAILED'
      && location.url
      && !location.url.startsWith('http://127.0.0.1:');
    if (!expectedThirdPartyAbort) failures.console.push(message.text());
  });
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) {
      failures.mutations.push(`${request.method()} ${request.url()}`);
    }
  });
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', /^sw(?:-|$)/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    new RegExp(`${escapeRegex(route)}$`)
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    new RegExp(`${escapeRegex(route)}$`)
  );
  return failures;
}

async function expectReflow(page, route) {
  for (const scheme of ['dark', 'light']) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    const overflow = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ));
    expect(overflow, `${route} overflows at ${scheme}`).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const zoomOverflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ));
  expect(zoomOverflow, `${route} overflows at 200% reflow`).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
}

async function expectClean(failures, route) {
  expect(failures.page, `${route}: page errors`).toEqual([]);
  expect(failures.console, `${route}: console errors`).toEqual([]);
  expect(failures.mutations, `${route}: unexpected mutations`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:)/, (route) => route.abort());
});

for (const [id, route] of APPS) {
  test(`${id}: app workflow, metadata, reflow, themes and local exports`, async ({ page }) => {
    const failures = await prepare(page, route, id.length % 2 ? 320 : 375);

    const firstControl = page.locator('main input, main textarea, main select, main button, .tool-main input, .tool-main textarea, .tool-main select, .tool-main button').first();
    await expect(firstControl).toBeVisible();
    await firstControl.focus();
    await expect(firstControl).toBeFocused();

    if (['swahili-translator', 'yoruba-translator', 'hausa-translator', 'igbo-translator', 'amharic-translator', 'zulu-translator', 'french-african'].includes(id)) {
      const search = page.locator('#search');
      await search.fill(id === 'french-african' ? 'bonjour' : 'hello');
      await expect(page.locator('#phrases .phrase').first()).toBeVisible();
      await expect(page.locator('#countBadge')).not.toHaveText(/^0(?:\s|$)/);
    } else if (id === 'arabic-calc') {
      await page.locator('#numInput').fill('2025');
      await expect(page.locator('#resultCard')).toBeVisible();
      await expect(page.locator('#results')).toContainText(/[٠-٩]/);
    } else if (id === 'transliterate') {
      await page.locator('#script').selectOption('geez');
      await page.locator('#input').fill('selam');
      await expect(page.locator('#output')).not.toBeEmpty();
      await expect(page.locator('#output')).toContainText(/[\u1200-\u137f]/);
    } else if (id === 'pidgin-translator') {
      await page.getByRole('button', { name: /Kamusi ya misemo/i }).click();
      await page.locator('#search').fill('hello');
      await expect(page.locator('#phrases .phrase').first()).toBeVisible();
      await page.locator('.tab[onclick*="translate"]').click();
      await expect(page.locator('#translateBtn')).toBeDisabled();
      expect(failures.mutations).toEqual([]);
    } else if (id === 'african-name-meaning') {
      await page.locator('#searchInput').fill('Amani');
      await expect(page.locator('#nameGrid').getByText('Amani', { exact: true }).first()).toBeVisible();
      await page.getByRole('button', { name: /Mapendekezo ya majina/i }).click();
      await expect(page.locator('#suggestGrid .name-card').first()).toBeVisible();
    }

    if (WORKBENCH_APPS.has(id)) {
      const workbench = page.locator('[data-language-workbench]');
      await workbench.locator('textarea[name="text"]').fill('salamu ya safari');
      await workbench.locator('input[name="context"]').fill('safari');
      const downloadPromise = page.waitForEvent('download');
      await workbench.locator('[data-language-download]').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.txt$/i);
      const downloadPath = await download.path();
      expect(downloadPath).toBeTruthy();
      const content = await fs.readFile(downloadPath, 'utf8');
      expect(content).toContain('salamu ya safari');
      expect(content).toContain('Tahadhari:');
    }

    await expectReflow(page, route);
    await expectClean(failures, route);
  });
}

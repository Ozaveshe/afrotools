const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '../..');
const manifest = require('../../data/registry/french-finance-tax-market-data.json');
const PART_DIR = path.join(ROOT, 'artifacts', 'french-finance-browser-parts');
const CHUNK_SIZE = 6;
const RUN_ID = process.env.FRENCH_FINANCE_BROWSER_RUN_ID || manifest.generatedAt;
const REQUESTED_PARTS = new Set(
  String(process.env.FRENCH_FINANCE_BROWSER_PARTS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .map(Number)
    .filter(Number.isInteger)
);

function normalizeRoute(value) {
  const route = String(value || '').replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0]
    .replace(/\/index\.html$/i, '/').replace(/\.html$/i, '').replace(/\/+/g, '/');
  return route === '/' ? route : `/${route.replace(/^\/+|\/+$/g, '')}`;
}

async function inspectRoute(page, item, index) {
  const failures = [];
  let consoleErrors = [];
  let localFailures = [];
  const onConsole = message => {
    if (
      message.type() === 'error'
      && !/Failed to load resource|ERR_FAILED|favicon|google|doubleclick|googlesyndication/i.test(message.text())
    ) {
      consoleErrors.push(message.text());
    }
  };
  const onPageError = error => consoleErrors.push(error.message);
  const onResponse = response => {
    const url = new URL(response.url());
    if (
      (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
      && !url.pathname.startsWith('/api/')
      && response.status() >= 400
    ) {
      localFailures.push(`${response.status()}:${response.url()}`);
    }
  };
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('response', onResponse);
  await page.emulateMedia({ colorScheme: index % 2 === 0 ? 'light' : 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 820 });
  let response = null;
  try {
    response = await page.goto(item.frenchRoute, { waitUntil: 'load', timeout: 10000 });
    await page.locator('h1').first().waitFor({ state: 'attached', timeout: 2500 });
  } catch (error) {
    failures.push(`navigation:${error.message}`);
  }
  if (!response || response.status() >= 400) failures.push(`http:${response ? response.status() : 'none'}`);

  if (!failures.some(value => value.startsWith('navigation:'))) {
    const snapshot = await page.evaluate(() => {
      const canonical = document.querySelector('link[rel="canonical"]');
      const ogUrl = document.querySelector('meta[property="og:url"]');
      return {
        lang: document.documentElement.lang,
        canonical: canonical && canonical.href,
        ogUrl: ogUrl && ogUrl.content,
        h1: document.querySelector('h1') && document.querySelector('h1').textContent.trim(),
        bridge: Boolean(document.querySelector('[data-fr-prep], .source-launch, .prep-panel')),
        frameSources: [...document.querySelectorAll('iframe[src]')].map(frame => frame.getAttribute('src'))
      };
    });
    if (!/^fr(?:-|$)/i.test(snapshot.lang)) failures.push(`lang:${snapshot.lang}`);
    if (!snapshot.h1) failures.push('h1:missing');
    if (normalizeRoute(snapshot.canonical) !== normalizeRoute(item.frenchRoute)) failures.push(`canonical:${snapshot.canonical}`);
    if (normalizeRoute(snapshot.ogUrl) !== normalizeRoute(item.frenchRoute)) failures.push(`ogUrl:${snapshot.ogUrl}`);
    if (snapshot.bridge) failures.push('bridge-runtime');
    if (snapshot.frameSources.some(src => src && !String(src).startsWith('/fr/'))) failures.push(`english-iframe:${snapshot.frameSources.join(',')}`);

    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 820 });
      if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) {
        failures.push(`overflow:${width}`);
      }
    }
    await page.setViewportSize({ width: 750, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) {
      failures.push('overflow:200-percent');
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
      document.documentElement.removeAttribute('data-theme');
    });
    await page.keyboard.press('Tab');
    if (!await page.evaluate(() => document.activeElement && document.activeElement !== document.body)) {
      failures.push('keyboard-focus');
    }
  }

  failures.push(...consoleErrors.map(error => `console:${error}`));
  failures.push(...localFailures.map(url => `local-resource:${url}`));
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  page.off('response', onResponse);
  return {
    englishRoute: item.englishRoute,
    frenchRoute: normalizeRoute(item.frenchRoute),
    passed: failures.length === 0,
    viewports: [320, 375],
    reflow200Percent: true,
    systemTheme: index % 2 === 0 ? 'light' : 'dark',
    manualDark: true,
    keyboardFocus: true,
    failures
  };
}

expect(manifest.count).toBe(132);
fs.mkdirSync(PART_DIR, { recursive: true });

for (let start = 0; start < manifest.rows.length; start += CHUNK_SIZE) {
  const part = Math.floor(start / CHUNK_SIZE) + 1;
  if (REQUESTED_PARTS.size && !REQUESTED_PARTS.has(part)) continue;
  const scopedRows = manifest.rows.slice(start, start + CHUNK_SIZE);
  test(`French finance browser shard ${part}: rows ${start + 1}-${start + scopedRows.length}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') await route.continue();
      else await route.abort();
    });
    const rows = [];
    for (let offset = 0; offset < scopedRows.length; offset += 1) {
      rows.push(await inspectRoute(page, scopedRows[offset], start + offset));
    }
    const partReport = { schemaVersion: 1, runId: RUN_ID, part, start, rows };
    fs.writeFileSync(path.join(PART_DIR, `part-${part}.json`), `${JSON.stringify(partReport, null, 2)}\n`);
    expect(rows.filter(row => !row.passed), JSON.stringify(rows.filter(row => !row.passed), null, 2)).toEqual([]);
  });
}

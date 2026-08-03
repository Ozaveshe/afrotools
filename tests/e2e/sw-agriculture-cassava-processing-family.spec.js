const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  pdfParse = async (buffer) => {
    const pdfjs = await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
    const document = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableWorker: true }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(' '));
    }
    return { text: pages.join('\n') };
  };
}

let playwrightTest;
try {
  playwrightTest = require('@playwright/test');
} catch {
  playwrightTest = require('playwright/test');
}
const { test, expect } = playwrightTest;

const manifest = require('../../data/localization/sw-agriculture-parity-manifest.json');
const oracles = require('../../reports/sw-agriculture-cassava-processing-oracles.json');

const ROWS = manifest.rows.filter((row) => row.family === 'cassava-processing');
const ORACLE_BY_ID = new Map(oracles.rows.map((row) => [row.englishId, row]));
const SENTINEL = [
  'worktree=sw-agriculture-next-family-8354-20260802',
  'root=C:\\Users\\Oza\\.codex\\worktrees\\sw-agriculture-next-family-8354-20260802\\afrotools',
  'branch=codex/sw-agriculture-next-family-8354-20260802',
  'base=8354e321ff34caf60a33a3393cd0dcddfb00c023',
].join('\n');

function watchFailures(page) {
  const state = { consoleErrors: [], pageErrors: [], resourceFailures: [], responses: [], writes: [], external: [] };
  page.on('console', (message) => { if (message.type() === 'error') state.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => state.pageErrors.push(error.message));
  page.on('requestfailed', (request) => state.resourceFailures.push(`${request.url()} ${request.failure() && request.failure().errorText}`));
  page.on('response', (response) => { if (response.status() >= 400) state.responses.push(`${response.status()} ${response.url()}`); });
  page.on('request', (request) => {
    if (request.method() !== 'GET') state.writes.push(`${request.method()} ${request.url()}`);
    if (/^https?:/i.test(request.url()) && !/^https?:\/\/(?:127\.0\.0\.1|localhost):4173\//i.test(request.url())) {
      state.external.push(request.url());
    }
  });
  return state;
}

async function downloadBuffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function rgb(value) {
  const match = String(value).match(/[\d.]+/g);
  return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
}
function luminance(color) {
  const channels = rgb(color).map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
async function computedContrast(page) {
  const values = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const input = document.getElementById('rawTonnes');
    const style = getComputedStyle(input);
    input.focus();
    const focused = getComputedStyle(input);
    return {
      bodyText: body.color,
      bodyBackground: body.backgroundColor,
      inputText: style.color,
      inputBackground: style.backgroundColor,
      inputBorder: style.borderTopColor,
      focusOutline: focused.outlineColor,
    };
  });
  expect(contrast(values.bodyText, values.bodyBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.inputText, values.inputBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.inputBorder, values.inputBackground)).toBeGreaterThanOrEqual(3);
  expect(contrast(values.focusOutline, values.inputBackground)).toBeGreaterThanOrEqual(3);
}

async function computedHubContrast(page) {
  const values = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const card = document.querySelector('.card');
    const cardStyle = getComputedStyle(card);
    const link = document.querySelector('.country-list a');
    link.focus();
    const linkStyle = getComputedStyle(link);
    return {
      bodyText: body.color,
      bodyBackground: body.backgroundColor,
      cardBorder: cardStyle.borderTopColor,
      cardBackground: cardStyle.backgroundColor,
      linkText: linkStyle.color,
      linkBackground: linkStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? cardStyle.backgroundColor : linkStyle.backgroundColor,
      focusOutline: linkStyle.outlineColor,
    };
  });
  expect(contrast(values.bodyText, values.bodyBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.linkText, values.linkBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.cardBorder, values.cardBackground)).toBeGreaterThanOrEqual(3);
  expect(contrast(values.focusOutline, values.linkBackground)).toBeGreaterThanOrEqual(3);
}

async function assertRouteShell(page, row, failures) {
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${row.swahili.routeKey}`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${row.english.route}`);
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', `https://afrotools.com${row.french.route}`);
  await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', `https://afrotools.com${row.swahili.routeKey}`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://afrotools.com${row.swahili.routeKey}`);
  const schema = await page.locator('script[type="application/ld+json"]').first().evaluate((node) => JSON.parse(node.textContent));
  expect(schema.inLanguage).toBe('sw');
  const image = page.locator('.hero-art');
  await expect(image).toBeVisible();
  expect(await image.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const sentinel = await page.evaluate(async () => (await fetch('/tests/fixtures/sw-cassava-processing-worktree-sentinel.txt')).text());
  expect(sentinel.trim()).toBe(SENTINEL);
  await page.locator('.skip-link').focus();
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#contenu')).toBeFocused();
  await expect(page.locator('a[href^="/"]:not([href^="/sw/"])')).toHaveCount(0);
  expect(failures).toEqual({ consoleErrors: [], pageErrors: [], resourceFailures: [], responses: [], writes: [], external: [] });
}

async function fillValid(page, oracle) {
  const input = oracle.validOracle.input;
  await page.locator('#pathway').selectOption(input.pathwayId);
  await page.locator('#rawTonnes').fill(String(input.rawTonnes));
  await page.locator('#batches').fill(String(input.batchesPerMonth));
  await page.locator('#level').selectOption(input.processingLevel);
  await page.locator('#rawPrice').fill(String(input.rawPricePerTonne));
  await page.locator('#sellingPrice').fill(String(input.sellingPricePerKg));
  await page.locator('#laborRate').fill(String(input.laborPerDay));
  await page.locator('#transport').selectOption(input.includeTransport ? 'yes' : 'no');
  if (input.includeTransport) await page.locator('#distance').fill(String(input.distanceKm));
}

for (const row of ROWS) {
  test(`${row.english.id} full route local proof`, async ({ page, context }) => {
    const failures = watchFailures(page);
    await page.addInitScript(() => {
      localStorage.removeItem('afrotools-theme');
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (payload) => { window.__cassavaSharePayload = payload; },
      });
    });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(row.swahili.routeKey);

    if (!row.country) {
      await expect(page.locator('.country-list a')).toHaveCount(15);
      await expect(page.getByText(/marejeo ya bei ya 2024–2025/)).toBeVisible();
      await expect(page.getByText(/FAO, ripoti za IITA/)).toBeVisible();
      await expect(page.getByText('Kiwango cha uhakika', { exact: true })).toBeVisible();
      await expect(page.getByText(new RegExp(row.english.id))).toBeVisible();
      expect(await page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor)).toBe('rgb(13, 22, 36)');
      await computedHubContrast(page);
      await page.emulateMedia({ colorScheme: 'light' });
      await expect.poll(() => page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor))
        .toBe('rgb(245, 248, 252)');
      await computedHubContrast(page);
      await page.getByRole('button', { name: 'Mandhari meusi' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await page.getByRole('button', { name: 'Mandhari mepesi' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await page.setViewportSize({ width: 320, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.evaluate(() => { document.body.style.zoom = '2'; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await assertRouteShell(page, row, failures);
      return;
    }

    const oracle = ORACLE_BY_ID.get(row.english.id);
    expect(oracle).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(row.country.swahiliName);
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute('content', row.country.code);
    await expect(page.getByText(/Hakuna ingizo linalotumwa kwa seva/)).toBeVisible();
    await expect(page.getByText(/si data ya moja kwa moja/)).toBeVisible();
    await expect(page.getByText(new RegExp(row.english.id))).toBeVisible();
    const controls = page.locator('input:not([type="hidden"]), select');
    for (let index = 0; index < await controls.count(); index += 1) {
      const id = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    await fillValid(page, oracle);
    const calculate = page.getByRole('button', { name: 'Kokotoa faida' });
    await calculate.focus();
    await expect(calculate).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    await expect(page.locator('#resultPanel')).toBeFocused();
    const runtime = await page.evaluate(() => ({
      result: window.__SW_AGRI_TEST__.latest.result,
      report: window.__SW_AGRI_TEST__.reportObject(),
      config: window.__SW_AGRI_PAGE__,
    }));
    expect(runtime.config.aiRouteId).toBe(row.english.id);
    expect(runtime.report.nchi.code).toBe(row.country.code);
    expect({
      outputKg: runtime.result.outputKg,
      revenue: runtime.result.revenue,
      totalCost: runtime.result.costs.total,
      profitPerBatch: runtime.result.profitPerBatch,
      monthlyProfit: runtime.result.monthlyProfit,
      annualProfit: runtime.result.annualProfit,
    }).toEqual(oracle.validOracle.expected);

    const exportCases = [
      {
        name: 'Pakua JSON', extension: '.json', verify: (buffer) => {
          const parsed = JSON.parse(buffer.toString('utf8'));
          expect(parsed.nchi.code).toBe(row.country.code);
          expect(parsed.matokeo.faidaKwaKundi).toBe(oracle.validOracle.expected.profitPerBatch);
        },
      },
      {
        name: 'Pakua TXT', extension: '.txt', verify: (buffer) => {
          const text = buffer.toString('utf8');
          expect(text).toContain('Faida ya usindikaji wa mihogo');
          expect(text).toContain('FAO, ripoti za IITA');
        },
      },
      {
        name: 'Pakua CSV', extension: '.csv', verify: (buffer) => {
          const text = buffer.toString('utf8');
          expect(text).toContain('faida_kundi');
          expect(text).toContain(`,${row.country.code},`);
        },
      },
      {
        name: 'Pakua PDF', extension: '.pdf', verify: async (buffer) => {
          expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
          const parsed = await pdfParse(buffer);
          expect(parsed.text).toContain('Faida ya usindikaji wa mihogo');
          expect(parsed.text).toContain('Chanzo: FAO');
        },
      },
    ];
    for (const item of exportCases) {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name: item.name }).click();
      const download = await pending;
      expect(download.suggestedFilename().toLowerCase()).toContain(row.country.code.toLowerCase());
      expect(download.suggestedFilename().toLowerCase().endsWith(item.extension)).toBe(true);
      await item.verify(await downloadBuffer(download));
    }
    await page.getByRole('button', { name: 'Hifadhi kwenye kivinjari' }).click();
    const saved = await page.evaluate((code) => localStorage.getItem(`afrotools:sw-agriculture:cassava-processing:${code}`), row.country.code);
    expect(JSON.parse(saved).nchi.code).toBe(row.country.code);
    await page.getByRole('button', { name: 'Shiriki' }).click();
    const share = await page.evaluate(() => window.__cassavaSharePayload);
    expect(share.url).toBe(`http://127.0.0.1:4173${row.swahili.routeKey}`);
    expect(share.text).toContain('Faida ya usindikaji wa mihogo');

    const invalidCases = [
      { selector: '#rawTonnes', value: '0', message: 'tani 0.1' },
      { selector: '#batches', value: '0', message: 'kati ya 1 na 100' },
      { selector: '#rawPrice', value: '0', message: 'bei ya mihogo mibichi' },
      { selector: '#sellingPrice', value: '0', message: 'bei ya mauzo' },
      { selector: '#laborRate', value: '0', message: 'gharama ya kazi' },
      { selector: '#distance', value: '5001', message: 'km 0 na 5,000', transport: true },
    ];
    for (const boundary of invalidCases) {
      await fillValid(page, oracle);
      if (boundary.transport) {
        await page.locator('#transport').selectOption('yes');
        await page.locator('#distance').fill('1');
      }
      await calculate.click();
      await expect(page.locator('#resultPanel')).toBeVisible();
      await page.locator(boundary.selector).fill(boundary.value);
      await expect(page.locator('#resultPanel')).toBeHidden();
      await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
      expect(await page.evaluate(() => window.__SW_AGRI_TEST__.latest)).toBeNull();
      await calculate.click();
      await expect(page.getByRole('alert')).toContainText(boundary.message);
      await expect(page.locator(boundary.selector)).toBeFocused();
      await expect(page.locator('#resultPanel')).toBeHidden();
    }

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    await expect.poll(() => page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor))
      .toBe('rgb(13, 22, 36)');
    await computedContrast(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor))
      .toBe('rgb(245, 248, 252)');
    await computedContrast(page);
    await page.getByRole('button', { name: 'Mandhari meusi' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Mandhari mepesi' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.setViewportSize({ width: 320, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    })).toEqual([]);
    await assertRouteShell(page, row, failures);
  });
}

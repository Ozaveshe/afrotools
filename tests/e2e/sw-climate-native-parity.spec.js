const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const manifest = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../data/localization/sw-climate-parity-manifest.json'),
  'utf8'
));
const expectedProof = {
  commit: process.env.AFROTOOLS_SW_CLIMATE_EXPECTED_COMMIT || '',
  tree: process.env.AFROTOOLS_SW_CLIMATE_EXPECTED_TREE || '',
  root: process.env.AFROTOOLS_SW_CLIMATE_EXPECTED_ROOT || '',
  identity: process.env.AFROTOOLS_SW_CLIMATE_PROOF_IDENTITY || ''
};

function assertServerIdentity(response) {
  expect(expectedProof.commit, 'expected proof commit must be configured').not.toBe('');
  expect(expectedProof.tree, 'expected proof tree must be configured').not.toBe('');
  expect(expectedProof.root, 'expected proof root must be configured').not.toBe('');
  expect(expectedProof.identity, 'expected proof identity must be configured').not.toBe('');
  expect(response.headers()['x-afrotools-proof-commit']).toBe(expectedProof.commit);
  expect(response.headers()['x-afrotools-proof-tree']).toBe(expectedProof.tree);
  expect(response.headers()['x-afrotools-proof-root'].toLowerCase()).toBe(expectedProof.root.toLowerCase());
  expect(response.headers()['x-afrotools-proof-identity']).toBe(expectedProof.identity);
}

async function keepRequestsLocal(page, requests) {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({ url: request.url(), method: request.method(), postData: request.postData() || '' });
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    return route.abort();
  });
}

async function collectInputs(page) {
  return page.locator('[data-cl-field]').evaluateAll((fields) => Object.fromEntries(fields.map((field) => [
    field.getAttribute('data-cl-field'),
    field.type === 'number' ? Number(field.value) : field.value
  ])));
}

async function openSwahili(page, row, width) {
  const errors = [];
  const requests = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !/net::ERR_FAILED/.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await keepRequestsLocal(page, requests);
  await page.setViewportSize({ width, height: 900 });
  const response = await page.goto(row.swahili, { waitUntil: 'domcontentloaded' });
  assertServerIdentity(response);
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('main[data-sw-climate-tool]')).toHaveAttribute('data-sw-climate-tool', row.toolId);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${row.swahili}`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${row.english}`);
  await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', `https://afrotools.com${row.swahili}`);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://afrotools.com${row.artwork}`);
  return { errors, requests };
}

async function submit(page) {
  await page.locator('#swClimateForm button[type="submit"]').click();
  await expect(page.locator('[data-results]')).toBeVisible();
  await expect(page.locator('[data-result-value]')).not.toHaveText('');
  await expect(page.locator('[data-metrics] .sw-climate-metric')).toHaveCount(4);
}

test.describe('Swahili Climate native parity candidates', () => {
  for (const width of [320, 375]) {
    test(`hub: ${width}px discovery, metadata and reflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(manifest.hub.swahili, { waitUntil: 'domcontentloaded' });
      assertServerIdentity(response);
      await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/hali-ya-hewa-na-mazingira/');
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/climate/');
      await expect(page.locator('.sw-climate-hub-link')).toHaveCount(13);
      expect(await page.locator('.sw-climate-hub-link').evaluateAll((links) => new Set(links.map((link) => link.getAttribute('href'))).size)).toBe(13);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
    });
  }

  for (const row of manifest.routes) {
    test(`${row.toolId}: shared engine parity and JSON reopen`, async ({ page }) => {
      const requests = [];
      await keepRequestsLocal(page, requests);
      const englishResponse = await page.goto(row.english, { waitUntil: 'domcontentloaded' });
      assertServerIdentity(englishResponse);
      const fixture = await collectInputs(page);
      const englishOutput = await page.evaluate(({ toolId, fixture }) => (
        window.AfroClimateTools.calculate(toolId, fixture)
      ), { toolId: row.toolId, fixture });

      const swahiliResponse = await page.goto(row.swahili, { waitUntil: 'domcontentloaded' });
      assertServerIdentity(swahiliResponse);
      for (const [field, value] of Object.entries(fixture)) {
        const control = page.locator(`[data-cl-field="${field}"]`);
        if (await control.evaluate((node) => node.tagName === 'SELECT')) await control.selectOption(String(value));
        else await control.fill(String(value));
      }
      await submit(page);
      const swahiliOutput = await page.evaluate(({ toolId, fixture }) => (
        window.AfroClimateTools.calculate(toolId, fixture)
      ), { toolId: row.toolId, fixture });
      expect(swahiliOutput).toEqual(englishOutput);

      const [jsonDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('[data-json]').click()
      ]);
      const jsonPath = await jsonDownload.path();
      const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      expect(payload).toMatchObject({ schemaVersion: 1, locale: 'sw', tool: row.toolId, inputs: fixture });

      await page.locator('[data-cl-field]').first().evaluate((field) => {
        if (field.tagName === 'SELECT') field.selectedIndex = field.options.length - 1;
        else field.value = String(Number(field.value) + 1);
        field.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await expect(page.locator('[data-results]')).toBeHidden();
      await page.locator('[data-import-file]').setInputFiles({
        name: `${row.toolId}.json`,
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(payload))
      });
      await expect(page.locator('[data-status]')).toContainText('imefunguliwa');
      await expect(page.locator('[data-results]')).toBeVisible();

      expect(requests.every((request) => request.postData === '')).toBe(true);
    });

    for (const width of [320, 375]) {
      test(`${row.toolId}: ${width}px workflow, privacy, validation and themes`, async ({ page }) => {
        const { errors, requests } = await openSwahili(page, row, width);
        const controls = page.locator('#swClimateForm [data-cl-field]');
        expect(await controls.count()).toBeGreaterThan(0);
        expect(await controls.evaluateAll((items) => items.filter((item) => !item.labels || !item.labels.length).length)).toBe(0);
        await controls.first().focus();
        expect(await controls.first().evaluate((node) => document.activeElement === node)).toBe(true);

        await submit(page);
        await page.locator('[data-save]').click();
        await expect(page.locator('[data-status]')).toContainText('kifaa hiki');
        expect(await page.evaluate((toolId) => localStorage.getItem(`afrotools-sw-climate-${toolId}`), row.toolId)).toContain(`"tool":"${row.toolId}"`);

        const numeric = page.locator('input[type="number"]').first();
        const min = Number(await numeric.getAttribute('min'));
        await numeric.fill(String(Number.isFinite(min) ? min - 1 : -999999));
        await expect(page.locator('[data-results]')).toBeHidden();
        await page.locator('#swClimateForm button[type="submit"]').click();
        await expect(page.locator('[data-status]')).toContainText('Kagua');
        await expect(numeric).toHaveAttribute('aria-invalid', 'true');

        await page.evaluate(() => {
          document.documentElement.dataset.theme = 'dark';
          document.querySelectorAll('body *').forEach((node) => {
            if (node.shadowRoot) node.style.display = 'none';
          });
          document.documentElement.style.fontSize = '200%';
        });
        const offenders = await page.evaluate(() => [...document.querySelectorAll('body *')].map((node) => {
          const rect = node.getBoundingClientRect();
          return { tag: node.tagName, id: node.id, className: String(node.className || ''), left: rect.left, right: rect.right };
        }).filter((item) => item.right > window.innerWidth + 2 || item.left < -2).slice(0, 8));
        expect(offenders).toEqual([]);
        const background = await page.locator('.sw-climate-card').first().evaluate((node) => getComputedStyle(node).backgroundColor);
        expect(background).not.toBe('rgb(255, 255, 255)');
        expect(errors, errors.join('\n')).toEqual([]);
        expect(requests.every((request) => request.postData === '')).toBe(true);
      });
    }

    test(`${row.toolId}: system dark mode is independent`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await openSwahili(page, row, 375);
      await page.locator('html').evaluate((node) => node.removeAttribute('data-theme'));
      const background = await page.locator('.sw-climate-card').first().evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(background).not.toBe('rgb(255, 255, 255)');
    });
  }

  test('PDF export is parseable and carries the planning boundary', async ({ page }) => {
    const row = manifest.routes[0];
    await openSwahili(page, row, 320);
    await submit(page);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-pdf]').click()
    ]);
    const parsed = await pdfParse(fs.readFileSync(await download.path()));
    expect(parsed.text).toContain('AFROTOOLS');
    expect(parsed.text).toContain('Makadirio ya kupanga pekee');
  });
});

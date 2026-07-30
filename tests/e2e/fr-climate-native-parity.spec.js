const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const manifest = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../data/localization/fr-climate-parity-manifest.json'),
  'utf8'
));

async function lockNetworkToLocal(page, requests) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    requests.push(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return route.continue();
    }
    return route.abort();
  });
}

async function assertRoot(page) {
  const sentinel = await page.evaluate(async () => {
    const response = await fetch('/tests/fixtures/fr-climate-root-sentinel.txt');
    return response.text();
  });
  expect(sentinel.trim()).toBe('fr-wave4-climate:8ce5cac175e42201968b1f7540752d6acf92d4ca');
}

async function openFrench(page, row, width) {
  const errors = [];
  const requests = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !/net::ERR_FAILED/.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await lockNetworkToLocal(page, requests);
  await page.setViewportSize({ width, height: 900 });
  await page.goto(row.french, { waitUntil: 'domcontentloaded' });
  await assertRoot(page);
  await expect(page.locator('main[data-fr-climate-tool]')).toHaveAttribute('data-fr-climate-tool', row.toolId);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${row.french}`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${row.english}`);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://afrotools.com${row.artwork}`);
  return { errors, requests };
}

async function submitFrench(page) {
  await page.locator('#frClimateForm button[type="submit"]').click();
  await expect(page.locator('[data-results]')).toBeVisible();
  await expect(page.locator('[data-result-value]')).not.toHaveText('');
  await expect(page.locator('[data-metrics] .fr-climate-metric')).toHaveCount(4);
  return page.locator('[data-result-value], [data-metrics]').allTextContents();
}

async function inputsFrom(page) {
  return page.locator('[data-cl-field]').evaluateAll((fields) => Object.fromEntries(fields.map((field) => [
    field.getAttribute('data-cl-field'),
    field.type === 'number' ? Number(field.value) : field.value
  ])));
}

test.describe('French Climate native owner parity', () => {
  for (const width of [320, 375]) {
    test(`native Climate hub: ${width}px discovery and SEO`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/fr/climat-environnement/', { waitUntil: 'domcontentloaded' });
      await assertRoot(page);
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/climat-environnement/');
      await expect(page.locator('.fr-climate-hub-link')).toHaveCount(13);
      expect(await page.locator('.fr-climate-hub-link').evaluateAll((links) => (
        new Set(links.map((link) => link.getAttribute('href'))).size
      ))).toBe(13);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
    });
  }

  for (const row of manifest.routes) {
    test(`${row.toolId}: English fixture and French owner produce the same result`, async ({ page }) => {
      const localRequests = [];
      await lockNetworkToLocal(page, localRequests);
      await page.goto(row.english, { waitUntil: 'domcontentloaded' });
      await assertRoot(page);
      const fixture = await inputsFrom(page);
      const englishOwner = await page.evaluate(({ toolId, fixture }) => (
        window.AfroClimateTools.calculate(toolId, fixture)
      ), { toolId: row.toolId, fixture });

      await page.goto(row.french, { waitUntil: 'domcontentloaded' });
      for (const [field, value] of Object.entries(fixture)) {
        const control = page.locator(`[data-cl-field="${field}"]`);
        if (await control.evaluate((node) => node.tagName === 'SELECT')) await control.selectOption(String(value));
        else await control.fill(String(value));
      }
      await submitFrench(page);
      const frenchOwner = await page.evaluate(({ toolId, fixture }) => (
        window.AfroClimateTools.calculate(toolId, fixture)
      ), { toolId: row.toolId, fixture });
      expect(frenchOwner).toEqual(englishOwner);
      await expect(page.locator('[data-result-value]')).not.toHaveText('');
      const renderedMetricValues = await page.locator('[data-metrics] strong').allTextContents();
      expect(renderedMetricValues).toEqual(englishOwner.metrics.map((metric) => (
        String(metric.value) + (metric.unit ? ` ${metric.unit}` : '')
      )));
    });

    for (const width of [320, 375]) {
      test(`${row.toolId}: ${width}px workflow, privacy, export and reflow`, async ({ page }) => {
        const { errors, requests } = await openFrench(page, row, width);
        const controls = page.locator('#frClimateForm [data-cl-field]');
        expect(await controls.count()).toBeGreaterThan(0);
        expect(await controls.evaluateAll((items) => items.filter((item) => !item.labels || !item.labels.length).length)).toBe(0);

        await controls.first().focus();
        expect(await controls.first().evaluate((node) => document.activeElement === node)).toBe(true);

        await submitFrench(page);
        const before = (await page.locator('[data-result-value], [data-metrics]').allTextContents()).join('|');
        const numeric = page.locator('input[type="number"]').first();
        const min = Number(await numeric.getAttribute('min'));
        const max = Number(await numeric.getAttribute('max'));
        const initial = Number(await numeric.inputValue());
        const candidate = Number.isFinite(max) && initial !== max ? max : min;
        await numeric.fill(String(candidate));
        await submitFrench(page);
        const after = (await page.locator('[data-result-value], [data-metrics]').allTextContents()).join('|');
        expect(after).not.toBe(before);

        await page.locator('[data-save]').click();
        await expect(page.locator('[data-status]')).toContainText('enregistré');
        const saved = await page.evaluate((toolId) => localStorage.getItem(`afrotools-fr-climate-${toolId}`), row.toolId);
        expect(saved).toContain(`"tool":"${row.toolId}"`);

        await page.locator('[data-copy]').click();
        await expect(page.locator('[data-status]')).toContainText('copié');

        if (width === 320) {
          const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.locator('[data-pdf]').click()
          ]);
          const pdfPath = await download.path();
          const parsed = await pdfParse(fs.readFileSync(pdfPath));
          expect(parsed.text).toContain('AFROTOOLS - RAPPORT CLIMAT');
          expect(parsed.text).toContain('Estimation de planification');
        }

        await numeric.fill(String(Number.isFinite(min) ? min - 1 : -999999));
        await page.locator('#frClimateForm button[type="submit"]').click();
        await expect(page.locator('[data-status]')).toContainText('Vérifiez');

        await page.evaluate(() => {
          document.documentElement.dataset.theme = 'dark';
          document.querySelectorAll('body *').forEach((node) => {
            if (node.shadowRoot) node.style.display = 'none';
          });
          document.documentElement.style.fontSize = '200%';
        });
        const reflow = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          body: { width: document.body.getBoundingClientRect().width, scrollWidth: document.body.scrollWidth },
          root: { width: document.documentElement.getBoundingClientRect().width, scrollWidth: document.documentElement.scrollWidth },
          offenders: [...document.querySelectorAll('body *')].map((node) => {
            const rect = node.getBoundingClientRect();
            return { tag: node.tagName, id: node.id, className: String(node.className || ''), left: rect.left, right: rect.right };
          }).filter((item) => item.right > window.innerWidth + 2 || item.left < -2).slice(0, 8),
          shadows: [...document.querySelectorAll('body *')].filter((node) => node.shadowRoot).flatMap((host) => (
            [...host.shadowRoot.querySelectorAll('*')].map((node) => {
              const rect = node.getBoundingClientRect();
              return { tag: node.tagName, id: node.id, className: String(node.className || ''), left: rect.left, right: rect.right };
            }).filter((item) => item.right > window.innerWidth + 2 || item.left < -2)
          )).slice(0, 8)
        }));
        expect(reflow.offenders, JSON.stringify(reflow)).toEqual([]);
        const darkBackground = await page.locator('.fr-climate-card').first().evaluate((node) => getComputedStyle(node).backgroundColor);
        expect(darkBackground).not.toBe('rgb(255, 255, 255)');

        const requestLog = requests.join('\n');
        expect(requestLog).not.toContain(String(candidate));
        expect(errors, errors.join('\n')).toEqual([]);
      });
    }

    test(`${row.toolId}: system dark mode is independent`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await openFrench(page, row, 375);
      await page.locator('html').evaluate((node) => node.removeAttribute('data-theme'));
      const background = await page.locator('.fr-climate-card').first().evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(background).not.toBe('rgb(255, 255, 255)');
    });
  }
});

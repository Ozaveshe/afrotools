const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const CASES = [
  '/fr/agriculture/farm-profit/nigeria',
  '/fr/tools/profit-agricole/',
  '/fr/tools/calendrier-semis/',
];

function writeReceipt(payload) {
  const configured = process.env.FR_AGRI_CONTRAST_PROOF_OUTPUT;
  if (!configured) return;
  const output = path.resolve(__dirname, '../..', configured);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
}

async function inspectDirectTextContrast(page) {
  return page.evaluate(() => {
    function channels(value) {
      const match = value.match(/[\d.]+/g);
      return match ? match.map(Number) : [0, 0, 0, 0];
    }
    function backgroundFor(element) {
      for (let current = element; current; current = current.parentElement) {
        const background = channels(getComputedStyle(current).backgroundColor);
        if ((background[3] ?? 1) > 0) return background;
      }
      return [255, 255, 255, 1];
    }
    function luminance(color) {
      return color.slice(0, 3)
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    }
    function ratio(foreground, background) {
      const first = luminance(foreground);
      const second = luminance(background);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    }

    const inspected = [];
    const failures = [];
    for (const element of document.body.querySelectorAll('*')) {
      const directText = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
        .map((node) => node.textContent.trim())
        .join(' ');
      if (!directText) continue;
      const style = getComputedStyle(element);
      const rectangle = element.getBoundingClientRect();
      if (
        style.display === 'none'
        || style.visibility === 'hidden'
        || Number(style.opacity) === 0
        || rectangle.width === 0
        || rectangle.height === 0
      ) continue;
      const foreground = channels(style.color);
      const background = backgroundFor(element);
      const contrast = ratio(foreground, background);
      const fontSize = Number.parseFloat(style.fontSize);
      const isBold = Number.parseInt(style.fontWeight, 10) >= 700;
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && isBold);
      const minimum = isLarge ? 3 : 4.5;
      const row = {
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        text: directText.slice(0, 160),
        foreground: style.color,
        background: `rgb(${background.slice(0, 3).join(', ')})`,
        ratio: Number(contrast.toFixed(3)),
        minimum,
      };
      inspected.push(row);
      if (contrast + 0.01 < minimum) failures.push(row);
    }
    return { inspected, failures };
  });
}

test('French Agriculture contrast regressions pass at both mobile widths and themes', async ({ browser }) => {
  const configuredOrigin = new URL(
    process.env.FR_AGRI_PROOF_ORIGIN
      || process.env.PLAYWRIGHT_BASE_URL
      || 'http://127.0.0.1:4173',
  ).origin;
  const rows = [];

  for (const route of CASES) {
    for (const theme of ['light', 'dark']) {
      for (const width of [320, 375]) {
        const context = await browser.newContext({
          colorScheme: theme,
          viewport: { width, height: 900 },
        });
        const page = await context.newPage();
        const offOriginRequests = [];
        const pageErrors = [];
        const consoleErrors = [];
        await page.route('**/*', async (requestRoute) => {
          const request = requestRoute.request();
          const url = new URL(request.url());
          if (url.origin === configuredOrigin) {
            await requestRoute.continue();
            return;
          }
          offOriginRequests.push({
            method: request.method(),
            url: request.url(),
            query: url.search,
            hash: url.hash,
            body: request.postData() || '',
            headers: await request.allHeaders(),
          });
          await requestRoute.abort('blockedbyclient');
        });
        page.on('pageerror', (error) => pageErrors.push(String(error)));
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });

        const response = await page.goto(route, { waitUntil: 'networkidle' });
        expect(response.status(), `${route} document status`).toBe(200);
        await page.evaluate((selectedTheme) => {
          document.documentElement.dataset.theme = selectedTheme;
          document.documentElement.style.colorScheme = selectedTheme;
        }, theme);
        const contrast = await inspectDirectTextContrast(page);
        const row = {
          route,
          theme,
          width,
          inspectedDirectTextNodes: contrast.inspected.length,
          failures: contrast.failures,
          offOriginRequests,
          pageErrors,
          consoleErrors,
        };
        rows.push(row);
        expect(offOriginRequests, `${route} ${theme} ${width} off-origin`).toEqual([]);
        expect(pageErrors, `${route} ${theme} ${width} page errors`).toEqual([]);
        expect(consoleErrors, `${route} ${theme} ${width} console errors`).toEqual([]);
        expect(contrast.failures, `${route} ${theme} ${width} contrast`).toEqual([]);
        await context.close();
      }
    }
  }

  writeReceipt({
    schemaVersion: 1,
    programme: 'fr-agriculture-contrast-repair',
    checkedAt: new Date().toISOString(),
    origin: configuredOrigin,
    summary: {
      routes: CASES.length,
      scenarios: rows.length,
      widths: [320, 375],
      themes: ['light', 'dark'],
      inspectedDirectTextNodes: rows.reduce(
        (sum, row) => sum + row.inspectedDirectTextNodes,
        0,
      ),
      contrastFailures: rows.reduce((sum, row) => sum + row.failures.length, 0),
      offOriginRequests: rows.reduce(
        (sum, row) => sum + row.offOriginRequests.length,
        0,
      ),
      pageErrors: rows.reduce((sum, row) => sum + row.pageErrors.length, 0),
      consoleErrors: rows.reduce((sum, row) => sum + row.consoleErrors.length, 0),
    },
    rows,
  });
});

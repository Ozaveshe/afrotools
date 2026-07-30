const { test, expect } = require('@playwright/test');
const fs = require('fs');
const manifest = require('../../data/government/fr-parity-apps.json');
const officialSources = require('../../data/government/official-sources.json');

const viewports = [
  { width: 320, height: 760 },
  { width: 375, height: 812 },
  { width: 720, height: 900 },
];
const sharedShellHosts = new Set([
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'www.google.com',
  'pagead2.googlesyndication.com',
  'cdn.jsdelivr.net',
]);

async function prepareMode(page, app) {
  if (app.mode === 'foi') {
    await page.locator('[name="authority"]').fill('Autorité publique exemple');
    await page.locator('[name="subject"]').fill('Contrats de maintenance 2025');
    await page.locator('[name="records"]').fill('Liste et copies des contrats publiables.');
  }
  if (app.mode === 'budget') {
    await page.locator('[name="budgetLine"]').fill('Santé primaire');
  }
  if (app.mode === 'permit') {
    await page.locator('[name="country"]').selectOption('NG');
    await expect(page.locator('[name="currency"]')).toHaveValue('NGN');
  }
}

for (const [index, app] of manifest.apps.entries()) {
  test(`${String(index + 1).padStart(2, '0')} ${app.id}: French local workflow, export and reopen`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const externalRequests = [];
    await page.addInitScript(() => {
      localStorage.setItem('afrotools_cookie_consent', 'declined');
    });
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (sharedShellHosts.has(url.hostname)) {
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      await route.continue();
    });
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
    });

    await page.setViewportSize(viewports[index % viewports.length]);
    await page.emulateMedia({ colorScheme: index % 2 ? 'dark' : 'light', reducedMotion: 'reduce' });
    await page.goto(app.route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    const theme = index % 2 ? 'dark' : 'light';
    await page.locator('html').evaluate((node, value) => { node.dataset.theme = value; }, theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('#fg-form button[type="submit"]')).toBeEnabled();
    await prepareMode(page, app);
    await page.locator('#fg-form button[type="submit"]').click();
    await expect(page.locator('#fg-result')).toBeVisible();
    await expect(page.locator('#fg-status')).toContainText('Résultat local préparé');
    await expect(page.locator('#fg-source-meta')).not.toContainText('en cours de chargement');
    await expect(page.locator('#fg-source-card')).not.toHaveAttribute('data-source-state', 'available');
    await expect(page.locator('#fg-source-meta')).toContainText(/cadence|révision manuelle/i);

    const labels = await page.locator('#fg-form input:not([type="checkbox"]), #fg-form select, #fg-form textarea').evaluateAll((nodes) =>
      nodes.every((node) => Boolean(node.labels && node.labels.length)),
    );
    expect(labels).toBe(true);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    const resultOutput = await page.locator('#fg-result-body').textContent();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#fg-export-json').click();
    const download = await downloadPromise;
    const receiptPath = await download.path();
    expect(receiptPath).toBeTruthy();
    const exportedReceipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    const sourceTool = officialSources.tools.find((tool) => tool.id === app.id);
    expect(exportedReceipt.source.available).toBe(false);
    expect(exportedReceipt.source.cadenceDays).toBe(sourceTool.priority === 'high' ? 7 : 30);

    if (app.mode === 'permit') {
      expect(exportedReceipt.inputs.country).toBe('NG');
      expect(exportedReceipt.inputs.currency).toBe('NGN');
      expect(exportedReceipt.source.sourceId).toBe('ng-immigration');
      await page.goto(app.route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#fg-form button[type="submit"]')).toBeEnabled();
      await page.locator('html').evaluate((node, value) => { node.dataset.theme = value; }, theme);
      await page.locator('#fg-import').setInputFiles(receiptPath);
      await expect(page.locator('[name="country"]')).toHaveValue('NG');
      await expect(page.locator('#fg-form select[name="source"]')).toHaveValue('ng-immigration');
      await expect(page.locator('[name="currency"]')).toHaveValue('NGN');
      expect(await page.locator('#fg-result-body').textContent()).toBe(resultOutput);
    } else {
      await page.locator('#fg-import').setInputFiles(receiptPath);
    }
    await expect(page.locator('#fg-status')).toContainText('rouvert et recalculé');

    if (index === 2 || index === 11) {
      await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    }
    const overflowDetails = await page.evaluate(() =>
      Array.from(document.querySelectorAll('body *')).map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          tag: node.tagName.toLowerCase(),
          id: node.id,
          className: typeof node.className === 'string' ? node.className : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      }).filter((item) => item.left < -1 || item.right > window.innerWidth + 1).slice(0, 10),
    );
    expect(overflowDetails).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    const workflowExternalRequests = externalRequests.filter((url) => !sharedShellHosts.has(new URL(url).hostname));
    expect(workflowExternalRequests).toEqual([]);
    const serializedRequests = externalRequests.join('\n');
    expect(serializedRequests).not.toContain('Autorité publique exemple');
    expect(serializedRequests).not.toContain('Contrats de maintenance 2025');
    expect(serializedRequests).not.toContain('Santé primaire');
  });
}

test('Government hub metadata is reciprocal and primary text remains AA in manual and system dark modes', async ({ browser }) => {
  const modes = [
    { name: 'manual-dark', colorScheme: 'light', manualTheme: 'dark' },
    { name: 'system-dark', colorScheme: 'dark', manualTheme: null },
  ];

  for (const width of [320, 375]) {
    for (const mode of modes) {
      const context = await browser.newContext({
        viewport: { width, height: 812 },
        colorScheme: mode.colorScheme,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        localStorage.removeItem('afrotools_theme');
      });
      await page.goto(manifest.hubRoute, { waitUntil: 'domcontentloaded' });
      if (mode.manualTheme) {
        await page.locator('html').evaluate((node, theme) => {
          node.dataset.theme = theme;
        }, mode.manualTheme);
      } else {
        await page.locator('html').evaluate((node) => {
          node.removeAttribute('data-theme');
        });
      }

      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/government/');
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', 'https://afrotools.com/government/');

      for (const route of [manifest.hubRoute, manifest.apps[0].route]) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        if (mode.manualTheme) {
          await page.locator('html').evaluate((node, theme) => {
            node.dataset.theme = theme;
          }, mode.manualTheme);
        } else {
          await page.locator('html').evaluate((node) => {
            node.removeAttribute('data-theme');
          });
        }
        const failures = await page.locator(
          '.fg-breadcrumb a, .fg-source-card a, .fg-related a, .fg-kicker, .fg-button.secondary, .fg-metric',
        ).evaluateAll((nodes) => {
          function rgb(value) {
            const match = String(value).match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
            return match ? match.slice(1, 4).map(Number) : null;
          }
          function luminance(color) {
            const channels = color.map((channel) => {
              const value = channel / 255;
              return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
          }
          function background(node) {
            let current = node;
            while (current) {
              const value = getComputedStyle(current).backgroundColor;
              if (value && value !== 'transparent' && !/,\s*0\)$/.test(value)) return value;
              current = current.parentElement;
            }
            return getComputedStyle(document.documentElement).backgroundColor;
          }
          return nodes.filter((node) => {
            const style = getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            const foreground = rgb(style.color);
            const backdrop = rgb(background(node));
            if (!foreground || !backdrop) return true;
            const high = Math.max(luminance(foreground), luminance(backdrop));
            const low = Math.min(luminance(foreground), luminance(backdrop));
            return (high + 0.05) / (low + 0.05) < 4.5;
          }).map((node) => ({
            selector: node.className,
            color: getComputedStyle(node).color,
            background: background(node),
          }));
        });
        expect(failures, `${mode.name} ${width}px ${route}`).toEqual([]);
      }
      await context.close();
    }
  }
});

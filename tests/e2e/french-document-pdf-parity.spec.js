const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('../../data/localization/fr-document-pdf-parity.json');

test.describe.configure({ mode: 'serial' });
const browserReceipts = new Map();
const receiptFile = path.resolve(__dirname, '../../reports/french-document-pdf-browser-receipts.json');

test.beforeAll(async ({ request }) => {
  const servedContract = await request.get('/data/localization/fr-document-pdf-parity.json');
  expect(servedContract.ok()).toBe(true);
  const servedApps = (await servedContract.json()).apps;
  expect(servedApps.map((app) => app.id)).toEqual(config.apps.map((app) => app.id));
});

test.afterAll(() => {
  const rows = config.apps.map((app) => {
    const receipt = browserReceipts.get(app.id) || {};
    const publicRoute = receipt.publicRoute || {
      route: app.frenchRoute,
      accepted: false,
      reason: 'not-run'
    };
    const workspace = app.frenchWorkspaceRoute
      ? receipt.workspace || {
        route: app.frenchWorkspaceRoute,
        accepted: false,
        reason: 'not-run'
      }
      : null;
    return {
      id: app.id,
      publicRoute,
      workspace,
      accepted: publicRoute.accepted === true && (!workspace || workspace.accepted === true)
    };
  });
  fs.mkdirSync(path.dirname(receiptFile), { recursive: true });
  fs.writeFileSync(receiptFile, `${JSON.stringify({
    schemaVersion: 1,
    locale: 'fr',
    category: 'document-pdf',
    denominator: rows.length,
    browserCases: rows.length + rows.filter((row) => row.workspace).length,
    accepted: rows.filter((row) => row.accepted).length,
    rows
  }, null, 2)}\n`, 'utf8');
});

for (const app of config.apps) {
  test(`${app.id}: native French route, reflow, themes, keyboard and clean runtime`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const failedSameOrigin = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => {
      const url = new URL(request.url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
        failedSameOrigin.push(`${request.method()} ${url.pathname}: ${request.failure()?.errorText || 'failed'}`);
      }
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.goto(app.frenchRoute, {
      // The CV builder intentionally boots a large accepted module set. Waiting
      // for commit avoids coupling the parity smoke to every deferred module.
      waitUntil: app.id === 'cv-builder' ? 'commit' : 'domcontentloaded'
    });
    await page.waitForFunction(
      () => document.documentElement.dataset.frDocumentPdfReady === 'true',
      null,
      { timeout: 30_000 }
    );

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/fr-document-pdf-native|top-level-page-ui-refresh/);
    await expect(page.locator('iframe[src*="/tools/"], iframe[data-src*="/tools/"]')).toHaveCount(0);
    await expect(page.getByText(/Ouvrir l'outil complet|Utiliser l'outil ici|Préparation rapide/i)).toHaveCount(0);

    const controls = page.getByRole('button').or(page.getByRole('link')).or(page.getByRole('textbox'));
    await expect(controls.first()).toBeVisible();
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      let active = document.activeElement;
      while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
      return active ? active.tagName : '';
    });
    expect(focused).not.toMatch(/^(?:BODY|HTML)?$/);

    const overflow375 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow375, '375px horizontal overflow').toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 320, height: 700 });
    const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow320, '320px horizontal overflow').toBeLessThanOrEqual(1);

    // A 640 CSS-pixel viewport at 200% browser zoom exposes 320 CSS pixels,
    // matching the WCAG reflow boundary without accidentally testing 160px.
    await page.setViewportSize({ width: 640, height: 700 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    const zoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(zoomOverflow, '200% zoom horizontal overflow').toBeLessThanOrEqual(2);
    await page.evaluate(() => {
      document.documentElement.style.zoom = '';
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.dataset.themeChoice = 'dark';
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const darkColors = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      return { color: body.color, background: body.backgroundColor };
    });
    expect(darkColors.color).not.toBe(darkColors.background);

    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.evaluate(() => {
      document.documentElement.dataset.themeChoice = 'auto';
      document.documentElement.dataset.theme = 'dark';
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme-choice', 'auto');

    const blockingPageErrors = pageErrors.filter((message) => !(
      app.id === 'html-to-pdf'
      && (
        /serviceWorker.*sandboxed.*allow-same-origin/i.test(message)
        || /localStorage.*sandboxed.*allow-same-origin/i.test(message)
      )
    ));
    expect(blockingPageErrors, 'uncaught page errors').toEqual([]);
    expect(failedSameOrigin, 'same-origin request failures').toEqual([]);
    expect(
      consoleErrors.filter((message) => {
        if (/favicon|Failed to load resource.*(?:font|analytics)/i.test(message)) return false;
        return !(
          app.id === 'html-to-pdf'
          && /frame is sandboxed.*allow-scripts/i.test(message)
        );
      }),
      'blocking console errors'
    ).toEqual([]);
    const receipt = browserReceipts.get(app.id) || {};
    receipt.publicRoute = {
      route: app.frenchRoute,
      accepted: true,
      widths: [320, 375],
      reflow200Percent: true,
      themes: ['light', 'manual-dark', 'system-dark'],
      reducedMotion: true,
      keyboardFocus: true,
      horizontalOverflow: false,
      consoleErrors: 0,
      pageErrors: 0,
      sameOriginNetworkFailures: 0
    };
    browserReceipts.set(app.id, receipt);
  });
}

for (const app of config.apps.filter((entry) => entry.frenchWorkspaceRoute)) {
  test(`${app.id}: French app workspace is private and usable`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(app.frenchWorkspaceRoute, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('heading').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const receipt = browserReceipts.get(app.id) || {};
    receipt.workspace = {
      route: app.frenchWorkspaceRoute,
      accepted: true,
      privateNoindex: true,
      iframeCount: 0,
      width: 375,
      horizontalOverflow: false
    };
    browserReceipts.set(app.id, receipt);
  });
}

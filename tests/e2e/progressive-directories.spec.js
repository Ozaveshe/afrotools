const { test, expect } = require('@playwright/test');

test.use({ trace: 'off' });

const ROOT_SURFACES = [
  { route: '/widgets/', dependency: /\/widgets\/WIDGET-REGISTRY\.js/ },
  { route: '/widgets/demo/', dependency: /\/widgets\/WIDGET-REGISTRY\.js/ },
  { route: '/categories/', dependency: /\/assets\/js\/components\/tool-registry\.min\.js/ },
  { route: '/developer-tools/', dependency: /\/assets\/js\/components\/tool-registry\.min\.js/ },
  { route: '/tools/', dependency: /\/assets\/js\/components\/tool-registry\.min\.js/ },
  { route: '/all-tools/', dependency: /\/assets\/js\/components\/tool-registry\.min\.js/ }
];

async function quietExternalNoise(page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ contentType: 'text/css', body: '' });
    if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'www.googletagmanager.com') return route.abort();
    return route.continue();
  });
}

function emptyRegistryScript(widgetSurface) {
  if (widgetSurface) return 'var AFRO_WIDGET_REGISTRY=[];';
  return [
    'var AFRO_TOOLS=[];',
    'var AFRO_CATEGORIES={};',
    'window.isPublicTool=function(){return true};',
    'window.getPublicToolStats=function(){return {totalTools:0,liveTools:0,inDevelopmentTools:0,categories:0,display:{liveToolsPlus:"0"}}};',
    'window.onRegistryReady=function(fn){setTimeout(fn,0)};',
    'setTimeout(function(){document.dispatchEvent(new CustomEvent("afrotools:registry-ready"));},0);'
  ].join('');
}

test('initial HTML and no-JavaScript navigation stay useful on every root surface', async ({ browser, request }) => {
  for (const surface of ROOT_SURFACES) {
    const response = await request.get(surface.route);
    expect(response.ok(), surface.route).toBeTruthy();
    const html = await response.text();
    expect(html, surface.route).not.toMatch(/>\s*--\s*</);
    expect(html, surface.route).toContain('data-directory-status');

    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(surface.route, { waitUntil: 'domcontentloaded' });
    expect(await page.locator('main a[href], #tools-container a[href], #toolsGrid a[href], #tool-sections a[href], #cg a[href], #widget-grid a[href]').count(), surface.route).toBeGreaterThan(0);
    await context.close();
  }
});

test('normal hydration is idempotent with cache disabled', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await quietExternalNoise(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

  for (const surface of ROOT_SURFACES) {
    await page.goto(surface.route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-progressive-directory]')).toHaveAttribute('data-directory-state', 'ready');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, surface.route).toBeLessThanOrEqual(1);
    const firstRoutes = await page.locator('[data-directory-record][href]').evaluateAll((links) => links.slice(0, 8).map((link) => link.getAttribute('href')));
    if (surface.route !== '/widgets/') expect(new Set(firstRoutes).size, surface.route).toBe(firstRoutes.length);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-progressive-directory]')).toHaveAttribute('data-directory-state', 'ready');
    const reloadedRoutes = await page.locator('[data-directory-record][href]').evaluateAll((links) => links.slice(0, 8).map((link) => link.getAttribute('href')));
    expect(reloadedRoutes, surface.route).toEqual(firstRoutes);
  }
  expect(pageErrors).toEqual([]);
  await context.close();
});

test('blocked and malformed registry loads preserve links and show retryable failure', async ({ browser }) => {
  for (const fixture of ['blocked', 'malformed']) {
    for (const surface of ROOT_SURFACES) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await quietExternalNoise(page);
      await page.route('**/*', async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        if (!surface.dependency.test(pathname)) return route.continue();
        if (fixture === 'blocked') return route.abort('blockedbyclient');
        return route.fulfill({ contentType: 'application/javascript', body: 'var = malformed registry;' });
      });
      await page.goto(surface.route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-progressive-directory]')).toHaveAttribute('data-directory-state', 'failed-load');
      await expect(page.getByRole('button', { name: /retry|try again|réessayer/i })).toBeVisible();
      expect(await page.locator('[data-directory-record][href]').count(), `${fixture} ${surface.route}`).toBeGreaterThan(0);
      await context.close();
    }
  }
});

test('slow and empty-valid registries use distinct loading and no-published states', async ({ browser }) => {
  test.setTimeout(120000);
  for (const surface of ROOT_SURFACES) {
    const slowContext = await browser.newContext();
    const slowPage = await slowContext.newPage();
    await quietExternalNoise(slowPage);
    await slowPage.route('**/*', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (!surface.dependency.test(pathname)) return route.continue();
      await new Promise((resolve) => setTimeout(resolve, 600));
      return route.continue();
    });
    await slowPage.goto(surface.route, { waitUntil: 'commit' });
    await expect(slowPage.locator('[data-progressive-directory]')).toHaveAttribute('data-directory-state', 'loading');
    await slowPage.waitForLoadState('domcontentloaded');
    await expect(slowPage.locator('[data-progressive-directory]')).toHaveAttribute('data-directory-state', 'ready');
    await slowContext.close();

    const emptyContext = await browser.newContext();
    const emptyPage = await emptyContext.newPage();
    await quietExternalNoise(emptyPage);
    await emptyPage.route('**/*', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (!surface.dependency.test(pathname)) return route.continue();
      return route.fulfill({ contentType: 'application/javascript', body: emptyRegistryScript(surface.route.startsWith('/widgets')) });
    });
    await emptyPage.goto(surface.route, { waitUntil: 'domcontentloaded' });
    await expect(emptyPage.locator('[data-progressive-directory]')).toHaveAttribute('data-directory-state', 'no-published-records');
    expect(await emptyPage.locator('[data-directory-record][href]').count(), surface.route).toBeGreaterThan(0);
    await emptyContext.close();
  }
});

test('offline and unsupported-browser states are explicit', async ({ browser }) => {
  const offline = await browser.newContext();
  await offline.addInitScript(() => {
    window.__AFROTOOLS_FORCE_OFFLINE__ = true;
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => false });
  });
  const offlinePage = await offline.newPage();
  await offlinePage.route('**/assets/js/components/tool-registry.min.js*', (route) => route.abort('internetdisconnected'));
  await offlinePage.goto('/all-tools/', { waitUntil: 'domcontentloaded' });
  await expect(offlinePage.locator('[data-progressive-directory]')).toHaveAttribute('data-directory-state', 'offline');
  await offline.close();

  const unsupported = await browser.newContext();
  await unsupported.addInitScript(() => { window.CustomEvent = undefined; });
  const unsupportedPage = await unsupported.newPage();
  await unsupportedPage.goto('/all-tools/', { waitUntil: 'domcontentloaded' });
  await expect(unsupportedPage.locator('[data-progressive-directory]')).toHaveAttribute('data-directory-state', 'unsupported-browser');
  expect(await unsupportedPage.locator('[data-directory-record][href]').count()).toBeGreaterThan(0);
  await unsupported.close();
});

test('filter query state is noindex, keyboard usable, and mobile safe', async ({ page }) => {
  await quietExternalNoise(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/all-tools/?q=definitely-no-such-tool', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/all-tools/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  await expect(page.locator('[data-progressive-directory]')).toHaveAttribute('data-directory-state', 'no-results');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBeTruthy();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('all-tools pagination progressively reveals records without reordering the first page', async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto('/all-tools/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-progressive-directory]')).toHaveAttribute('data-directory-state', 'ready');
  const firstPage = await page.locator('#toolsGrid [data-directory-record]').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(firstPage.length).toBe(60);
  await page.getByRole('button', { name: 'Load more tools' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#toolsGrid [data-directory-record]')).toHaveCount(120);
  const firstPageAfter = await page.locator('#toolsGrid [data-directory-record]').evaluateAll((links) => links.slice(0, 60).map((link) => link.getAttribute('href')));
  expect(firstPageAfter).toEqual(firstPage);
});

test('localized equivalents retain useful navigation without JavaScript', async ({ browser }) => {
  test.setTimeout(90000);
  const routes = ['/fr/all-tools/', '/fr/categories/', '/fr/developer-tools/', '/sw/zana-zote/', '/sw/zana-za-developer/', '/ha/kayan-aiki/', '/yo/awon-ise/'];
  for (const route of routes) {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(await page.locator('main a[href], body a[href]').count(), route).toBeGreaterThan(5);
    expect(await page.locator('text=--').count(), route).toBe(0);
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const route of routes) {
    const errors = [];
    const onError = (error) => errors.push(error.message);
    page.on('pageerror', onError);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);
    page.off('pageerror', onError);
    expect(errors, route).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
  await context.close();
});

const { test, expect } = require('@playwright/test');
const { apps } = require('../../scripts/build-sw-agriculture-assigned-apps');
const guarded = apps.filter(app => !['coffee-calculator', 'cooperative-calculator', 'warehouse-receipt'].includes(app.id));
const token = '122345.789';
const fertilizer = guarded.find(app => app.id === 'fertilizer-calc');
test.setTimeout(120000);

function observe(page) {
  const errors = [], leaked = [], navigations = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (request.url().includes(token) || (request.postData() || '').includes(token)) leaked.push(request.method());
    if (request.isNavigationRequest() && request.url().includes('scenario=')) navigations.push(request.url());
  });
  return { errors, leaked, navigations };
}
async function assertUnserialized(page) {
  expect(await page.locator('[data-agri-form]').evaluate(form => [...new FormData(form).entries()])).toEqual([]);
  expect(new URL(page.url()).searchParams.has('scenario')).toBe(false);
}

test('All 17 original JSON workflows fail closed when the whole controller is unavailable', async ({ page }) => {
  const observed = observe(page);
  await page.route('**/assets/js/pages/sw-agriculture-assigned-parity.js*', route => route.abort());
  for (const app of guarded) {
    await page.goto('/sw/zana/' + app.slug + '/');
    await expect(page.locator('[data-agri-form] button[type=submit]')).toBeDisabled();
    await expect(page.locator('[data-status]')).toContainText('hakijapakia');
    await page.locator('#scenario').fill('{"privateSyntheticAmount":' + token + '}');
    await assertUnserialized(page);
    await page.locator('[data-agri-form]').evaluate(form => form.requestSubmit());
    await expect(page.locator('[data-result]')).toBeHidden();
    await assertUnserialized(page);
  }
  expect(observed).toEqual({ errors: [], leaked: [], navigations: [] });
});

test('Missing guard itself retains static disable and forced submission carries no scenario', async ({ page }) => {
  const observed = observe(page);
  await page.route('**/assets/js/lib/sw-agriculture-submit-guard.js*', route => route.abort());
  await page.goto('/sw/zana/' + fertilizer.slug + '/');
  await expect(page.locator('[data-agri-form] button[type=submit]')).toBeDisabled();
  await page.locator('#scenario').fill('{"privateSyntheticAmount":' + token);
  await assertUnserialized(page);
  await page.locator('[data-agri-form]').evaluate(form => form.requestSubmit());
  // The original controller still prevents default; invalid input stays local.
  await expect(page.locator('[data-result]')).toBeHidden();
  expect(observed).toEqual({ errors: [], leaked: [], navigations: [] });
});

test('Known missing engine is explained in Swahili and healthy reload retains calculation and export', async ({ page }) => {
  const observed = observe(page), pattern = '**/engines/fertilizer-calc-engine.js*';
  await page.route(pattern, route => route.abort());
  await page.goto('/sw/zana/' + fertilizer.slug + '/');
  await expect(page.locator('[data-agri-form] button[type=submit]')).toBeDisabled();
  await expect(page.locator('[data-status]')).toContainText('hakijapakia');
  await expect(page.locator('[data-status]')).not.toContainText('Cannot read');
  await page.locator('[data-agri-form]').evaluate(form => form.requestSubmit());
  await expect(page.locator('[data-result]')).toBeHidden();
  await page.unroute(pattern);
  await page.reload();
  await expect(page.locator('[data-agri-form] button[type=submit]')).toBeEnabled();
  await page.locator('[data-agri-form] button[type=submit]').click();
  await expect(page.locator('[data-result]')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.locator('[data-export=json]').click();
  expect((await download).suggestedFilename()).toContain('fertilizer-calc');
  await page.locator('[data-agri-form] button[type=reset]').click();
  await expect(page.locator('[data-result]')).toBeHidden();
  // An unexpected available-engine failure keeps the original diagnostic.
  await page.evaluate(() => { window.AfroTools.FertilizerCalcEngine.calculate = () => { throw Error('synthetic unexpected engine error'); }; });
  await page.locator('[data-agri-form] button[type=submit]').click();
  await expect(page.locator('[data-status]')).toContainText('synthetic unexpected engine error');
  expect(observed).toEqual({ errors: [], leaked: [], navigations: [] });
});

test('JavaScript unavailable leaves controls disabled and forced native GET has no financial input', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage(), observed = observe(page);
    for (const app of [guarded[0], fertilizer, guarded.find(row => row.id === 'farm-budget')]) {
      await page.goto(baseURL + '/sw/zana/' + app.slug + '/');
      await expect(page.locator('[data-agri-form] button[type=submit]')).toBeDisabled();
      await expect(page.locator('[data-local-script-note]')).toContainText('JavaScript');
      await page.locator('#scenario').fill('{"privateSyntheticAmount":' + token + '}');
      await assertUnserialized(page);
      const beforeClick = page.url();
      await page.locator('[data-agri-form] button[type=submit]').click({ force: true });
      expect(page.url()).toBe(beforeClick);
      let intercepted;
      const interception = new Promise(resolve => { intercepted = resolve; });
      await page.route('**/*', async route => {
        if (!route.request().isNavigationRequest()) return route.continue();
        const attempted = route.request();
        await route.abort();
        intercepted(attempted);
      });
      const request = page.waitForEvent('request', { predicate: r => r.isNavigationRequest() });
      await page.locator('[data-agri-form]').evaluate(form => form.requestSubmit()).catch(() => {});
      const attempted = await request;
      const forced = await interception;
      expect(attempted.method()).toBe('GET');
      expect(new URL(attempted.url()).searchParams.has('scenario')).toBe(false);
      expect(attempted.url()).not.toContain(token);
      expect(attempted.postData()).toBe(null);
      expect(forced.url()).toBe(attempted.url());
      await page.unroute('**/*');
    }
    expect(observed).toEqual({ errors: [], leaked: [], navigations: [] });
  } finally { await context.close(); }
});

test('A strict CSP blocking inline configuration keeps the external guard closed', async ({ page }) => {
  const observed = observe(page), route = '/sw/zana/' + fertilizer.slug + '/';
  await page.route('**' + route, async request => {
    const response = await request.fetch();
    await request.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'" } });
  });
  await page.goto(route);
  await expect(page.locator('[data-agri-form] button[type=submit]')).toBeDisabled();
  await expect(page.locator('[data-status]')).toContainText('hakijapakia');
  await page.locator('#scenario').fill('{"privateSyntheticAmount":' + token + '}');
  await assertUnserialized(page);
  await page.locator('[data-agri-form]').evaluate(form => form.requestSubmit());
  await expect(page.locator('[data-result]')).toBeHidden();
  expect(observed).toEqual({ errors: [], leaked: [], navigations: [] });
});

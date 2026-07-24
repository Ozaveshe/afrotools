const { test, expect } = require('@playwright/test');

for (const route of ['/tools/ng-land-use/', '/fr/tools/ng-taxe-fonciere/']) {
  test(route + ' calculates and invokes local PDF', async ({ page }) => {
    const errors = [];
    const requests = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(() => {
      window.__pdfCalls = [];
      window.addEventListener('DOMContentLoaded', () => {
        window.AfroTools = window.AfroTools || {};
        window.AfroTools.pdf = { generate: async options => window.__pdfCalls.push(options) };
      });
    });
    await page.goto(route);
    await page.locator('#luc-rate').fill('0.5');
    await page.locator('#luc-form button[type=submit]').click();
    await expect(page.locator('#luc-results')).toBeVisible();
    await expect(page.locator('#luc-payable')).toContainText(/250(?:,|\u202f)000/);
    await expect(page.locator('#luc-rate-result')).toContainText(/0[.,]5/);
    await page.locator('#luc-pdf').click();
    await expect.poll(() => page.evaluate(() => window.__pdfCalls.length)).toBe(1);
    expect(await page.evaluate(() =>
      [...document.querySelectorAll('input,select')].every(element => element.labels && element.labels.length)
    )).toBeTruthy();
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    )).toBeTruthy();
    expect(errors).toEqual([]);
    expect(requests.filter(request =>
      request.method !== 'GET' ||
      /\.netlify\/functions|\/api\/|supabase|\/collect\b|beacon/i.test(request.url)
    )).toEqual([]);
    if (route === '/tools/ng-land-use/') {
      await page.screenshot({
        path: 'artifacts/finance-row-104-ng-land-use/375-light-result.png',
        fullPage: true
      });
    }
  });
}

test('uses section 7 components, fails closed and covers dark responsive layouts', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/ng-land-use/');
  await page.locator('#luc-mode-components').check();
  await page.locator('#luc-land-rate').fill('100000');
  await page.locator('#luc-building-rate').fill('200000');
  await page.locator('#luc-depreciation').fill('80');
  await page.locator('#luc-relief').fill('90');
  await page.locator('#luc-rate').fill('0.5');
  await page.locator('#luc-form button[type=submit]').click();
  await expect(page.locator('#luc-assessed-result')).toContainText('97,200,000');
  await expect(page.locator('#luc-payable')).toContainText('486,000');
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBeTruthy();

  await page.locator('#luc-rate').fill('3.6');
  await page.locator('#luc-form button[type=submit]').click();
  await expect(page.locator('#luc-error')).toContainText('3.5');
  await expect(page.locator('#luc-results')).toBeHidden();

  await page.setViewportSize({ width: 768, height: 900 });
  await page.locator('#luc-rate').fill('0.5');
  await page.evaluate(() => window.AfroTools.darkMode.set('dark'));
  await page.reload();
  await page.locator('#luc-rate').fill('0.5');
  await page.locator('#luc-form button[type=submit]').click();
  await expect(page.locator('#luc-results')).toBeVisible();
  await page.screenshot({
    path: 'artifacts/finance-row-104-ng-land-use/768-dark.png',
    fullPage: true
  });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBeTruthy();
});

test('creates a real local PDF document', async ({ page }) => {
  await page.goto('/tools/ng-land-use/');
  await page.locator('#luc-rate').fill('0.5');
  await page.locator('#luc-form button[type=submit]').click();
  const pending = page.waitForEvent('download');
  await page.locator('#luc-pdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  const stream = await download.createReadStream();
  let header = '';
  for await (const chunk of stream) {
    header += chunk.subarray(0, 4).toString('ascii');
    break;
  }
  expect(header).toBe('%PDF');
});

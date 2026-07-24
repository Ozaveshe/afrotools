const { test, expect } = require('@playwright/test');

for (const route of ['/tools/gh-ssnit/', '/fr/tools/gh-ssnit/']) {
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
    await page.locator('#ss-form button[type=submit]').click();
    await expect(page.locator('#ss-results')).toBeVisible();
    await expect(page.locator('#ss-total')).toContainText('925');
    await expect(page.locator('#ss-pension-result')).toContainText('2');
    await page.locator('#ss-pdf').click();
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
    if (route === '/tools/gh-ssnit/') {
      await page.screenshot({
        path: 'artifacts/finance-row-103-gh-ssnit/375-light-result.png',
        fullPage: true
      });
    }
  });
}

test('caps earnings, withholds unsafe benefit outputs and covers responsive dark layouts', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/gh-ssnit/');
  await page.locator('#ss-salary').fill('100000');
  await page.locator('#ss-count').fill('2');
  await page.locator('#ss-age').selectOption('55');
  await page.locator('#ss-form button[type=submit]').click();
  await expect(page.locator('#ss-insurable')).toContainText('69,000');
  await expect(page.locator('#ss-total')).toContainText('25,530');
  await expect(page.locator('#ss-pension-result')).toContainText('Not estimated');
  await expect(page.locator('#ss-benefit-note')).toContainText('reduction factor');
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBeTruthy();

  await page.locator('#ss-date').fill('2025-12-31');
  await page.locator('#ss-form button[type=submit]').click();
  await expect(page.locator('#ss-error')).toContainText('1 January');
  await expect(page.locator('#ss-results')).toBeHidden();

  await page.setViewportSize({ width: 768, height: 900 });
  await page.locator('#ss-date').fill('2026-07-23');
  await page.evaluate(() => window.AfroTools.darkMode.set('dark'));
  await page.reload();
  await page.locator('#ss-form button[type=submit]').click();
  await expect(page.locator('#ss-results')).toBeVisible();
  await page.screenshot({
    path: 'artifacts/finance-row-103-gh-ssnit/768-dark.png',
    fullPage: true
  });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBeTruthy();
});

test('creates a real local PDF document', async ({ page }) => {
  await page.goto('/tools/gh-ssnit/');
  await page.locator('#ss-form button[type=submit]').click();
  const pending = page.waitForEvent('download');
  await page.locator('#ss-pdf').click();
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

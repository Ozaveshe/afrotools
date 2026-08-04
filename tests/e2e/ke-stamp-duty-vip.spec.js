const { test, expect } = require('@playwright/test');

for (const route of ['/tools/ke-stamp-duty/', '/fr/tools/ke-droits-timbre/']) {
  test(route + ' calculates a transfer with local exports', async ({ page }) => {
    const errors = [];
    const requests = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push({
      url: request.url(),
      method: request.method(),
      postData: request.postData() || ''
    }));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(() => {
      window.__pdfCalls = [];
      window.addEventListener('DOMContentLoaded', () => {
        window.AfroTools = window.AfroTools || {};
        window.AfroTools.pdf = { generate: async options => window.__pdfCalls.push(options) };
      });
    });
    await page.goto(route);
    await page.locator('#ks-form button[type=submit]').click();
    await expect(page.locator('#ks-results')).toBeVisible();
    await expect(page.locator('#ks-payable')).toContainText(/600(?:,|\u202f)000/);

    const csvPending = page.waitForEvent('download');
    await page.locator('#ks-csv').click();
    const csvFilename = (await csvPending).suggestedFilename();
    expect(csvFilename).toMatch(route.startsWith('/fr/')
      ? /^afrotools-lisez-l-instrument-appliquez-le-bareme-\d{4}-\d{2}-\d{2}\.csv$/
      : /^kenya-stamp-duty-plan\.csv$/);
    const jsonPending = page.waitForEvent('download');
    await page.locator('#ks-json').click();
    const jsonFilename = (await jsonPending).suggestedFilename();
    expect(jsonFilename).toMatch(route.startsWith('/fr/')
      ? /^afrotools-lisez-l-instrument-appliquez-le-bareme-\d{4}-\d{2}-\d{2}\.json$/
      : /^kenya-stamp-duty-plan\.json$/);

    if (route.startsWith('/fr/')) {
      const pdfPending = page.waitForEvent('download');
      await page.locator('#ks-pdf').click();
      const pdfDownload = await pdfPending;
      expect(pdfDownload.suggestedFilename()).toMatch(/^afrotools-lisez-l-instrument-appliquez-le-bareme-\d{4}-\d{2}-\d{2}\.pdf$/);
      const stream = await pdfDownload.createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      expect(Buffer.concat(chunks).subarray(0, 5).toString('ascii')).toBe('%PDF-');
    } else {
      await page.locator('#ks-pdf').click();
      await expect.poll(() => page.evaluate(() => window.__pdfCalls.length)).toBe(1);
    }
    expect(await page.evaluate(() =>
      [...document.querySelectorAll('input,select')].every(element => element.labels && element.labels.length)
    )).toBeTruthy();
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    )).toBeTruthy();
    expect(errors).toEqual([]);
    const analyticsRequest = request =>
      /(?:google-analytics\.com\/g\/collect|googlesyndication\.com\/measurement\/conversion)/i.test(request.url);
    expect(requests.filter(request =>
      /\.netlify\/functions|\/api\/|supabase/i.test(request.url) ||
      (request.method !== 'GET' && !analyticsRequest(request))
    )).toEqual([]);

    const analyticsPayload = requests
      .filter(analyticsRequest)
      .map(request => `${request.url}\n${request.postData}`)
      .join('\n');
    for (const privateInput of ['15000000', '2026-07-23']) {
      expect(analyticsPayload).not.toContain(privateInput);
    }
    if (route === '/tools/ke-stamp-duty/') {
      await page.screenshot({
        path: 'artifacts/finance-row-105-ke-stamp-duty/375-light-transfer.png',
        fullPage: true
      });
    }
  });
}

test('calculates the lease schedule, fails closed and covers dark responsive layouts', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/ke-stamp-duty/');
  await page.locator('input[name=ks-mode][value=lease]').check();
  await page.locator('#ks-term-years').fill('2');
  await page.locator('#ks-annual-rent').fill('1200000');
  await page.locator('#ks-premium').fill('1000000');
  await page.locator('#ks-form button[type=submit]').click();
  await expect(page.locator('#ks-rent-result')).toContainText(/12(?:,|\u202f)000/);
  await expect(page.locator('#ks-premium-result')).toContainText(/40(?:,|\u202f)000/);
  await expect(page.locator('#ks-payable')).toContainText(/52(?:,|\u202f)000/);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBeTruthy();

  await page.locator('#ks-term-years').fill('0');
  await page.locator('#ks-form button[type=submit]').click();
  await expect(page.locator('#ks-error')).not.toBeEmpty();
  await expect(page.locator('#ks-results')).toBeHidden();

  await page.setViewportSize({ width: 768, height: 900 });
  await page.evaluate(() => window.AfroTools.darkMode.set('dark'));
  await page.reload();
  await page.locator('#ks-form button[type=submit]').click();
  await expect(page.locator('#ks-results')).toBeVisible();
  await page.screenshot({
    path: 'artifacts/finance-row-105-ke-stamp-duty/768-dark-transfer.png',
    fullPage: true
  });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBeTruthy();
});

test('creates a real local PDF document', async ({ page }) => {
  await page.goto('/tools/ke-stamp-duty/');
  await page.locator('#ks-form button[type=submit]').click();
  const pending = page.waitForEvent('download');
  await page.locator('#ks-pdf').click();
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

test('fails safely when the local calculation engine is unavailable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/engines/ke-stamp-duty-engine.js*', route => route.abort());
  await page.goto('/tools/ke-stamp-duty/');
  await expect(page.locator('#ks-error')).toContainText('did not load');
  await expect(page.locator('#ks-form button[type=submit]')).toBeDisabled();
  expect(errors).toEqual([]);
});

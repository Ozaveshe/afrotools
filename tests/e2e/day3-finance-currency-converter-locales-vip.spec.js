const { test, expect } = require('@playwright/test');

const fresh = {
  base: 'USD',
  rates: { USD: 1, NGN: 1400, KES: 130, GHS: 12, ZAR: 18, EUR: 0.9, GBP: 0.78 },
  source: 'fawazahmed',
  timestamp: new Date().toISOString()
};

const routes = [
  {
    locale: 'fr',
    path: '/fr/tools/convertisseur-devises/?from=USD&to=NGN',
    ready: 'Snapshot daté prêt',
    manual: 'Mon taux prestataire',
    stale: 'Snapshot trop ancien',
    result: /175[\s\u202f,.]?700/,
    artifact: 'artifacts/currency-converter-fr-vip-375-dark.png'
  },
  {
    locale: 'sw',
    path: '/sw/zana/kibadilishaji-sarafu/?from=USD&to=NGN',
    ready: 'Snapshot yenye tarehe iko tayari',
    manual: 'Kiwango cha mtoa huduma',
    stale: 'Snapshot ni ya zamani sana',
    result: /175[\s,]?700/,
    artifact: 'artifacts/currency-converter-sw-vip-375-dark.png'
  }
];

async function stub(page, data) {
  await page.route('**/api/forex?base=USD', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) }));
  await page.route('**/data/forex/latest.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) }));
}

for (const item of routes) {
  test(`${item.locale} route has real parity, local export and narrow dark layout`, async ({ page }) => {
    const requests = [];
    const consoleErrors = [];
    page.on('request', request => requests.push({ method: request.method(), url: request.url(), postData: request.postData() }));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await stub(page, fresh);
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto(item.path);
    await expect(page.locator('html')).toHaveAttribute('lang', item.locale);
    await expect(page.locator('#fxStatus')).toHaveText(item.ready);
    await expect(page.locator('#fxFrom')).toHaveValue('USD');
    await expect(page.locator('#fxTo')).toHaveValue('NGN');
    const unnamedControls = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content input, #main-content select, #main-content button')).filter(control => {
      const labelled = control.id && document.querySelector(`label[for="${control.id}"]`);
      return !labelled && !control.closest('label') && !control.getAttribute('aria-label') && !control.textContent.trim();
    }).map(control => control.id || control.tagName));
    expect(unnamedControls).toEqual([]);
    await expect(page.locator('#fxStatus')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#fxResultValue')).toHaveAttribute('aria-live', 'polite');
    await page.locator('#fxAmount').fill('125.5');
    await page.locator('#fxConvert').click();
    await expect(page.locator('#fxResultValue')).toHaveText(item.result);
    await expect(page.locator('#fxRateUsed')).toContainText('1 USD');
    await page.screenshot({ path: item.artifact, fullPage: true });
    const download = page.waitForEvent('download');
    await page.locator('#fxCsv').click();
    expect((await download).suggestedFilename()).toBe('afrotools-currency-conversion.csv');
    await page.setViewportSize({ width: 200, height: 640 });
    const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).map(element => ({ element, box: element.getBoundingClientRect() })).filter(item => item.box.left < -0.5 || item.box.right > document.documentElement.clientWidth + 0.5).map(item => ({ tag: item.element.tagName, id: item.element.id, className: String(item.element.className || ''), left: item.box.left, right: item.box.right })).slice(0, 20));
    expect(overflow).toEqual([]);
    expect(requests.filter(request => request.method !== 'GET' && request.postData && request.postData.includes('125.5'))).toEqual([]);
    expect(requests.filter(request => request.method !== 'GET' && /ai|advisor|forex/i.test(request.url))).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test(`${item.locale} route fails closed when stale and preserves provider mode`, async ({ page }) => {
    await stub(page, { ...fresh, timestamp: '2026-01-01T00:00:00.000Z' });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(item.path);
    await expect(page.locator('#fxStatus')).toHaveText(item.stale);
    await expect(page.locator('#fxConvert')).toBeDisabled();
    await page.getByLabel(item.manual, { exact: true }).check();
    await page.locator('#fxAmount').fill('200');
    await page.locator('#fxManualRate').fill('15.25');
    await page.locator('#fxConvert').click();
    await expect(page.locator('#fxResultValue')).toContainText(/3[\s,]?050/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  });
}

test('locale routes expose reciprocal canonicals and hreflang declarations', async ({ page }) => {
  await stub(page, fresh);
  for (const item of routes) {
    await page.goto(item.path);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain(item.locale === 'fr' ? '/fr/tools/convertisseur-devises/' : '/sw/zana/kibadilishaji-sarafu/');
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/currency-converter/');
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/convertisseur-devises/');
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kibadilishaji-sarafu/');
  }
});

test('a failed API request falls back to the fresh committed snapshot', async ({ page }) => {
  await page.route('**/api/forex?base=USD', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.route('**/data/forex/latest.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fresh) }));
  await page.goto('/fr/tools/convertisseur-devises/');
  await expect(page.locator('#fxStatus')).toHaveText('Snapshot daté prêt');
  await expect(page.locator('#fxConvert')).toBeEnabled();
});

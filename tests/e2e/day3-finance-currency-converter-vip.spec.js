const { test, expect } = require('@playwright/test');

const fresh = {
  base: 'USD',
  rates: { USD: 1, NGN: 1400, KES: 130, GHS: 12, ZAR: 18, EUR: 0.9, GBP: 0.78 },
  source: 'fawazahmed',
  timestamp: new Date().toISOString()
};

async function stubFresh(page) {
  await page.route('**/api/forex?base=USD', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fresh) }));
  await page.route('**/data/forex/latest.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fresh) }));
}

test('fresh, responsive, dark, local-only conversion and export', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push({ method: request.method(), url: request.url(), postData: request.postData() }));
  await stubFresh(page);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/tools/currency-converter/?from=USD&to=NGN');
  await expect(page.locator('#fxStatus')).toHaveText('Dated snapshot ready');
  await expect(page.locator('#fxFrom')).toHaveValue('USD');
  await expect(page.locator('#fxTo')).toHaveValue('NGN');
  await expect(page.locator('#fxConvert')).toBeEnabled();
  const acceptCookies = page.getByRole('button', { name: 'Accept', exact: true });
  if (await acceptCookies.isVisible().catch(() => false)) await acceptCookies.click();
  await page.screenshot({ path: 'artifacts/currency-converter-vip-375-dark-top.png' });
  await page.locator('#fxAmount').fill('125.5');
  await page.locator('#fxConvert').click();
  await expect(page.locator('#fxResultValue')).toContainText('175,700');
  await expect(page.locator('#fxRateUsed')).toContainText('1 USD = 1,400 NGN');
  await expect(page.locator('#fxRateStatus')).toContainText('Dated');
  await expect(page.locator('#heatmapGrid, #cryptoGrid, #rateChart, #matrixTable')).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.locator('#fxCsv').click();
  const item = await download;
  expect(item.suggestedFilename()).toBe('afrotools-currency-conversion.csv');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.setViewportSize({ width: 200, height: 640 });
  const narrowOverflow = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).map(element => ({ tag: element.tagName, id: element.id, className: String(element.className || ''), left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width })).filter(box => box.left < -0.5 || box.right > document.documentElement.clientWidth + 0.5).slice(0, 20));
  expect(narrowOverflow).toEqual([]);
  await page.setViewportSize({ width: 375, height: 844 });
  await page.locator('#fxResult').evaluate(element => element.scrollIntoView({ block: 'center' }));
  await page.screenshot({ path: 'artifacts/currency-converter-vip-375-dark-result.png' });
  const amountLeaks = requests.filter(request => request.method !== 'GET' && request.postData && request.postData.includes('125.5'));
  expect(amountLeaks).toEqual([]);
  expect(requests.filter(request => request.method !== 'GET' && /ai|advisor|forex/i.test(request.url))).toEqual([]);
});

test('stale snapshot fails closed and manual provider rate remains usable', async ({ page }) => {
  const stale = { ...fresh, timestamp: '2026-01-01T00:00:00.000Z' };
  await page.route('**/api/forex?base=USD', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stale) }));
  await page.route('**/data/forex/latest.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stale) }));
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/tools/currency-converter/');
  await expect(page.locator('#fxStatus')).toHaveText('Snapshot too old');
  await expect(page.locator('#fxConvert')).toBeDisabled();
  await page.getByLabel('My provider rate').check();
  await expect(page.locator('#fxManualGroup')).toBeVisible();
  await page.locator('#fxAmount').fill('200');
  await page.locator('#fxManualRate').fill('15.25');
  await page.locator('#fxConvert').click();
  await expect(page.locator('#fxResultValue')).toContainText('3,050');
  await expect(page.locator('#fxRateStatus')).toHaveText('Your provider quote');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test('invalid and equal-pair boundaries are explicit', async ({ page }) => {
  await stubFresh(page);
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/tools/currency-converter/');
  await expect(page.locator('#fxStatus')).toHaveText('Dated snapshot ready');
  await page.locator('#fxAmount').fill('0');
  await page.locator('#fxConvert').click();
  await expect(page.locator('#fxAmountError')).toHaveText('Enter an amount greater than zero.');
  await page.locator('#fxAmount').fill('10');
  await page.locator('#fxTo').selectOption('USD');
  await page.locator('#fxConvert').click();
  await expect(page.locator('#fxResultValue')).toContainText('USD 10.00');
  await page.getByLabel('My provider rate').check();
  await page.locator('#fxManualRate').fill('-1');
  await page.locator('#fxConvert').click();
  await expect(page.locator('#fxManualError')).toHaveText('Enter a provider rate greater than zero.');
});

test('launched iframe widget uses the same dated local feed and fails closed', async ({ page }) => {
  await stubFresh(page);
  await page.setViewportSize({ width: 320, height: 620 });
  await page.goto('/widgets/iframe/financial-currency-converter.html?theme=dark');
  await expect(page.locator('#aw-status')).toContainText('Dated indicative snapshot');
  await expect(page.locator('body')).toHaveClass(/dark/);
  await page.locator('#aw-amt').fill('2');
  await page.locator('#aw-calc').click();
  await expect(page.locator('#aw-res')).toContainText('NGN 2,800');
  await expect(page.locator('#aw-res')).toContainText('Fees and provider spreads are not included.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

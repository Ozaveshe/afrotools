const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const engine = require('../../assets/js/engines/crypto-profit.js');

function formatted(value) {
  const sign = value < 0 ? '-' : '';
  return `${sign}XTS ${Math.abs(value).toLocaleString('sw-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

test('native Swahili crypto profit worksheet preserves the local engine and parses every export', async ({ page }) => {
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => requests.push({ url: request.url(), body: request.postData() || '' }));
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/sw/zana/kikokotoo-faida-crypto/');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kikokotoo-faida-crypto/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/crypto/profit-calculator/');
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/crypto/profit-calculator/');
  await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kikokotoo-faida-crypto/');
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgb(255, 255, 255)');

  const unnamed = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content input, #main-content select, #main-content button')).filter(control => {
    const label = control.id && document.querySelector(`label[for="${control.id}"]`);
    return !label && !control.closest('label') && !control.getAttribute('aria-label') && !control.textContent.trim();
  }).map(control => control.id || control.tagName));
  expect(unnamed).toEqual([]);
  await page.locator('#buyPrice').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#sellPrice')).toBeFocused();

  await page.locator('#currencyCode').fill('XTS');
  await page.locator('#buyPrice').fill('123.4567');
  await page.locator('#sellPrice').fill('177.8912');
  await page.locator('#quantity').fill('2.5');
  await page.locator('#buyFeeValue').fill('1.25');
  await page.locator('#buyFeeType').selectOption('percent');
  await page.locator('#sellFeeValue').fill('100');
  await page.locator('#sellFeeType').selectOption('percent');
  await page.locator('.profit-submit').click();
  await expect(page.locator('#cryptoProfitStatus')).toContainText('chini ya 100');
  await expect(page.locator('[data-profit-export="pdf"]')).toBeDisabled();

  await page.locator('#sellFeeValue').fill('7.89');
  await page.locator('#sellFeeType').selectOption('flat');
  await page.locator('#scenarioPrice1').fill('200');
  await page.locator('.profit-submit').click();
  const input = {
    buyPrice: 123.4567,
    sellPrice: 177.8912,
    quantity: 2.5,
    buyFee: { type: 'percent', value: 1.25 },
    sellFee: { type: 'flat', value: 7.89 }
  };
  const expected = engine.calculate(input);
  const scenario = engine.scenarios(input, [200])[0];
  await expect(page.locator('#cryptoProfitResults')).toContainText(formatted(expected.netProfit));
  await expect(page.locator('#cryptoProfitResults')).toContainText(formatted(expected.breakEvenPrice));
  await expect(page.locator('#cryptoProfitScenarioBody')).toContainText(formatted(scenario.netProfit));
  await expect(page.locator('#resultsTitle')).toBeFocused();

  const csvPromise = page.waitForEvent('download');
  await page.locator('[data-profit-export="csv"]').click();
  const csvDownload = await csvPromise;
  expect(csvDownload.suggestedFilename()).toBe('crypto-profit-xts.csv');
  const csv = fs.readFileSync(await csvDownload.path(), 'utf8');
  expect(csv).toContain(`"${expected.netProfit}"`);
  expect(csv).toContain('"Chanzo cha taarifa:');
  expect(csv.trim().split(/\r?\n/).length).toBeGreaterThan(15);

  const jsonPromise = page.waitForEvent('download');
  await page.locator('[data-profit-export="json"]').click();
  const jsonDownload = await jsonPromise;
  const json = JSON.parse(fs.readFileSync(await jsonDownload.path(), 'utf8'));
  expect(json.language).toBe('sw');
  expect(json.currency).toBe('XTS');
  expect(json.result.netProfit).toBe(expected.netProfit);
  expect(json.scenarios[0].netProfit).toBe(scenario.netProfit);
  expect(json.source).toContain('Hakuna bei mubashara');

  const pdfPromise = page.waitForEvent('download');
  await page.locator('[data-profit-export="pdf"]').click();
  const pdfDownload = await pdfPromise;
  expect(pdfDownload.suggestedFilename()).toBe('crypto-profit-xts.pdf');
  const pdfText = (await pdfParse(fs.readFileSync(await pdfDownload.path()))).text;
  expect(pdfText).toContain('XTS');
  expect(pdfText).toContain(expected.netProfit.toFixed(2));
  expect(pdfText).toContain('Hakuna bei mubashara');

  await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
  await page.locator('[data-profit-export="print"]').click();
  expect(await page.evaluate(() => window.__printCalled)).toBe(true);
  await page.emulateMedia({ media: 'print', colorScheme: 'dark', reducedMotion: 'reduce' });
  const printPdf = await page.pdf({ format: 'A4', printBackground: true });
  const printText = (await pdfParse(printPdf)).text;
  expect(printText).toContain('XTS');
  expect(printText).toContain(expected.netProfit.toLocaleString('sw-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  await page.emulateMedia({ media: 'screen', colorScheme: 'dark', reducedMotion: 'reduce' });

  await page.setViewportSize({ width: 320, height: 720 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth)
  );
  const offenders = await page.evaluate(() => Array.from(document.body.querySelectorAll('*')).filter(element => {
    if (element.closest('.profit-table-wrap')) return false;
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 &&
      (box.left < -0.5 || box.right > document.documentElement.clientWidth + 0.5);
  }).map(element => ({ tag: element.tagName, id: element.id, className: String(element.className || '') })).slice(0, 20));
  expect(offenders).toEqual([]);

  await page.locator('[data-profit-reset]').click();
  await expect(page.locator('#buyPrice')).toHaveValue('');
  await expect(page.locator('#sellPrice')).toHaveValue('');
  await expect(page.locator('#buyPrice')).toBeFocused();
  await expect(page.locator('[data-profit-export="csv"]')).toBeDisabled();
  await expect(page.locator('#cryptoProfitStatus')).toContainText('yamefutwa');

  const privateInputs = ['123.4567', '177.8912', '7.89'];
  for (const value of privateInputs) {
    expect(requests.filter(request => `${request.url}\n${request.body}`.includes(value))).toEqual([]);
  }
  expect(errors).toEqual([]);
});

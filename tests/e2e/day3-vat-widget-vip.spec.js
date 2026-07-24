const { test, expect } = require('@playwright/test');

function capture(page) {
  const errors = [];
  const writes = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (request.method() !== 'GET' && request.method() !== 'HEAD') writes.push(request.method() + ' ' + request.url()); });
  return { errors, writes };
}

test('Pan-African VAT widget completes all compact workflows at 320px dark', async ({ page }) => {
  const observed = capture(page);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      window.__storageWrites = window.__storageWrites || [];
      window.__storageWrites.push([key, value]);
      return original.call(this, key, value);
    };
  });
  await page.goto('/widgets/iframe/financial-vat-calculator.html?theme=dark', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#awVatRate')).toHaveValue('');
  await expect(page.locator('body')).toContainText('No country rate is assumed');

  await page.locator('#awVatAmount').fill('1000');
  await page.locator('#awVatRate').fill('15');
  await page.locator('#awVatCalculate').click();
  await expect(page.locator('#awVatSingleResult .aw-result-main')).toHaveText('1,150.00');
  await expect(page.locator('#awVatSingleResult')).toContainText('150.00');
  await page.locator('[data-mode="extract"]').click();
  await page.locator('#awVatCalculate').click();
  await expect(page.locator('#awVatSingleResult .aw-result-main')).toHaveText('869.57');

  await page.locator('#awVatTabSingle').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#awVatTabInvoice')).toHaveAttribute('aria-selected', 'true');
  await page.locator('#awVatLineAmount1').fill('1000');
  await page.locator('#awVatLineRate1').fill('15');
  await page.locator('#awVatInvoiceCalculate').click();
  await expect(page.locator('#awVatInvoiceResult .aw-result-main')).toHaveText('1,150.00');
  await page.locator('#awVatLineAmount2').fill('500');
  await page.locator('#awVatLineTreatment2').selectOption('exempt');
  await expect(page.locator('#awVatLineRate2')).toBeDisabled();
  await page.locator('#awVatInvoiceCalculate').click();
  await expect(page.locator('#awVatInvoiceResult .aw-result-main')).toHaveText('1,650.00');

  await page.locator('#awVatTabWithholding').click();
  await page.locator('#awVatWithholdingAmount').fill('1000');
  await page.locator('#awVatWithholdingRate').fill('20');
  await page.locator('#awVatWithholdingPercent').fill('25');
  await page.locator('#awVatWithholdingCalculate').click();
  await expect(page.locator('#awVatWithholdingResult .aw-result-main')).toHaveText('1,150.00');
  await expect(page.locator('#awVatWithholdingResult')).toContainText('50.00');

  await page.locator('#awVatTabCompare').click();
  await page.locator('#awVatCompareAmount').fill('1000');
  await page.locator('#awVatScenario1').fill('7.5');
  await page.locator('#awVatScenario2').fill('15');
  await page.locator('#awVatScenario3').fill('20');
  await page.locator('#awVatCompareCalculate').click();
  await expect(page.locator('#awVatCompareResult .aw-result-main')).toHaveText('12.50 points');
  await expect(page.locator('#awVatCompareResult')).toContainText('VAT 75.00');

  const safety = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    storageWrites: window.__storageWrites || [],
    text: document.body.innerText
  }));
  expect(safety.overflow).toBe(false);
  expect(safety.storageWrites).toEqual([]);
  expect(safety.text).not.toMatch(/\bAI\b|email/i);
  await page.screenshot({ path: 'test-results/vat-widget-320-dark.png', fullPage: true });
  expect(observed.writes).toEqual([]);
  expect(observed.errors).toEqual([]);
});

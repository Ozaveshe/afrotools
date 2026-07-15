const { test, expect } = require('@playwright/test');

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon|manifest|Failed to load resource|ERR_FAILED|CORS policy/i.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

async function expectNoBodyOverflow(page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(2);
}

test('bank charges app calculates by default and stays usable on mobile', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/bank-charges/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#rankCard')).toHaveClass(/show/);
  await expect(page.locator('#rankList .bc-rank-item')).toHaveCount(10);
  await expect(page.locator('#resultStatus')).toContainText('Compared 10 providers in Nigeria');
  await expect(page.locator('#rankTitle')).toContainText('monthly cost');

  await page.locator('#selCountry').selectOption('za');
  await expect(page.locator('#amountCurrency')).toHaveText('R');
  await expect(page.locator('#inpAvgAmount')).toHaveValue('1000');
  await expect(page.locator('#resultStatus')).toContainText('South Africa');

  await page.getByRole('button', { name: 'Annual' }).click();
  await expect(page.locator('#rankTitle')).toContainText('annual cost');
  await expect(page.locator('#resultStatus')).toContainText('per year');

  const touchTargets = await page.locator('.bc-filter-btn, .bc-action-btn').evaluateAll(elements =>
    elements.filter(element => getComputedStyle(element).display !== 'none').map(element => element.getBoundingClientRect().height)
  );
  expect(touchTargets.every(height => height >= 44)).toBeTruthy();
  await expectNoBodyOverflow(page);
  expect(errors).toEqual([]);
});

test('bank charges app validates input and exports the current comparison', async ({ page }) => {
  const errors = captureErrors(page);
  await page.goto('/tools/bank-charges/', { waitUntil: 'domcontentloaded' });

  await page.locator('#inpAvgAmount').fill('-1');
  await page.getByRole('button', { name: 'Compare Banks' }).click();
  await expect(page.locator('#inpAvgAmount')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#amountError')).toBeVisible();

  await page.locator('#inpAvgAmount').fill('50000');
  await page.getByRole('button', { name: 'Compare Banks' }).click();
  await expect(page.locator('#inpAvgAmount')).toHaveAttribute('aria-invalid', 'false');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download bank comparison as CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('bank-charges-ng.csv');
  await expect(page.locator('#actionFeedback')).toHaveText('CSV downloaded.');
  expect(errors).toEqual([]);
});

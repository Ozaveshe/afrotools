const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('keeps the EAC CET source contract visible and usable on mobile', async ({ page }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('net::ERR_')) runtimeErrors.push(message.text());
  });

  await page.goto('/tools/eac-cet/');

  await expect(page.getByText('8 EAC Members', { exact: true })).toBeVisible();
  await page.locator('#searchInput').fill('mobile phone');
  const mobileResult = page.locator('#searchResults .sr-item').filter({ hasText: 'Mobile Phones / Smartphones' });
  await expect(mobileResult).toHaveCount(1);
  await expect(mobileResult).toContainText('0% CET');
  await mobileResult.click();
  await expect(page.locator('#spbMeta')).toContainText('HS 8517.13 / 8517.14');
  await expect(page.locator('#cetRateInput')).toHaveValue('0');

  await page.locator('#cifValue').fill('1000');
  await page.locator('#countrySelect').selectOption('KE');
  await page.locator('#calcBtn').click();
  await expect(page.locator('#resultBlock')).toHaveClass(/on/);
  await expect(page.locator('#breakdownBody')).toContainText('EAC Common External Tariff (25%)');
  await expect(page.locator('#breakdownBody')).toContainText('Import Declaration Fee (IDF)');
  await expect(page.locator('#breakdownBody')).toContainText('2.5%');
  await expect(page.locator('#breakdownBody')).toContainText('Railway Development Levy (RDL)');
  await expect(page.locator('#breakdownBody')).toContainText('2%');

  await page.locator('[data-tab="compare"]').click();
  await expect(page.locator('#panel-compare .card-title')).toHaveText('Compare Five Modeled EAC Markets');
  const mobileOptionLabel = await page.locator('#compareProduct option').filter({ hasText: 'Mobile Phones / Smartphones' }).textContent();
  await page.locator('#compareProduct').selectOption({ label: mobileOptionLabel });
  await page.locator('#compareCif').fill('1000');
  await page.locator('#compareCetRate').fill('0');
  await page.locator('#compareBtn').click();
  await expect(page.locator('#compareHead .country-name')).toHaveCount(5);
  await expect(page.locator('#compareBody')).toContainText('(25%)');
  await expect(page.locator('#compareBody')).toContainText('(10%)');
  await expect(page.locator('#panel-compare .info-alert')).toContainText('South Sudan, DR Congo and Somalia');

  await page.locator('[data-tab="remission"]').click();
  await expect(page.locator('#drContent')).toContainText('Illustrative Gazette Categories');
  await expect(page.locator('#drContent')).toContainText('Notice-specific');

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});

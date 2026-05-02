const { test, expect } = require('@playwright/test');

test('AfroFX shows fallback freshness instead of silent placeholders', async ({ page }) => {
  await page.goto('/tools/currency-converter/');

  const status = page.locator('#updatedText');
  await expect(status).not.toContainText(/Checking|Loading|\-\-/i, { timeout: 12000 });
  await expect(status).toContainText(/Source|Cached|Stale|Latest|Unavailable|Error/i);
  await expect(page.locator('#resultValue')).not.toHaveText('--');
});

test('AfroFuel renders a dated data status and table rows', async ({ page }) => {
  await page.goto('/tools/fuel-tracker/');

  const status = page.locator('#last-updated');
  await expect(status).not.toContainText(/Checking|Loading|\-\-/i, { timeout: 12000 });
  await expect(status).toContainText(/Source|Cached|Stale|Latest|fallback|Unavailable|Error/i);
  await expect.poll(() => page.locator('#price-table-body tr').count()).toBeGreaterThan(10);
});

test('AfroRates falls back from partial API data to a usable central bank snapshot', async ({ page }) => {
  await page.goto('/tools/afrorates/');

  const status = page.locator('#last-updated');
  await expect(status).not.toContainText(/Checking|Loading|\-\-/i, { timeout: 12000 });
  await expect(status).toContainText(/Source|Cached|Stale|Latest|reference|Unavailable|Error/i);
  await expect(page.locator('#stat-median-rate')).not.toHaveText(/Checking|\-\-/i);
  await expect.poll(() => page.locator('#rate-table-body tr').count()).toBeGreaterThan(10);
});

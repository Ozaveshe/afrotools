const { test, expect } = require('@playwright/test');

test('French Solar ROI gives a next action for missing costs and for a viable system', async ({ page }) => {
  await page.goto('/fr/tools/roi-solaire/kenya/');
  const bill = page.locator('#monthlyBill');
  const fuel = page.locator('#generatorSpend');
  const result = page.locator('#resultStatus');
  await bill.fill('0');
  await fuel.fill('0');
  await page.locator('#calcBtn').click();
  await expect(page.locator('#rRisk')).toHaveText('Données de dépenses insuffisantes');
  await expect(result).toContainText('Saisissez une facture mensuelle');

  await bill.fill('9150');
  await fuel.fill('2500');
  await page.locator('#calcBtn').click();
  await expect(page.locator('#rRisk')).toHaveText('Solaire intéressant, batterie facultative');
  await expect(result).toContainText('Comparez un devis sans batterie');
  await expect(page.locator('#rRiskText')).toContainText('Fiabilité des hypothèses');
});

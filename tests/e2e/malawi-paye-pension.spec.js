const { test, expect } = require('@playwright/test');

test('Malawi monthly take-home reconciles MRA PAYE and employee pension on both surfaces', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/malawi/mw-paye');
  await page.locator('#grossSalary').fill('500000');
  await page.getByRole('button', { name: /calculate/i }).first().click();
  await expect(page.locator('#resAmount')).toContainText('376,000');
  await page.getByRole('button', { name: 'Annual', exact: true }).click();
  await expect(page.locator('#resAmount')).toContainText('4,512,000');

  await page.goto('/widgets/iframe/financial-malawi-paye');
  await page.getByLabel('Monthly gross salary (MWK)').fill('500000');
  await page.getByRole('button', { name: 'Calculate PAYE' }).click();
  await expect(page.locator('.aw-result-main')).toHaveText('MWK 376,000');
  const rows = page.locator('.aw-result-row');
  await expect(rows.filter({ hasText: 'Monthly PAYE' })).toContainText('MWK 99,000');
  await expect(rows.filter({ hasText: 'Employee pension' })).toContainText('MWK 25,000');
  await expect(rows.filter({ hasText: 'Employer pension' })).toContainText('MWK 50,000');
});

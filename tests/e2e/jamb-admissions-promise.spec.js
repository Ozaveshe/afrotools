const { expect, test } = require('@playwright/test');

test('JAMB screening worksheet calculates from entered weights without retired cutoffs', async ({ page }) => {
  await page.goto('/tools/jamb-aggregate/', { waitUntil: 'domcontentloaded' });
  await page.locator('#utme').fill('280');
  await page.locator('#postUtme').fill('68');
  await page.getByRole('button', { name: 'Calculate planning aggregate' }).click();
  await expect(page.locator('#aggregateScore')).toHaveText('69.00');
  await expect(page.locator('#formulaUsed')).toContainText('User-entered weights');
  await expect(page.locator('body')).not.toContainText('UNILAG:');
  await expect(page.locator('body')).not.toContainText('Cutoff data sourced');
});

test('Practice Check shows a verified session count before starting', async ({ page }) => {
  await page.goto('/jamb/score-predictor/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#practice-status')).toContainText('20 reviewed questions');
  await expect(page.locator('#practice-status')).toContainText('english 5');
});

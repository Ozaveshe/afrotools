const { test, expect } = require('@playwright/test');

test('French withdrawal guide exposes the million-franc limit and country navigation on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/fr/blog/frais-orange-money-guide-2026/');
  await page.getByRole('link', { name: 'Retirer 1 000 000 FCFA au Cameroun', exact: true }).click();
  await expect(page).toHaveURL(/#retrait-million$/);
  await expect(page.locator('#retrait-million')).toBeInViewport();
  await expect(page.getByText('500 000 FCFA par opération de retrait', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Sénégal', exact: true }).click();
  await expect(page).toHaveURL(/#senegal$/);
  await expect(page.locator('#senegal')).toBeInViewport();
});

const { test, expect } = require('@playwright/test');

for (const width of [390, 1280]) {
  test(`buyer browsing keeps evidence and filters usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/cars/');
    await expect(page.getByRole('heading', { name: 'Find your car. Know your numbers.' })).toBeVisible();
    await expect(page.getByLabel('Search', { exact: true })).toBeVisible();
    await page.locator('.cars-buyer-insights summary').click();
    await expect(page.locator('.cars-insight').filter({ has: page.getByRole('heading', { name: 'Lowest landed cost', exact: true }) })).not.toContainText('2005 Toyota Camry');
    await expect(page.getByRole('combobox', { name: 'Fuel', exact: true })).not.toBeVisible();
    await page.locator('.cars-more-filters summary').click();
    await expect(page.getByRole('combobox', { name: 'Fuel', exact: true })).toBeVisible();
    await page.getByLabel('Search', { exact: true }).fill('RAV4');
    await page.getByRole('button', { name: 'Compare cars', exact: true }).click();
    const card = page.locator('.cars-browse-card');
    await expect(card).toHaveCount(1);
    await expect(card).toContainText('24,000,000');
    await expect(card).toContainText('10 asks');
    await expect(card).toContainText('Foreign Used');
    await expect(card).toContainText('2026-09-27');
    await expect(card.getByRole('link', { name: 'View source' })).toHaveAttribute('href', /jiji.ng/);
    await expect(card.locator('.cars-browse-estimate p').first()).not.toBeVisible();
    await card.locator('.cars-browse-estimate summary').click();
    await expect(card).toContainText('Verify import charges before deciding');
    await expect(card.getByRole('link', { name: 'Estimate import →' })).toHaveAttribute('href', /price=12200&engineCc=2500/);
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByLabel('Only cars with local price samples').check();
    await page.getByRole('button', { name: 'Compare cars', exact: true }).click();
    await expect(page.locator('.cars-browse-card').first()).toBeVisible();
    expect(await page.locator('.cars-browse-card').allTextContents()).not.toEqual(expect.arrayContaining([expect.stringContaining('Price sample needed')]));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('a market without samples does not acquire an invented local price', async ({ page }) => {
  await page.goto('/cars/');
  await page.getByRole('combobox', { name: 'Country', exact: true }).selectOption('kenya');
  await page.getByLabel('Only cars with local price samples').check();
  await page.getByRole('button', { name: 'Compare cars', exact: true }).click();
  await expect(page.locator('.cars-browse-card')).toHaveCount(0);
  await expect(page.locator('.cars-filter-panel')).toContainText('0 matching vehicles');
});

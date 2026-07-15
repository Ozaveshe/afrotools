const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('filters the complete Energy catalog by task and search without losing routes', async ({ page }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await page.goto('/energy/');

  const cards = page.locator('.en-tool-card[data-energy-topics]');
  const visibleCards = page.locator('.en-tool-card[data-energy-topics]:visible');
  await expect(cards).toHaveCount(20);
  await expect(page.locator('.en-tool-finder-icon svg')).toBeVisible();
  await expect(page.locator('#energyToolFinderStatus')).toHaveText('Showing all 20 tools.');
  await expect(page.locator('[data-energy-filter="all"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.en-tc-icon svg')).toHaveCount(20);

  await page.locator('[data-energy-filter="bills"]').click();
  await expect(page.locator('[data-energy-filter="bills"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-energy-filter="all"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#energyToolFinderStatus')).toHaveText('Showing 6 of 20 tools.');
  await expect(visibleCards).toHaveCount(6);

  await page.locator('#energyToolSearch').fill('water');
  await expect(page.locator('#energyToolFinderStatus')).toHaveText('Showing 1 of 20 tools for “water”.');
  await expect(visibleCards).toHaveCount(1);
  await expect(page.locator('.en-tool-card[href="/tools/water-bill/"]')).toBeVisible();

  await page.locator('#energyToolFinderReset').click();
  await expect(page.locator('#energyToolSearch')).toBeFocused();
  await expect(page.locator('#energyToolSearch')).toHaveValue('');
  await expect(page.locator('#energyToolFinderStatus')).toHaveText('Showing all 20 tools.');
  await expect(visibleCards).toHaveCount(20);

  await page.locator('#energyToolSearch').fill('biogas');
  await expect(page.locator('#energyToolFinderStatus')).toHaveText('Showing 1 of 20 tools for “biogas”.');
  await expect(page.locator('.en-tool-card[href="/tools/biogas-roi/"]')).toBeVisible();
  await expect(page.locator('.en-region-label').nth(0)).toBeHidden();
  await expect(page.locator('.en-region-label').nth(1)).toBeHidden();
  await expect(page.locator('.en-region-label').nth(2)).toBeVisible();

  await page.locator('#energyToolSearch').fill('nonexistent energy task');
  await expect(page.locator('#energyToolFinderStatus')).toHaveText('Showing 0 of 20 tools for “nonexistent energy task”.');
  await expect(page.locator('#energyToolFinderEmpty')).toBeVisible();
  for (const label of await page.locator('.en-region-label').all()) {
    await expect(label).toBeHidden();
  }

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});

const { test, expect } = require('@playwright/test');

test('creator directory is usable with search, country filter, and mobile width', async ({ page }) => {
  await page.goto('/tools/afrostream/directory/');
  await expect(page.getByRole('heading', { name: 'Creator directory' })).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(10, 10, 15)');
  await expect(page.locator('[data-creator]')).toHaveCount(407);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', 'https://afrotools.com/tools/afrostream/directory/'
  );

  await page.getByRole('searchbox', { name: 'Search name or category' }).fill('Agbaps');
  await expect(page.locator('#directoryCount')).toHaveText('1 of 407 profiles shown');
  await expect(page.locator('[data-creator]:visible')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Agbaps/ })).toHaveAttribute(
    'href', '/tools/afrostream/creator?id=agbaps'
  );
  await page.getByRole('link', { name: /Agbaps/ }).focus();
  await expect(page.getByRole('link', { name: /Agbaps/ })).toHaveCSS('outline-style', 'solid');

  await page.getByLabel('Country', { exact: true }).selectOption('KE');
  await expect(page.locator('#directoryEmpty')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('#directoryCount')).toHaveText('407 of 407 profiles shown');

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('creator directory keeps its profile links available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/tools/afrostream/directory/');
  await expect(page.getByRole('heading', { name: 'Creator directory' })).toBeVisible();
  await expect(page.locator('[data-creator]')).toHaveCount(407);
  await expect(page.getByRole('searchbox', { name: 'Search name or category' })).toBeHidden();
  await context.close();
});

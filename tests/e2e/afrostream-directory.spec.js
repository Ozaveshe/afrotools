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
  await expect(page.locator('[data-country-group]:visible h2 small')).toContainText('1 match');
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
  await expect(page.getByRole('navigation', { name: 'AfroStream navigation', exact: true })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search name or category' })).toBeHidden();
  await context.close();
});

test('product navigation uses consistent labels and a keyboard-operable More menu on mobile', async ({ page }) => {
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  for (const route of ['/tools/afrostream/', '/tools/afrostream/directory/', '/tools/afrostream/creator?id=unavailable', '/tools/afrostream/university/']) {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(route);
    const nav = page.getByRole('navigation', { name: 'AfroStream navigation', exact: true });
    await expect(nav.locator('.as-subnav-links a,.su-subnav-links a')).toHaveText(['The Scene', 'Live', 'Creators', 'Playbook']);
    await nav.locator('summary').press('Enter');
    await expect(nav.getByRole('link', { name: 'Creator rankings', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Ranking methodology', exact: true })).toBeVisible();
    expect(await nav.locator('.scene-nav-menu').evaluate(el => el.getBoundingClientRect().right <= innerWidth + 1 && el.getBoundingClientRect().left >= 0)).toBe(true);
    await nav.getByRole('link', { name: 'Creator rankings', exact: true }).press('Escape');
    await expect(nav.locator('details')).not.toHaveAttribute('open', '');
    await expect(nav.locator('summary')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

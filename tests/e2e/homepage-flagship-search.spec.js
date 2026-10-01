const { test, expect } = require('@playwright/test');

test('English suggestions keep each flagship once and exact app names open the app', async ({ page }) => {
  await page.route('**/*', route => {
    const host = new URL(route.request().url()).hostname;
    return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
  });
  for (const app of ['AfroStream', 'AfroKitchen', 'AfroAtlas']) {
    await page.goto('/');
    await page.locator('#hero-search-input').fill(app);
    await expect(page.locator('#search-dropdown .sd-item').first()).toHaveAttribute('href', '/tools/' + app.toLowerCase() + '/');
    const links = await page.locator('#search-dropdown .sd-item').evaluateAll(items => items.map(item => item.getAttribute('data-href')));
    expect(new Set(links).size).toBe(links.length);
    expect(links.every(href => !/^\/(fr|sw|yo|ha)\//.test(href))).toBe(true);
    await page.locator('#hero-search-btn').click();
    await expect(page).toHaveURL(new RegExp('/tools/' + app.toLowerCase() + '/?$'));
  }
});

test('French suggestions stay in French without hiding distinct related workflows', async ({ page }) => {
  await page.goto('/?locale=fr');
  await page.locator('#hero-search-input').fill('AfroStream');
  await expect(page.locator('#search-dropdown .sd-item').first()).toBeVisible();
  const links = await page.locator('#search-dropdown .sd-item').evaluateAll(items => items.map(item => item.getAttribute('data-href')));
  expect(links.every(href => href.startsWith('/fr/'))).toBe(true);
  expect(new Set(links).size).toBe(links.length);
});

const { test, expect } = require('@playwright/test');

test('Yoruba catalog exposes labeled destinations and retains the selected search result', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/yo/awon-ise/', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('[data-yo-catalog-grid] a');
  await expect(cards.first()).toBeVisible();
  const records = await cards.evaluateAll(nodes => nodes.map(node => ({
    href: node.getAttribute('href'), name: node.querySelector('strong').textContent,
  })));
  for (const record of records) {
    expect(record.href).toMatch(/^\/(?!\/)/);
    expect(record.name).not.toMatch(/^\/|^$/);
  }
  await expect(page.locator('#yoCatalogCategory option[value="agriculture"]')).toHaveCount(1);
  await page.selectOption('#yoCatalogMode', 'fallback');
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.evaluateAll(nodes => nodes.every(node => node.hreflang === 'en'))).toBe(true);
  await page.selectOption('#yoCatalogMode', 'yo');
  expect(await cards.evaluateAll(nodes => nodes.every(node => node.pathname.startsWith('/yo/')))).toBe(true);
  await page.selectOption('#yoCatalogMode', 'all');
  await page.fill('#yoCatalogSearch', 'eja');
  const fish = cards.filter({ hasText: /oko ẹja/i }).first();
  const target = await fish.getAttribute('href');
  expect(target).toMatch(/^\/(?:yo\/awon-ise\/ere-oko-eja\/|agriculture\/fish-farming\/nigeria\/?)/);
  const navigation = page.waitForResponse(response => response.request().isNavigationRequest()
    && response.status() === 200 && new URL(response.url()).pathname.replace(/\/$/, '') === target.replace(/\/$/, ''));
  await fish.click();
  await navigation;
  await expect(page.locator('h1').first()).toContainText(/fish farming|oko ẹja/i);
  await expect(page).toHaveURL(url => url.pathname.replace(/\/$/, '') === target.replace(/\/$/, ''));
});

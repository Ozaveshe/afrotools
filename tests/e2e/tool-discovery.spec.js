const { test, expect } = require('@playwright/test');

test('/tools/ ships a crawlable static directory', async ({ request }) => {
  const response = await request.get('/tools/');
  expect(response.status()).toBeLessThan(400);
  const html = await response.text();

  const staticCards = html.match(/data-tool-card/g) || [];
  expect(staticCards.length).toBeGreaterThanOrEqual(100);
  expect(html).toContain('Nigeria PAYE Calculator');
  expect(html).toContain('PDF Workspace');
  expect(html).not.toMatch(/>\s*No tools found\s*</i);
});

test('tool search finds Nigeria PAYE and PDF Workspace, then clears back to full results', async ({ page }) => {
  await page.goto('/tools/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#tools-container a[href]').first()).toBeVisible();
  const initialCount = await page.locator('#tools-container a[href]').count();
  expect(initialCount).toBeGreaterThanOrEqual(100);
  await expect(page.locator('#no-results')).toBeHidden();

  await page.locator('#tool-search').fill('Nigeria PAYE');
  await expect(page.getByRole('link', { name: /nigeria paye calculator/i })).toBeVisible();

  await page.locator('#tool-search').fill('PDF');
  await expect(page.getByRole('link', { name: /pdf workspace/i })).toBeVisible();

  await page.locator('#tool-search').fill('');
  await page.locator('#country-filter').selectOption('all');
  await page.locator('#status-filter').selectOption('all');
  await page.locator('#language-filter').selectOption('all');
  await expect(async () => {
    const restored = await page.locator('#tools-container a[href]').count();
    expect(restored).toBeGreaterThanOrEqual(100);
  }).toPass();
});

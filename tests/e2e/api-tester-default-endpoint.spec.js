const { test, expect } = require('@playwright/test');

test('default API sample succeeds through the same-origin status route', async ({ page }) => {
  const requested = [];
  await page.route('**/api/status', async (route) => {
    requested.push(new URL(route.request().url()).pathname);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'operational',
        api: 'AfroTools Public API'
      })
    });
  });

  await page.goto('/tools/api-tester/', { waitUntil: 'domcontentloaded' });
  const expectedStatusUrl = new URL('/api/status', page.url()).href;
  await expect(page.locator('#url')).toHaveValue(expectedStatusUrl);
  expect(await page.locator('#url').evaluate((input) => input.validity.valid)).toBe(true);
  await expect(page.locator('#test-contains')).toHaveValue('operational');
  await expect(page.locator('#test-jsonpath')).toHaveValue('$.status');

  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.locator('#response-meta')).toContainText('Status 200');
  await expect(page.locator('#response-body')).toContainText('"status": "operational"');
  await expect(page.locator('#test-results')).toContainText('PASS Status is 200');
  await expect(page.locator('#test-results')).toContainText('PASS Response contains "operational"');
  await expect(page.locator('#test-results')).toContainText('PASS JSON path exists: $.status');
  expect(requested).toEqual(['/api/status']);
});

const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route('**/api/transport-fares?**', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ fares: [] }) }));
});

test('calculates, validates and keeps planner inputs out of requests', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/tools/route-fares/');
  await expect(page.locator('h1')).toContainText('Plan what a route will cost');
  await expect(page.locator('#rfTotal')).toHaveText(/4,?840/);
  await page.fill('#rfRoute', 'Private home route');
  await page.fill('#rfFare', '150');
  await page.fill('#rfPrevious', '120');
  await page.click('button[type="submit"]');
  await expect(page.locator('#rfChange')).toHaveText('+25.0%');
  expect(requests.join('\n')).not.toContain('Private%20home%20route');
  await page.fill('#rfFare', '0');
  await page.click('button[type="submit"]');
  await expect(page.locator('#rfStatus')).toContainText('Fare per ride');
  await page.fill('#rfFare', '150');
  await page.click('button[type="submit"]');
  await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
  await page.getByRole('button', { name: 'Print / save PDF' }).click();
  expect(await page.evaluate(() => window.__printCalled)).toBe(true);
  expect(errors).toEqual([]);
});

test('fails helpfully when the optional community feed is offline', async ({ page }) => {
  await page.unroute('**/api/transport-fares?**');
  await page.route('**/api/transport-fares?**', route => route.abort());
  await page.goto('/tools/route-fares/');
  await expect(page.locator('#rfFeed')).toContainText('unavailable right now');
  await expect(page.locator('#rfTotal')).not.toBeEmpty();
});

for (const width of [320, 375, 768]) {
  test(`fits ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/route-fares/');
    const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);
  });
}

test('remains usable at 200 percent zoom and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 750, height: 900 });
  await page.goto('/tools/route-fares/');
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await expect(page.getByRole('button', { name: 'Calculate route budget' })).toBeVisible();
  await page.screenshot({ path: 'test-results/route-fares-mobile-dark-200.png', fullPage: true });
});

test('desktop visual receipt', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/tools/route-fares/');
  await page.screenshot({ path: 'test-results/route-fares-desktop.png', fullPage: true });
});

const { test, expect } = require('@playwright/test');

const hubs = [
  { route: '/nigeria/', code: 'NG', name: 'Nigeria' },
  { route: '/kenya/', code: 'KE', name: 'Kenya' },
  { route: '/ghana/', code: 'GH', name: 'Ghana' },
  { route: '/south-africa/', code: 'ZA', name: 'South Africa' },
  { route: '/tanzania/', code: 'TZ', name: 'Tanzania' }
];

for (const hub of hubs) {
  test(`${hub.name} utility hub is usable at 390px`, async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(hub.route, { waitUntil: 'domcontentloaded' });

    const section = page.locator(`[data-country-intelligence="${hub.code}"]`);
    await expect(section).toBeVisible();
    await expect(section.getByRole('heading', { name: `What AfroTools has for ${hub.name}` })).toBeVisible();
    await expect(section.locator('.country-intelligence__area')).toHaveCount(10);
    await expect(section.getByText('What is still missing')).toBeVisible();
    await expect(section.locator('.country-intelligence__link').first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(consoleErrors).toEqual([]);
  });
}

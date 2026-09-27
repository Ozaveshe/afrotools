const { test, expect } = require('@playwright/test');
const tracker = require('../../data/government/africa-election-tracker.json');

const editions = [
  { locale: 'ha', route: '/ha/zabe/' },
  { locale: 'yo', route: '/yo/idibo/' }
];

for (const edition of editions) {
  test(`${edition.locale} calendar is readable without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: test.info().project.use.baseURL,
      javaScriptEnabled: false,
      serviceWorkers: 'block',
      viewport: { width: 390, height: 844 }
    });
    try {
      const page = await context.newPage();
      const response = await page.goto(edition.route);
      expect(response.status()).toBe(200);
      await expect(page.locator('[data-ed-snapshot-election-id]')).toHaveCount(tracker.elections.length);
      await expect(page.locator('[data-ed-snapshot-date]')).toHaveAttribute('data-ed-snapshot-date', tracker.generatedAt);
      await expect(page.locator('[data-ed-country]')).toBeDisabled();
      await expect(page.locator('[data-ed-upcoming]')).toBeDisabled();
      await expect(page.locator('[data-ed-snapshot-election-id] a[href^="https://"]').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    } finally {
      await context.close();
    }
  });

  test(`${edition.locale} failed data request preserves the dated snapshot`, async ({ page }) => {
    await page.route('**/data/government/africa-election-tracker.json', (route) => route.abort());
    await page.goto(edition.route);
    await expect(page.locator('[data-ed-snapshot-election-id]')).toHaveCount(tracker.elections.length);
    await expect(page.locator('[data-ed-country]')).toBeDisabled();
    await expect(page.locator('[data-ed-upcoming]')).toBeDisabled();
    await expect(page.locator('[data-ed-status]')).toContainText(tracker.generatedAt.slice(0, 4));
  });

  test(`${edition.locale} invalid data cannot replace the snapshot`, async ({ page }) => {
    await page.route('**/data/government/africa-election-tracker.json', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ generatedAt: tracker.generatedAt, elections: [{ country: 'Test', electionDate: '2026-11-01' }] })
      }));
    await page.goto(edition.route);
    await expect(page.locator('[data-ed-snapshot-election-id]')).toHaveCount(tracker.elections.length);
    await expect(page.locator('[data-ed-country]')).toBeDisabled();
  });

  test(`${edition.locale} enhanced edition filters records on mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(edition.route);
    await expect(page.locator('[data-ed-country]')).toBeEnabled();
    await expect(page.locator('[data-ed-snapshot-election-id]')).toHaveCount(0);
    await page.locator('[data-ed-country]').selectOption('NG');
    const today = await page.evaluate(() => {
      const now = new Date();
      return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    });
    const upcomingNigeria = tracker.elections.filter((record) => record.countryCode === 'NG' && record.electionDate >= today).length;
    await expect(page.locator('[data-ed-list] .ed-entry')).toHaveCount(upcomingNigeria);
    await page.locator('[data-ed-upcoming]').uncheck();
    await expect(page.locator('[data-ed-list] .ed-entry')).toHaveCount(tracker.elections.filter((record) => record.countryCode === 'NG').length);
    await page.locator('[data-ed-country]').selectOption('SS');
    await expect(page.locator('[data-ed-list] .ed-entry-date time')).toHaveAttribute('datetime', '2026-12');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

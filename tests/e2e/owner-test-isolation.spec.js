const { test, expect } = require('@playwright/test');

test.describe('owner-suite analytics isolation', () => {
  test.skip(
    process.env.AFROTOOLS_TEST_DISABLE_ANALYTICS !== '1',
    'Only applies to category owner suites that explicitly disable analytics.'
  );

  test('keeps consent state deterministic without changing the production contract', async ({ page }) => {
    await page.goto('/tools/profit-margin/');

    await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools_cookie_consent')))
      .toBe('declined');
    await expect.poll(() => page.evaluate(() => window.__afroAnalyticsDisabledForOwnerTests))
      .toBe(true);
    await expect(page.locator('#afro-cookie-consent, #afro-cookie-banner')).toHaveCount(0);
  });
});

const { test, expect } = require('@playwright/test');
const { billingFixture } = require('../support/pro-billing-fixture');

for (const width of [320, 390, 1440]) {
  test('Billing displays provider truth at ' + width + 'px without payment writes', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    const writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
    });
    // This is display proof with synthetic active access, not live entitlement proof.
    await page.route('**/assets/js/afro-auth.js*', route => route.fulfill({ contentType: 'application/javascript', body:
      'window.AfroAuth = { getSessionToken: function(){ return null; }, getUser: function(){ return { id: "billing-fixture", tier: "pro" }; }, init: function(){ return Promise.resolve(); } };' }));
    await page.route('**/assets/js/pro-gate.js*', route => route.fulfill({ contentType: 'application/javascript', body:
      'window.addEventListener("DOMContentLoaded", function(){ document.body.classList.add("pro-active"); }); window.AfroProGate = { getStatus: async function(){ return { isPro: true }; } };' }));
    await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    let fixture = await billingFixture();
    await page.route('**/.netlify/functions/api-pro-billing', route => route.fulfill({
      status: fixture.statusCode, contentType: 'application/json', body: fixture.body
    }));
    await page.goto('/pro/settings/billing/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#planMetric')).toHaveText('pro');
    await expect(page.locator('#statusMetric')).toHaveText('unverified');
    await expect(page.locator('#renewalMetric')).toHaveText('Not set');
    await expect(page.getByRole('heading', { name: 'Billing', exact: true })).toBeVisible();

    fixture = await billingFixture({ providerKey: true, profile: {
      subscription_tier: 'pro', paystack_subscription_code: 'SUB_fixture', subscription_expires_at: '2020-01-01T00:00:00Z'
    }, subscription: { status: 'non-renewing', next_payment_date: '2027-01-15T00:00:00Z' } });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#statusMetric')).toHaveText('non-renewing');
    await expect(page.locator('#renewalMetric')).toHaveText('2027-01-15');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
    expect(writes).toEqual([]);
  });
}

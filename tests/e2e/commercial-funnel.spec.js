const { test, expect } = require('@playwright/test');

const API_OFFERS = ['api-growth', 'api-pro', 'api-enterprise'];

test('accounting pilot preserves campaign context through consent and retry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const utm = { utm_source: 'commercial-sweep', utm_medium: 'automation', utm_campaign: 'accounting-pilot', utm_content: 'mobile-hero' };
  const payloads = [];
  await page.route('**/api/b2b-enquiry', async route => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({ status: payloads.length === 1 ? 503 : 200, contentType: 'application/json', body: JSON.stringify(payloads.length === 1 ? { error: 'Synthetic retry required' } : { success: true }) });
  });
  await page.goto('/for-accountants/?' + new URLSearchParams(utm) + '&private_note=do-not-forward');
  const ctas = page.getByRole('link', { name: 'Request accounting pilot' });
  await expect(ctas).toHaveCount(2);
  for (const cta of await ctas.all()) {
    const url = new URL(await cta.getAttribute('href'), 'https://afrotools.com');
    for (const [key, value] of Object.entries(utm)) expect(url.searchParams.get(key)).toBe(value);
    expect(url.searchParams.get('source_route')).toBe('/for-accountants/');
    expect(url.searchParams.get('prospect_segment')).toBe('accounting');
    expect(url.searchParams.has('private_note')).toBe(false);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await ctas.first().click();
  await expect(page.locator('[name="requested_offer"]')).toHaveValue('widget_pro');
  await expect(page.locator('[name="prospect_type"]')).toHaveValue('accounting_firm');
  await page.locator('[name="company"]').fill('Synthetic Accounting');
  await page.locator('[name="name"]').fill('Synthetic Buyer');
  await page.locator('[data-b2b-enquiry-form] [name="email"]').fill('buyer@example.test');
  await page.locator('[name="relevant_tool"]').fill('Synthetic VAT widget');
  await page.locator('[name="message"]').fill('Synthetic pilot request for browser verification only.');
  const submit = page.locator('[data-b2b-enquiry-form] [type="submit"]');
  await submit.click();
  expect(payloads).toHaveLength(0);
  await page.locator('[data-b2b-enquiry-form] [name="consent"]').check();
  await submit.click();
  await expect(page.locator('[data-b2b-status]')).toHaveText('Synthetic retry required');
  await expect(submit).toBeEnabled();
  await expect(page.locator('[name="company"]')).toHaveValue('Synthetic Accounting');
  await submit.click();
  await expect(page.locator('[data-b2b-status]')).toContainText('Enquiry received');
  expect(payloads).toHaveLength(2);
  for (const payload of payloads) {
    expect(payload.consent).toBe(true);
    expect(payload.requested_offer).toBe('widget_pro');
    expect(payload.prospect_type).toBe('accounting_firm');
    expect(payload.source_route).toBe('/for-accountants/');
    expect(payload.cta_type).toBe('segment-page');
    expect(payload.referrer_url).not.toContain('?');
    for (const [key, value] of Object.entries(utm)) expect(payload[key]).toBe(value);
  }
  await expect(page.locator('[name="company"]')).toHaveValue('');
  await expect(page.locator('[data-b2b-enquiry-form] [name="consent"]')).not.toBeChecked();
  await expect(page.locator('[name="requested_offer"]')).toHaveValue('widget_pro');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

for (const offer of API_OFFERS) {
  test('business enquiry preserves ' + offer + ' buyer context', async ({ page }) => {
    const query = new URLSearchParams({
      offer,
      tool: offer,
      prospect: 'developer-api',
      source: 'developers',
      source_route: '/developers/',
      cta_type: 'developer-api-tier',
      utm_source: 'commercial-sweep',
      utm_medium: 'automation',
      utm_campaign: 'api-funnel',
      utm_content: offer
    });

    await page.goto('/business-enquiry/?' + query.toString(), { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[name="requested_offer"]')).toHaveValue('api_pilot');
    await expect(page.locator('[name="prospect_type"]')).toHaveValue('developer_api');
    await expect(page.locator('[name="relevant_tool"]')).toHaveValue(offer);
    await expect(page.locator('[name="source_path"]')).toHaveValue('developers');
    await expect(page.locator('[name="source_route"]')).toHaveValue('/developers/');
    await expect(page.locator('[name="cta_type"]')).toHaveValue('developer-api-tier');
    await expect(page.locator('[name="prospect_segment"]')).toHaveValue('developer-api');
    await expect(page.locator('[name="utm_source"]')).toHaveValue('commercial-sweep');
    await expect(page.locator('[name="utm_medium"]')).toHaveValue('automation');
    await expect(page.locator('[name="utm_campaign"]')).toHaveValue('api-funnel');
    await expect(page.locator('[name="utm_content"]')).toHaveValue(offer);
  });
}

test('developers paid tiers use qualified enquiry routes', async ({ page }) => {
  await page.goto('/developers/', { waitUntil: 'domcontentloaded' });

  for (const offer of API_OFFERS) {
    const cta = page.locator('a[href*="/business-enquiry/"][href*="offer=' + offer + '"]').first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    const url = new URL(href, 'https://afrotools.com');
    expect(url.searchParams.get('tool')).toBe(offer);
    expect(url.searchParams.get('prospect')).toBe('developer-api');
    expect(url.searchParams.get('source')).toBe('developers');
    expect(url.searchParams.get('source_route')).toBe('/developers/');
    expect(url.searchParams.get('cta_type')).toBe('developer-api-tier');
  }

  await expect(page.locator('a[href^="/contact/?subject=api-"]')).toHaveCount(0);
  await expect(page.locator('a[href^="mailto:api@afrotools.com"]')).toHaveCount(0);
});

test('Pro team alias preselects business subscription and keeps attribution', async ({ page }) => {
  const query = new URLSearchParams({
    offer: 'pro-workspace',
    prospect: 'other',
    prospect_segment: 'business-team',
    source: 'pro',
    source_route: '/pro/',
    cta_type: 'pro-team-rollout'
  });

  await page.goto('/business-enquiry/?' + query.toString(), { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[name="requested_offer"]')).toHaveValue('business_subscription');
  await expect(page.locator('[name="prospect_type"]')).toHaveValue('other');
  await expect(page.locator('[name="prospect_segment"]')).toHaveValue('business-team');
  await expect(page.locator('[name="source_route"]')).toHaveValue('/pro/');
  await expect(page.locator('[name="cta_type"]')).toHaveValue('pro-team-rollout');
});

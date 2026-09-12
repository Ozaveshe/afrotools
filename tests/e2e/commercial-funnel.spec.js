const { test, expect } = require('@playwright/test');

const API_OFFERS = ['api-growth', 'api-pro', 'api-enterprise'];

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

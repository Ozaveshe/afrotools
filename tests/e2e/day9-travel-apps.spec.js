const { expect, test } = require('@playwright/test');

const tools = [
  ['africa-flight', '.btn-calc', '#flightResults'],
  ['airbnb-vs-hotel', '.en-form-actions .en-btn', '#results'],
  ['airport-transfer', '.en-form-actions .en-btn', '#results'],
  ['beach-holiday-budget', '.en-form-actions .en-btn', '#results'],
  ['festival-travel-budget', '.en-form-actions .en-btn', '#results'],
  ['hotel-star-guide', '.en-form-actions .en-btn', '#results'],
  ['safari-cost', '.en-form-actions .en-btn', '#results'],
  ['travel-packing-list', '.en-form-actions .en-btn', '#results'],
  ['travel-vaccination-cost', '.en-form-actions .en-btn', '#results']
];

for (const [id, action, result] of tools) {
  test(`${id}: primary workflow, reset, privacy and reflow`, async ({ page }) => {
    const prohibited = [];
    await page.route(/google-analytics\.com|googlesyndication\.com|googletagmanager\.com/, route => route.abort());
    page.on('request', request => {
      if (/capture-lead|workspace|supabase|\/api\//i.test(request.url())) {
        prohibited.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`/tools/${id}/`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-day9-travel-boundary]')).toBeVisible();
    await expect(page.locator(action).first()).toBeVisible();
    await page.locator(action).first().click();
    await expect(page.locator(result)).toBeVisible();
    await expect(page.locator(result)).not.toContainText(/\b(?:NaN|undefined|null)\b/i);

    await expect(page.locator('[data-day9-reset]')).toBeVisible();
    await page.locator('[data-day9-reset]').click();
    const firstToolField = id === 'africa-flight'
      ? page.locator('#flightCountry')
      : page.locator('.en-tool-layout input, .en-tool-layout select, .en-tool-layout textarea').first();
    await expect(firstToolField).toBeFocused();

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(mobileOverflow).toBeFalsy();
    await page.setViewportSize({ width: 188, height: 812 });
    const reflowOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(reflowOverflow).toBeFalsy();
    expect(prohibited).toEqual([]);
  });
}

test('travel health rejects invalid input and emits verified-source brief', async ({ page }) => {
  await page.goto('/tools/travel-vaccination-cost/', { waitUntil: 'domcontentloaded' });
  await page.locator('#tripDays').fill('0');
  await page.locator('.en-form-actions .en-btn').first().click();
  await expect(page.locator('#totalCost')).toHaveText('Check trip details');
  await page.locator('#tripDays').fill('14');
  await page.locator('.en-form-actions .en-btn').first().click();
  await expect(page.locator('#totalCost')).toHaveText('Clinician review needed');
  await expect(page.locator('#vaccTable')).toContainText('WHO travel vaccine guidance');
  await expect(page.locator('#vaccTable')).toContainText('IATA Travel Centre requirements');
  await expect(page.locator('#vaccTable')).not.toContainText(/required|recommended vaccine|malaria prophylaxis/i);
});

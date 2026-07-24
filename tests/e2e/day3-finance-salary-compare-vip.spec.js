const { test, expect } = require('@playwright/test');

const routes = [
  ['/tools/salary-compare/', 'en'],
  ['/fr/tools/comparateur-salaires/', 'fr'],
  ['/sw/zana/kilinganisha-mishahara/', 'sw'],
];

async function enterOffer(page, side, values) {
  for (const [field, value] of Object.entries(values)) {
    const locator = page.locator(`#sc-${side}-${field}`);
    if (field === 'period') await locator.selectOption(value);
    else await locator.fill(String(value));
  }
}

for (const [route, lang] of routes) {
  test(`${lang} salary offer comparator is local, functional and mobile safe`, async ({ page }) => {
    const errors = [];
    const remotePayloads = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (/\.netlify\/functions|\/api\//i.test(request.url())) remotePayloads.push(request.url());
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('[data-salary-compare-app]')).toBeVisible();
    await expect(page.locator('#sc-results')).toBeHidden();
    await page.locator('#sc-currency').fill('KES');
    await enterOffer(page, 'a', { base: 100000, period: 'monthly', cash: 10000, bonus: 50000, noncash: 120000, employer: 60000, hours: 40, weeks: 52, source: 'Written offer A', date: '2026-07-20' });
    await enterOffer(page, 'b', { base: 1500000, period: 'annual', cash: 120000, bonus: 100000, noncash: 100000, employer: 90000, hours: 45, weeks: 50, source: 'Written offer B', date: '2026-07-20' });
    await page.locator('#sc-form button[type="submit"]').click();
    await expect(page.locator('#sc-results')).toBeVisible();
    const digits = async selector => Number((await page.locator(selector).textContent()).replace(/\D/g, ''));
    expect(await digits('[data-row="annual-gross"] [data-a]')).toBe(1370000);
    expect(await digits('[data-row="annual-gross"] [data-b]')).toBe(1720000);
    expect(await digits('[data-row="annual-package"] [data-a]')).toBe(1550000);
    expect(await digits('[data-row="annual-package"] [data-b]')).toBe(1910000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.locator('#sc-a-base').fill('100001');
    await expect(page.locator('#sc-results')).toBeHidden();
    await expect(page.locator('#sc-csv')).toBeDisabled();
    expect(remotePayloads).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('invalid evidence fails closed and PDF receives nine comparison rows', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/tools/salary-compare/');
  await page.locator('#sc-currency').fill('KES');
  await enterOffer(page, 'a', { base: 100000, period: 'monthly', cash: 0, bonus: 0, noncash: 0, employer: 0, hours: 40, weeks: 52, source: 'Offer A', date: '2099-01-01' });
  await enterOffer(page, 'b', { base: 120000, period: 'monthly', cash: 0, bonus: 0, noncash: 0, employer: 0, hours: 40, weeks: 52, source: 'Offer B', date: '2026-07-20' });
  await page.locator('#sc-form button[type="submit"]').click();
  await expect(page.locator('#sc-results')).toBeHidden();
  await expect(page.locator('#sc-error')).not.toBeEmpty();
  await page.locator('#sc-a-date').fill('2026-07-20');
  await page.evaluate(() => {
    window.__pdfPayload = null;
    window.AfroTools = window.AfroTools || {};
    window.AfroTools.pdf = { generate: async payload => { window.__pdfPayload = payload; } };
  });
  await page.locator('#sc-form button[type="submit"]').click();
  await page.locator('#sc-pdf').click();
  const payload = await page.evaluate(() => window.__pdfPayload);
  expect(payload.noGate).toBe(true);
  expect(payload.sections[0].rows).toHaveLength(9);
});

test('dark mode and 200 percent zoom remain usable at narrow width', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/salary-compare/');
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('#sc-form button[type="submit"]')).toBeVisible();
  await page.screenshot({ path: 'test-results/salary-compare-dark-320-zoom200.png', fullPage: true });
});

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const routes = [
  ['/tools/side-hustle-tax/', 'en'],
  ['/fr/tools/impot-activite-secondaire/', 'fr']
];

async function fillPlan(page) {
  const values = {
    '#sir-currency': 'KES',
    '#sir-jurisdiction': 'Kenya',
    '#sir-period': '2026 year of income',
    '#sir-gross': '1000000',
    '#sir-refunds': '50000',
    '#sir-platform-fees': '100000',
    '#sir-expenses': '150000',
    '#sir-credits': '20000',
    '#sir-rate': '20',
    '#sir-instalments': '4',
    '#sir-source': 'Official notice reviewed by me',
    '#sir-date': '2026-07-20'
  };
  for (const [selector, value] of Object.entries(values)) await page.fill(selector, value);
}

for (const [route, locale] of routes) {
  test(`${locale} side-income reserve is exact, private and mobile-safe`, async ({ page }) => {
    const errors = [];
    const nonGet = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') nonGet.push(request.url()); });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    expect((await page.title()).length).toBeLessThanOrEqual(60);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description.length).toBeGreaterThanOrEqual(100);
    expect(description.length).toBeLessThanOrEqual(160);
    await expect(page.locator('[data-side-income-reserve]')).toBeVisible();
    await fillPlan(page);
    await page.click('#sir-form button[type="submit"]');
    await expect(page.locator('#sir-results')).toBeVisible();
    await expect(page.locator('#sir-profit')).toContainText(/700[,\s.]?000/);
    await expect(page.locator('#sir-reserve')).toContainText(/120[,\s.]?000/);
    await expect(page.locator('#sir-instalment')).toContainText(/30[,\s.]?000/);
    await expect(page.locator('#sir-cash')).toContainText(/580[,\s.]?000/);
    await expect(page.locator('#sir-cost-ratio')).toHaveText('30.00%');
    await expect(page.locator('#sir-reserve-ratio')).toHaveText('12.00%');
    expect(await page.locator('#sir-form input').evaluateAll(nodes => nodes.every(node => node.labels && node.labels.length === 1))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /tax|income|revenue|reserve|credit/i.test(key)))).toEqual([]);
    await page.fill('#sir-expenses', '150001');
    await expect(page.locator('#sir-results')).toBeHidden();
    expect(await page.locator('[data-sir-result-action]').evaluateAll(buttons => buttons.every(button => button.disabled))).toBe(true);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('side-income reserve fails closed and creates local CSV, JSON and PDF contracts', async ({ page }) => {
  await page.goto('/tools/side-hustle-tax/', { waitUntil: 'domcontentloaded' });
  await fillPlan(page);
  await page.fill('#sir-date', '2025-01-01');
  await page.click('#sir-form button[type="submit"]');
  await expect(page.locator('#sir-error')).toContainText('365 days');
  await page.fill('#sir-date', '2099-01-01');
  await page.click('#sir-form button[type="submit"]');
  await expect(page.locator('#sir-error')).toContainText('365 days');
  await page.fill('#sir-date', '2026-07-20');
  await page.fill('#sir-refunds', '1000001');
  await page.click('#sir-form button[type="submit"]');
  await expect(page.locator('#sir-error')).toContainText('cannot exceed gross revenue');
  await page.fill('#sir-refunds', '50000');
  await page.click('#sir-form button[type="submit"]');

  const csvDownload = page.waitForEvent('download');
  await page.click('#sir-csv');
  const csv = await csvDownload;
  expect(csv.suggestedFilename()).toBe('side-income-tax-reserve.csv');
  const csvText = fs.readFileSync(await csv.path(), 'utf8');
  expect(csvText).toContain('120000');
  expect(csvText).toContain('Official notice reviewed by me');

  const jsonDownload = page.waitForEvent('download');
  await page.click('#sir-json');
  const json = await jsonDownload;
  expect(json.suggestedFilename()).toBe('side-income-tax-reserve.json');
  const payload = JSON.parse(fs.readFileSync(await json.path(), 'utf8'));
  expect(payload.privacy).toContain('Private');
  expect(payload.plan.reserveAfterCredits).toBe(120000);

  await page.evaluate(() => {
    window.AfroTools = window.AfroTools || {};
    window.AfroTools.pdf = { generate: options => { window.__sideIncomePdf = options; return Promise.resolve(); } };
  });
  await page.click('#sir-pdf');
  const pdf = await page.evaluate(() => window.__sideIncomePdf);
  expect(pdf.toolId).toBe('side-hustle-tax');
  expect(pdf.noGate).toBe(true);
  expect(pdf.skipGate).toBe(true);
  expect(pdf.sections[0].rows).toHaveLength(8);
  expect(pdf.source).toContain('Official notice reviewed by me');
  expect(pdf.disclaimer).toMatch(/planning|worksheet/i);
});

test('side-income reserve survives dark, reduced-motion and 200% text-equivalent layout', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/side-hustle-tax/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.fontSize = '200%';
  });
  await fillPlan(page);
  await page.click('#sir-form button[type="submit"]');
  await expect(page.locator('#sir-results')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  const output = path.resolve('artifacts/side-income-tax-reserve-dark-320-zoom200-equivalent.png');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output, fullPage: true });
});

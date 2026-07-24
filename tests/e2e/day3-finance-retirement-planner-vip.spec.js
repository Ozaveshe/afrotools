const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const routes = [
  ['/tools/retirement-planner/', 'en'],
  ['/fr/tools/planificateur-retraite/', 'fr'],
  ['/sw/zana/mpango-wa-kustaafu-mapema/', 'sw']
];

async function fillScenario(page) {
  const values = {
    '#rp-currency': 'KES',
    '#rp-current-age': '35',
    '#rp-target-age': '60',
    '#rp-balance': '1000000',
    '#rp-contribution': '10000',
    '#rp-spending': '600000',
    '#rp-other-income': '120000',
    '#rp-real-return': '0',
    '#rp-withdrawal': '4',
    '#rp-source': 'My adviser review notes',
    '#rp-date': '2026-07-20'
  };
  for (const [selector, value] of Object.entries(values)) await page.fill(selector, value);
}

for (const [route, locale] of routes) {
  test(`${locale} retirement scenario is exact, private and mobile-safe`, async ({ page }) => {
    const errors = [];
    const nonGet = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') nonGet.push(request.url()); });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('[data-retirement-planner]')).toBeVisible();
    await fillScenario(page);
    await page.click('#rp-form button[type="submit"]');
    await expect(page.locator('#rp-results')).toBeVisible();
    await expect(page.locator('#rp-target')).toContainText(/12[,\s.]?000[,\s.]?000/);
    await expect(page.locator('#rp-projected')).toContainText(/4[,\s.]?000[,\s.]?000/);
    await expect(page.locator('#rp-gap')).toContainText(/-8[,\s.]?000[,\s.]?000/);
    await expect(page.locator('#rp-required')).toContainText(/36[,\s.]?666[,.]67/);
    await expect(page.locator('#rp-capacity')).toContainText(/280[,\s.]?000/);
    expect(await page.locator('#rp-form input').evaluateAll(nodes => nodes.every(node => node.labels && node.labels.length === 1))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /retire|balance|contribution|scenario/i.test(key)))).toEqual([]);

    await page.fill('#rp-contribution', '10001');
    await expect(page.locator('#rp-results')).toBeHidden();
    expect(await page.locator('[data-rp-result-action]').evaluateAll(buttons => buttons.every(button => button.disabled))).toBe(true);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('retirement scenario fails closed and creates local CSV, JSON and PDF contracts', async ({ page }) => {
  await page.goto('/tools/retirement-planner/', { waitUntil: 'domcontentloaded' });
  await fillScenario(page);
  await page.fill('#rp-date', '2025-01-01');
  await page.click('#rp-form button[type="submit"]');
  await expect(page.locator('#rp-error')).toContainText('365 days');
  await page.fill('#rp-date', '2099-01-01');
  await page.click('#rp-form button[type="submit"]');
  await expect(page.locator('#rp-error')).toContainText('365 days');
  await page.fill('#rp-date', '2026-07-20');
  await page.fill('#rp-target-age', '35');
  await page.click('#rp-form button[type="submit"]');
  await expect(page.locator('#rp-error')).toContainText('later');
  await page.fill('#rp-target-age', '60');
  await page.click('#rp-form button[type="submit"]');

  const csvDownload = page.waitForEvent('download');
  await page.click('#rp-csv');
  const csv = await csvDownload;
  expect(csv.suggestedFilename()).toBe('retirement-scenario.csv');
  const csvText = fs.readFileSync(await csv.path(), 'utf8');
  expect(csvText).toContain('12000000');
  expect(csvText).toContain('My adviser review notes');

  const jsonDownload = page.waitForEvent('download');
  await page.click('#rp-json');
  const json = await jsonDownload;
  expect(json.suggestedFilename()).toBe('retirement-scenario.json');
  const payload = JSON.parse(fs.readFileSync(await json.path(), 'utf8'));
  expect(payload.privacy).toContain('Private');
  expect(payload.scenario.targetFund).toBe(12000000);

  await page.evaluate(() => {
    window.AfroTools = window.AfroTools || {};
    window.AfroTools.pdf = { generate: options => { window.__retirementPdf = options; return Promise.resolve(); } };
  });
  await page.click('#rp-pdf');
  const pdf = await page.evaluate(() => window.__retirementPdf);
  expect(pdf.toolId).toBe('retirement-planner');
  expect(pdf.noGate).toBe(true);
  expect(pdf.skipGate).toBe(true);
  expect(pdf.sections[0].rows).toHaveLength(7);
  expect(pdf.source).toContain('My adviser review notes');
  expect(pdf.disclaimer).toMatch(/scenario|planning/i);
});

test('retirement scenario survives dark, reduced-motion and 200% text-equivalent layout', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/retirement-planner/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.fontSize = '200%';
  });
  await fillScenario(page);
  await page.click('#rp-form button[type="submit"]');
  await expect(page.locator('#rp-results')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  const output = path.resolve('test-results/retirement-planner-dark-320-zoom200-equivalent.png');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output, fullPage: true });
});

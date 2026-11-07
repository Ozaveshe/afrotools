const { test, expect } = require('@playwright/test');

const route = '/tools/electricity-tariff/';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { window.__AFROTOOLS_ELECTRICITY_AS_OF__ = '2026-11-07'; });
});

test('current provider workflow calculates both directions and shows source freshness', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route);
  await page.waitForFunction(() => window.AFROTOOLS_ELECTRICITY_READY === true);

  await expect(page.getByRole('heading', { name: 'Electricity Cost & Prepaid Units', level: 1 })).toBeVisible();
  await expect(page.locator('#electricityCountry')).toHaveValue('UG');
  await expect(page.locator('#electricityProvider')).toContainText('UEDCL');
  await expect(page.locator('#electricityTariff')).toContainText('Domestic standard');
  await page.getByRole('button', { name: 'Calculate electricity estimate' }).click();
  await expect(page.locator('#electricityPrimary')).toContainText('6.56 kWh');
  await expect(page.locator('#electricityFreshness')).toContainText('verified 2026-11-07');
  await expect(page.getByRole('link', { name: /Open Electricity Regulatory Authority/ })).toBeVisible();

  await page.getByLabel('Units → bill').check();
  await page.locator('#electricityTariff').selectOption('ug-uedcl-domestic-lifeline-q4-2026');
  await page.locator('#electricityAmount').fill('30');
  await page.getByRole('button', { name: 'Calculate electricity estimate' }).click();
  await expect(page.locator('#electricityPrimary')).toContainText('22,185');
  expect(errors).toEqual([]);
});

test('unsupported country fails closed and custom rate stays local', async ({ page }) => {
  await page.goto(route);
  await page.waitForFunction(() => window.AFROTOOLS_ELECTRICITY_READY === true);
  await page.locator('#electricityCountry').selectOption('GH');
  await expect(page.locator('#electricityStatus')).toContainText('No current provider-and-class tariff');
  await expect(page.locator('#electricityCustom')).toBeVisible();
  await page.locator('#electricityCustomCurrency').selectOption('GHS');
  await page.locator('#electricityCustomRate').fill('2.5');
  await page.locator('#electricityCustomFixed').fill('10');
  await page.locator('#electricityCustomTax').fill('10');
  await page.locator('#electricityAmount').fill('66');
  await page.getByRole('button', { name: 'Calculate electricity estimate' }).click();
  await expect(page.locator('#electricityPrimary')).toContainText('20 kWh');
  await expect(page.locator('#electricityBreakdown')).toContainText('User-entered tax or levy');
  await expect(page.locator('#electricitySourceTitle')).toHaveText('Custom-rate mode');
  const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
  expect(storage.local.filter((key) => /electric|tariff|rate/i.test(key))).toEqual([]);
  expect(storage.session.filter((key) => /electric|tariff|rate/i.test(key))).toEqual([]);
});

test('expired records show the exact stale state instead of an automatic result', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => { window.__AFROTOOLS_ELECTRICITY_AS_OF__ = '2027-01-01'; });
  const page = await context.newPage();
  await page.goto(route);
  await page.waitForFunction(() => window.AFROTOOLS_ELECTRICITY_READY === true);
  await expect(page.locator('#electricityStatus')).toContainText('This tariff is no longer current enough for an automatic estimate.');
  await expect(page.locator('#electricityCustom')).toBeVisible();
  await context.close();
});

test('360px layout, labels, live result and keyboard flow remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(route);
  await page.waitForFunction(() => window.AFROTOOLS_ELECTRICITY_READY === true);
  await page.locator('#electricityCountry').focus();
  await expect(page.locator('#electricityCountry')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#electricityTariff')).toBeFocused();
  await page.getByRole('button', { name: 'Calculate electricity estimate' }).click();
  await expect(page.locator('#electricityResult[aria-live="polite"]')).toBeVisible();
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  for (const id of ['electricityCountry', 'electricityProvider', 'electricityTariff', 'electricityAmount']) {
    await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
  }
});

for (const locale of [
  { name: 'French', route: '/fr/tools/tarifs-electricite/', heading: 'Calculateur de tarifs d’électricité' },
  { name: 'Swahili', route: '/sw/zana/kikokotoo-tariff-ya-umeme/', heading: 'Gharama ya Umeme na Unit za Kulipia Kabla' }
]) {
  test(`${locale.name} equivalent uses the maintained tariff dataset and engine`, async ({ page }) => {
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(locale.route);
    await page.waitForFunction(() => window.AFROTOOLS_ELECTRICITY_READY === true);
    await expect(page.getByRole('heading', { name: locale.heading, level: 1 })).toBeVisible();
    await expect(page.locator('#electricityCountry')).toHaveValue('UG');
    await page.locator('.electricity-button').click();
    await expect(page.locator('#electricityPrimary')).toContainText('6.56 kWh');
    await expect(page.locator('#electricityFreshness')).toContainText('2026-11-07');
    await expect(page.locator('#electricitySource')).toHaveAttribute('href', /era\.go\.ug/);
    expect(errors).toEqual([]);
  });
}


test('Uganda monthly context supports repeat purchases and hides irrelevant controls', async ({ page }) => {
  await page.goto(route);
  await page.waitForFunction(() => window.AFROTOOLS_ELECTRICITY_READY === true);
  await page.locator('#electricityPreviousUnits').fill('80');
  await page.locator('#electricityServiceMonths').fill('0');
  await page.locator('#electricityAmount').fill('4861.6');
  await page.getByRole('button', { name: 'Calculate electricity estimate' }).click();
  await expect(page.locator('#electricityPrimary')).toContainText('10 kWh');
  await expect(page.locator('#electricityBreakdown')).toContainText('741.6');
  await page.locator('#electricityServiceMonths').fill('-1');
  await expect(page.locator('#electricityResult')).toBeHidden();
  await page.getByRole('button', { name: 'Calculate electricity estimate' }).click();
  await expect(page.locator('#electricityStatus')).toContainText('non-negative whole number');
  await page.getByLabel('Units → bill').check();
  await expect(page.locator('#electricityPreviousUnits')).toBeHidden();
  await page.locator('#electricityCountry').selectOption('TZ');
  await expect(page.locator('#electricityUgandaFields')).toBeHidden();
  await page.locator('#electricityAmount').fill('100');
  await page.getByRole('button', { name: 'Calculate electricity estimate' }).click();
  await expect(page.locator('#electricityPrimary')).toContainText('16,250');
});

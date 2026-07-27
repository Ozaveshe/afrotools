const { test, expect } = require('@playwright/test');
const fs = require('fs');

const rebuilt = [
  'stamp-duty', 'rental-yield', 'home-renovation-cost', 'land-title-check',
  'property-valuation', 'rent-affordability', 'tenant-screening', 'rental-agreement',
  'property-mgmt-fees', 'building-materials', 'construction-budget', 'dev-feasibility',
  'survey-cost', 'property-cgt', 'service-charge', 'short-let-calc', 'agent-commission',
  'plot-converter', 'building-permit', 'diaspora-property', 'offplan-vs-ready'
];

async function expectNoOverflow(page) {
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }));
  expect(widths.document).toBe(widths.viewport);
}

async function fill(page, values) {
  for (const [name, value] of Object.entries(values)) {
    await page.locator(`[name="${name}"]`).fill(String(value));
  }
}

async function execute(page, tool) {
  const output = page.locator('[data-result]');
  if (['land-title-check', 'tenant-screening', 'building-permit'].includes(tool)) {
    await page.locator('input[type=checkbox]').first().check();
    await page.getByRole('button', { name: 'Review checklist' }).click();
    await expect(output).toContainText('1 item(s) marked');
  } else if (tool === 'stamp-duty') {
    await fill(page, { currency: 'NGN', value: 10000, rate: 2, fixed: 50 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('250');
  } else if (tool === 'rental-yield') {
    await fill(page, { currency: 'KES', value: 100000, rent: 1000, costs: 2000 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('10%');
  } else if (['home-renovation-cost', 'building-materials', 'construction-budget', 'survey-cost'].includes(tool)) {
    await fill(page, { currency: 'GHS', quantity: 10, unitCost: 20, fixed: 50, contingency: 10 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('275');
  } else if (tool === 'property-valuation') {
    await fill(page, { currency: 'ZAR', area: 100, comparable: 1000, adjustment: 10 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('110,000');
  } else if (tool === 'rent-affordability') {
    await fill(page, { currency: 'USD', income: 1000, rent: 250, ratio: 30, advance: 3 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('300');
  } else if (tool === 'rental-agreement') {
    await fill(page, { currency: 'KES', landlord: 'Synthetic Landlord', tenant: 'Synthetic Tenant', address: '1 Test Street', start: '2026-08-01', duration: 12, rent: 1000, deposit: 500 });
    await page.getByRole('button', { name: 'Build review draft' }).click();
    await expect(output).toContainText('REVIEW DRAFT');
    await expect(output).toBeFocused();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT review draft' }).click();
    const download = await downloadPromise;
    const file = await download.path();
    const text = fs.readFileSync(file, 'utf8');
    expect(text).toContain('Synthetic Landlord');
    expect(text).toContain('NOT LEGAL ADVICE');
  } else if (tool === 'property-mgmt-fees') {
    await fill(page, { currency: 'NGN', rent: 1000, rate: 10, fixed: 50 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('150');
  } else if (tool === 'dev-feasibility') {
    await fill(page, { currency: 'USD', revenue: 1000, land: 100, build: 200, professional: 50, finance: 25, other: 25 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('600');
  } else if (tool === 'property-cgt') {
    await fill(page, { currency: 'USD', sale: 1000, basis: 500, costs: 100, exemption: 100, rate: 10 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('30');
  } else if (tool === 'service-charge') {
    await fill(page, { currency: 'USD', annual: 1000, units: 10, reserve: 10 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('110');
  } else if (tool === 'short-let-calc') {
    await fill(page, { currency: 'USD', nightly: 100, nights: 100, expenses: 2000 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('8,000');
  } else if (tool === 'agent-commission') {
    await fill(page, { currency: 'USD', value: 10000, rate: 5, tax: 10 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('550');
  } else if (tool === 'plot-converter') {
    await fill(page, { value: 1 });
    await page.locator('[name=from]').selectOption('hectare');
    await page.locator('[name=to]').selectOption('sqm');
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('10,000');
  } else if (tool === 'diaspora-property') {
    await fill(page, { currency: 'NGN', budget: 1000, fx: 10, price: 8000, costs: 1000 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('1,000');
  } else if (tool === 'offplan-vs-ready') {
    await fill(page, { currency: 'USD', ready: 10000, offplan: 8000, carrying: 500, delay: 5, rent: 100 });
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(output).toContainText('-1,000');
  }
  if (tool !== 'rental-agreement') await expect(output).toBeFocused();
}

test('Mortgage & Property hub keeps legal scope honest and routes locally', async ({ page }) => {
  const writes = [];
  page.on('request', request => {
    if (request.method() !== 'GET') writes.push(request.postData() || '');
  });
  await page.setViewportSize({ width: 320, height: 840 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/mortgage-property/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Show recommended route' }).click();
  await expect(page.getByRole('status')).toContainText('Choose a decision');
  await expect(page.locator('#property-need')).toBeFocused();
  await page.locator('#property-need').selectOption('title');
  await page.getByRole('button', { name: 'Show recommended route' }).click();
  await expect(page.locator('#property-route-link')).toHaveAttribute('href', '/tools/land-title-check/');
  await expect(page.locator('body')).toContainText('67 English legal rows');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('#property-route')).toBeHidden();
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.fontSize = '200%';
  });
  await expectNoOverflow(page);
  expect(writes.every(body => body === '')).toBe(true);
});

for (const tool of rebuilt) {
  test(`${tool} executes deterministic input-only workflow`, async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', request => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: tool.length % 2 ? 320 : 375, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(`/tools/${tool}/`, { waitUntil: 'domcontentloaded' });
    const action = ['land-title-check', 'tenant-screening', 'building-permit'].includes(tool)
      ? 'Review checklist'
      : tool === 'rental-agreement' ? 'Build review draft' : 'Calculate from my inputs';
    await page.getByRole('button', { name: action }).click();
    if (action === 'Review checklist') {
      await expect(page.locator('[data-result]')).toContainText('0 item(s) marked');
    } else {
      await expect(page.locator('[data-result]')).toHaveText('');
    }
    await execute(page, tool);
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('[data-result]')).toHaveText('');
    await expect(page.locator('form input, form select, form textarea').first()).toBeFocused();
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.fontSize = '200%';
    });
    await expectNoOverflow(page);
    expect(writes.every(body => body === '')).toBe(true);
    expect(errors).toEqual([]);
  });
}

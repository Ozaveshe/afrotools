const fs = require('fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

const routes = [
  { path: '/tools/rent-vs-buy/', lang: 'en', width: 320, scheme: 'dark', heading: 'Compare the cash flows' },
  { path: '/fr/tools/louer-vs-acheter/', lang: 'fr', width: 375, scheme: 'light', heading: 'Comparez uniquement' },
  { path: '/sw/zana/kukodi-dhidi-ya-kununua/', lang: 'sw', width: 768, scheme: 'dark', heading: 'Linganisha fedha' }
];

for (const route of routes) {
  test(`${route.lang} rent-buy worksheet is equal-horizon and private`, async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.postData() || ''); });
    await page.setViewportSize({ width: route.width, height: 840 });
    await page.emulateMedia({ colorScheme: route.scheme, reducedMotion: 'reduce' });
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', route.lang);
    await expect(page.locator('h1')).toContainText(route.heading);
    await page.fill('#rvb-months', '60');
    await page.fill('#rvb-rent-upfront', '600000');
    await page.fill('#rvb-rent-housing', '250000');
    await page.fill('#rvb-rent-other-monthly', '20000');
    await page.fill('#rvb-rent-oneoff', '100000');
    await page.fill('#rvb-rent-final', '300000');
    await page.fill('#rvb-buy-upfront', '3000000');
    await page.fill('#rvb-buy-housing', '350000');
    await page.fill('#rvb-buy-other-monthly', '50000');
    await page.fill('#rvb-buy-oneoff', '500000');
    await page.fill('#rvb-buy-final', '10000000');
    await page.click('#rvb-form button[type=submit]');
    await expect(page.locator('#rvb-rent-net')).toContainText(/16.?600.?000/);
    await expect(page.locator('#rvb-buy-net')).toContainText(/17.?500.?000/);
    await expect(page.locator('#rvb-gap')).toContainText(/900.?000/);
    await expect(page.locator('#rvb-horizon')).toContainText(/60/);
    expect(await page.locator('.rvb-field input').evaluateAll(inputs => inputs.every(input => input.labels && input.labels.length))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    expect(writes.join('')).not.toContain('350000');
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /rent|buy|property|mortgage/i.test(key)))).toEqual([]);
    expect(await page.locator('body').innerText()).not.toMatch(/buy if|should buy|should rent|price.?to.?rent|AI advisor/i);
    expect(errors).toEqual([]);
  });
}

test('rent-buy JSON and PDF preserve scenario boundary', async ({ page }) => {
  await page.goto('/tools/rent-vs-buy/', { waitUntil: 'domcontentloaded' });
  const jsonPromise = page.waitForEvent('download');
  await page.click('#rvb-json');
  const json = JSON.parse(fs.readFileSync(await (await jsonPromise).path(), 'utf8'));
  expect(json.results.rentNetCashCost).toBe(16500000);
  expect(json.results.buyNetCashCost).toBe(17500000);
  expect(json.definitions.excludedAssumptions).toContain('No appreciation');
  expect(json.definitions.decisionBoundary).toContain('not a recommendation');
  const pdfPromise = page.waitForEvent('download');
  await page.click('#rvb-pdf');
  const pdf = await pdfParse(fs.readFileSync(await (await pdfPromise).path()));
  expect(pdf.text).toContain('Rent vs Buy Entered Scenario');
  expect(pdf.text).toContain('METHOD BOUNDARY');
  expect(pdf.text).not.toContain('LEGAL BASIS');
});

test('capture clean 320 dark rent-buy artifact', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 840 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/rent-vs-buy/', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: 'afro-navbar{display:none!important}.rvb-skip{display:none!important}' });
  await page.screenshot({ path: 'artifacts/rent-vs-buy-vip-320-dark.png', fullPage: true });
});

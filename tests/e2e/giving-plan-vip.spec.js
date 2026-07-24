const fs = require('fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

const routes = [
  { path: '/tools/tithe-calculator/', lang: 'en', width: 320, scheme: 'dark', heading: 'Plan giving without' },
  { path: '/fr/tools/calculateur-dime/', lang: 'fr', width: 375, scheme: 'light', heading: 'Planifiez un don' },
  { path: '/sw/zana/kikokotoo-fungu-la-kumi-na-sadaka/', lang: 'sw', width: 768, scheme: 'dark', heading: 'Panga utoaji' }
];

for (const route of routes) {
  test(`${route.lang} canonical giving planner is neutral and private`, async ({ page }) => {
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
    await page.fill('#gp-reference', '500000');
    await page.fill('#gp-rate', '8');
    await page.fill('#gp-offering', '10000');
    await page.fill('#gp-pledge', '120000');
    await page.fill('#gp-periods', '6');
    await page.fill('#gp-essentials', '300000');
    await page.click('#gp-form button[type=submit]');
    await expect(page.locator('#gp-percentage')).toContainText(/40.?000/);
    await expect(page.locator('#gp-pledge-result')).toContainText(/20.?000/);
    await expect(page.locator('#gp-total')).toContainText(/70.?000/);
    await expect(page.locator('#gp-remaining')).toContainText(/130.?000/);
    await expect(page.locator('#gp-share')).toContainText(/14[,.]00/);
    expect(await page.locator('.gp-field input').evaluateAll(inputs => inputs.every(input => input.labels && input.labels.length))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    expect(writes.join('')).not.toContain('500000');
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /tithe|offering|giving|pledge/i.test(key)))).toEqual([]);
    expect(await page.locator('body').innerText()).not.toMatch(/required rate is 10%|must tithe|will prosper|guaranteed blessing|automatically tax deductible|AI advisor/i);
    expect(errors).toEqual([]);
  });
}

test('giving-plan JSON and PDF preserve faith and claim boundaries', async ({ page }) => {
  await page.goto('/tools/tithe-calculator/', { waitUntil: 'domcontentloaded' });
  await page.fill('#gp-rate', '8');
  await page.click('#gp-form button[type=submit]');
  const jsonPromise = page.waitForEvent('download');
  await page.click('#gp-json');
  const json = JSON.parse(fs.readFileSync(await (await jsonPromise).path(), 'utf8'));
  expect(json.results.plannedContribution).toBe(70000);
  expect(json.definitions.faithBoundary).toContain('No percentage');
  expect(json.definitions.claimBoundary).toContain('No prosperity');
  const pdfPromise = page.waitForEvent('download');
  await page.click('#gp-pdf');
  const pdf = await pdfParse(fs.readFileSync(await (await pdfPromise).path()));
  expect(pdf.text).toContain('Private Giving Plan');
  expect(pdf.text).toContain('FAITH AND CLAIM BOUNDARY');
  expect(pdf.text).not.toContain('LEGAL BASIS');
});

test('legacy calculator aliases hand off to canonical owners', async ({ page }) => {
  await page.goto('/tools/tithe-offering-calculator/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/tools\/tithe-calculator\/$/);
  await page.goto('/fr/tools/calculateur-offrande/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/fr\/tools\/calculateur-dime\/$/);
  const englishAlias = fs.readFileSync('tools/tithe-offering-calculator/index.html', 'utf8');
  const frenchAlias = fs.readFileSync('fr/tools/calculateur-offrande/index.html', 'utf8');
  expect(englishAlias).toContain('noindex,follow');
  expect(englishAlias).toContain('https://afrotools.com/tools/tithe-calculator/');
  expect(frenchAlias).toContain('noindex,follow');
  expect(frenchAlias).toContain('https://afrotools.com/fr/tools/calculateur-dime/');
});

test('capture clean 320 dark giving-plan artifact', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 840 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/tithe-calculator/', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: 'afro-navbar{display:none!important}.gp-skip{display:none!important}' });
  await page.screenshot({ path: 'artifacts/giving-plan-vip-320-dark.png', fullPage: true });
});

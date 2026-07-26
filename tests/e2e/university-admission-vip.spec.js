const { test, expect } = require('@playwright/test');
const path = require('node:path');

const route = '/tools/university-admission/';

test.beforeEach(async ({ page }) => {
  await page.goto(route);
});

test('uses self-hosted typography and exposes no admission verdict calculator', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.reload();
  await expect(page.locator('body')).toHaveCSS('font-family', /DM Sans/);
  expect(await page.locator('link[href*="fonts.googleapis.com"]').count()).toBe(0);
  expect(await page.locator('main').innerText()).not.toMatch(/On track|Needs work|admission chance|likely admission/i);
  await expect(page.getByText('No admission prediction:', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Admission system', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('renders each country route with official sources and a fresh checklist', async ({ page }) => {
  const cases = [
    ['nigeria', 'Nigeria admission route', /JAMB IBASS eligibility checker/],
    ['kenya', 'Kenya admission route', /KUCCPS programme search/],
    ['southafrica', 'South Africa admission route', /Department of Basic Education/],
    ['ghana', 'Ghana admission route', /GTEC recognition notices/],
    ['zimbabwe', 'Zimbabwe admission route', /ZIMCHE higher education institutions/]
  ];
  for (const [country, title, source] of cases) {
    await page.locator('#countrySelect').selectOption(country);
    await expect(page.locator('#route-title')).toHaveText(title);
    await expect(page.locator('#officialLinks')).toContainText(source);
    await expect(page.locator('[data-check]')).toHaveCount(6);
    await expect(page.locator(`[data-country="${country}"]`)).toHaveAttribute('aria-pressed', 'true');
  }
});

test('exports a source-linked checklist without an eligibility result', async ({ page }) => {
  await page.locator('#countrySelect').selectOption('ghana');
  await page.locator('[data-check]').first().check();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TXT' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('ghana-university-admission-verification.txt');
  const stream = await download.createReadStream();
  let content = '';
  for await (const chunk of stream) content += chunk.toString();
  expect(content).toContain('[x] Institution and programme recognition investigated');
  expect(content).toContain('https://gtec.edu.gh/');
  expect(content).toContain('not an eligibility result or admission prediction');
});

test('is accessible at 320px and print/PDF works', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  let printed = false;
  await page.exposeFunction('recordPrint', () => { printed = true; });
  await page.evaluate(() => { window.print = () => window.recordPrint(); });
  await page.getByRole('button', { name: 'Print / save PDF' }).click();
  expect(printed).toBe(true);
  const pdf = await page.pdf({ format: 'A4' });
  expect(pdf.length).toBeGreaterThan(1000);
});

test('captures desktop, mobile dark and 200 percent text proof', async ({ page }) => {
  const artifact = name => path.join(process.cwd(), 'artifacts', 'day5-university-admission-vip', name);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: artifact('desktop-light.png'), fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: artifact('mobile-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 750, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: artifact('text-200-dark.png'), fullPage: true });
});

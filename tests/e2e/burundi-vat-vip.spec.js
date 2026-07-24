const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const routes = [
  ['/burundi/bi-vat', 'Burundi VAT calculator'],
  ['/fr/burundi/calculateur-tva', 'Calculateur TVA Burundi'],
  ['/sw/burundi/kikokotoo-vat/', 'Kikokotoo cha VAT Burundi']
];

for (const [route, title] of routes) {
  test(`${route} is native, functional and mobile-safe`, async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    await expect(page.locator('h1')).toHaveText(title);
    await page.locator('#bivForm').evaluate(form => form.requestSubmit());
    await expect(page.locator('#bivVat')).toContainText('18');
    await expect(page.locator('#bivResult')).toHaveClass(/on/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
}

test('special treatments fail closed and exact evidence selection unlocks them', async ({ page }) => {
  await page.goto('/burundi/bi-vat');
  await page.selectOption('#bivRate', 'confirmed-intermediate-ten');
  await page.locator('#bivForm').evaluate(form => form.requestSubmit());
  await expect(page.locator('#bivError')).not.toBeEmpty();
  await page.check('#bivEvidence');
  await page.locator('#bivForm').evaluate(form => form.requestSubmit());
  await expect(page.locator('#bivVat')).toContainText('10');
  await page.selectOption('#bivRate', 'confirmed-zero');
  await page.check('#bivEvidence');
  await page.locator('#bivForm').evaluate(form => form.requestSubmit());
  await expect(page.locator('#bivVat')).toContainText('0');
});

test('registration boundary, safe sharing and dark mode remain usable', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/burundi/bi-vat');
  await page.fill('#bivTurnover', '24999999');
  await page.click('#bivScreen');
  await expect(page.locator('#bivRegistration')).toContainText('Below');
  await page.fill('#bivTurnover', '25000000');
  await page.click('#bivScreen');
  await expect(page.locator('#bivRegistration')).toContainText('At or above');
  const background = await page.locator('.biv-card').first().evaluate(el => getComputedStyle(el).backgroundColor);
  expect(background).not.toBe('rgb(255, 255, 255)');
  expect(await page.evaluate(() => location.search)).toBe('');
});

test('skip link stays offscreen until keyboard focus', async ({ page }) => {
  await page.goto('/burundi/bi-vat');
  const link = page.locator('.skip-link');
  const before = await link.boundingBox();
  expect(before.y + before.height).toBeLessThanOrEqual(0);
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  const after = await link.boundingBox();
  expect(after.y).toBeGreaterThanOrEqual(0);
});

test('local PDF and JSON exports produce real files without network payloads', async ({ page }) => {
  await page.goto('/burundi/bi-vat');
  await page.locator('#bivForm').evaluate(form => form.requestSubmit());
  const pdfPromise = page.waitForEvent('download');
  await page.click('[data-export="pdf"]');
  const pdf = await pdfPromise;
  const pdfPath = await pdf.path();
  expect(fs.readFileSync(pdfPath).subarray(0, 4).toString()).toBe('%PDF');
  const jsonPromise = page.waitForEvent('download');
  await page.click('[data-export="json"]');
  const json = await jsonPromise;
  const payload = JSON.parse(fs.readFileSync(await json.path(), 'utf8'));
  expect(payload.currency).toBe('BIF');
  expect(payload.notice).toContain('not an OBR/EBMS invoice');
  expect(page.url()).not.toContain('?');
});

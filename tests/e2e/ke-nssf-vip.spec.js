const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const artifactDir = path.resolve('artifacts/finance-row-100-ke-nssf');

for (const route of ['/tools/ke-nssf/', '/fr/tools/ke-nssf/']) {
  test(route + ' calculates Year 4 and exports PDF locally', async ({ page }) => {
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    await page.locator('#kn-earnings').fill('100000');
    await page.locator('#kn-employee-actual').fill('5900');
    await page.locator('#kn-employer-actual').fill('6000');
    await page.locator('#kn-form button[type=submit]').click();
    await expect(page.locator('#kn-results')).toBeVisible();
    await expect(page.locator('#kn-employee')).toContainText(/6(?:,|\s|\u202f)000/);
    await expect(page.locator('#kn-employee-variance')).toContainText('100');
    expect(await page.evaluate(() => Array.from(document.querySelectorAll('input')).filter(input => !document.querySelector(`label[for="${input.id}"]`)).length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.evaluate(() => { window.__pdfCall = null; window.AfroTools = window.AfroTools || {}; window.AfroTools.pdf = { generate: async options => { window.__pdfCall = options; } }; });
    await page.locator('#kn-pdf').click();
    await expect.poll(() => page.evaluate(() => window.__pdfCall && window.__pdfCall.toolId)).toBe('ke-nssf');
    expect(await page.evaluate(() => window.__pdfCall.noGate && window.__pdfCall.skipGate)).toBe(true);
    if (route === '/tools/ke-nssf/') { fs.mkdirSync(artifactDir, { recursive: true }); await page.screenshot({ path: path.join(artifactDir, '375-light-result.png'), fullPage: true }); }
  });
}

test('fails closed outside Year 4 and covers 320px, 768px dark and 200%', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/tools/ke-nssf/');
  await page.locator('#kn-period').evaluate(input => { input.value = '2026-01'; });
  await page.locator('#kn-earnings').fill('100000');
  await page.locator('#kn-form button[type=submit]').click();
  await expect(page.locator('#kn-error')).not.toBeEmpty();
  await expect(page.locator('#kn-results')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/tools/ke-nssf/');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; document.body.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  fs.mkdirSync(artifactDir, { recursive: true });
  await page.evaluate(() => { document.body.style.zoom = '1'; });
  await page.screenshot({ path: path.join(artifactDir, '768-dark.png'), fullPage: true });
});

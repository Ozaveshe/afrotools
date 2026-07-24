const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const routes = ['/tools/ng-pension/', '/fr/tools/ng-pension/', '/ha/kayan-aiki/fansho-najeriya/'];

for (const route of routes) {
  test(route + ' calculates locally without overflow', async ({ page }) => {
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    await page.locator('#np-balance').fill('1000000');
    await page.locator('#np-emoluments').fill('500000');
    await page.locator('#np-return').fill('0');
    await page.locator('#np-source').fill('Payroll plus PRA 2014 section 4');
    await page.locator('#np-source-date').fill('2026-07-22');
    await page.locator('#np-return-source').fill('Statement scenario');
    await page.locator('#np-return-date').fill('2026-07-22');
    await page.locator('#np-form button[type=submit]').click();
    await expect(page.locator('#np-results')).toBeVisible();
    await expect(page.locator('#np-total-result')).toContainText('90');
    expect(await page.evaluate(() => Array.from(document.querySelectorAll('input')).filter(input => !document.querySelector(`label[for="${input.id}"]`)).length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
    if (route === '/tools/ng-pension/') {
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, 0);
      });
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await page.screenshot({ path: require('path').join('artifacts', 'ng-pension-375-light.png') });
    }
    if (route === '/tools/ng-pension/') {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('#np-pdf').click();
      const download = await downloadPromise;
      const buffer = fs.readFileSync(await download.path());
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(buffer.length).toBeGreaterThan(1000);
      expect(download.suggestedFilename()).toMatch(/ng-pension/i);
      const parsed = await pdfParse(buffer);
      expect(parsed.text).toContain('Nigeria CPS contribution and RSA scenario');
      expect(parsed.text).toMatch(/21[,.]?600[,.]?000/);
    } else {
      await page.evaluate(() => {
        window.__ngPensionPdfCall = null;
        window.AfroTools = window.AfroTools || {};
        window.AfroTools.pdf = { generate: async options => { window.__ngPensionPdfCall = options; } };
      });
      await page.locator('#np-pdf').click();
      await expect.poll(() => page.evaluate(() => window.__ngPensionPdfCall && window.__ngPensionPdfCall.toolId)).toBe('ng-pension');
      expect(await page.evaluate(() => window.__ngPensionPdfCall.noGate && window.__ngPensionPdfCall.skipGate)).toBe(true);
    }
  });
}

test('required return and future evidence fail closed; dark mode stays legible', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/tools/ng-pension/');
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await page.locator('#np-emoluments').fill('500000');
  await page.locator('#np-source').fill('Payroll source');
  await page.locator('#np-source-date').fill('2026-07-22');
  await page.locator('#np-return-source').fill('Statement scenario');
  await page.locator('#np-return-date').fill('2026-07-23');
  await page.locator('#np-form button[type=submit]').click();
  await expect(page.locator('#np-error')).not.toBeEmpty();
  await expect(page.locator('#np-results')).toBeHidden();
  await page.locator('#np-return').fill('0');
  await page.locator('#np-return-date').fill('2026-07-22');
  await page.locator('#np-form button[type=submit]').click();
  await expect(page.locator('#np-results')).toBeVisible();
  const tableAlignment = await page.evaluate(() => {
    const table = document.querySelector('.np-table');
    const headCells = Array.from(table.tHead.rows[0].cells);
    const bodyCells = Array.from(table.tBodies[0].rows[0].cells);
    return headCells.map((cell, index) => Math.abs(cell.getBoundingClientRect().left - bodyCells[index].getBoundingClientRect().left));
  });
  expect(Math.max(...tableAlignment)).toBeLessThan(2);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.np-page')).color !== getComputedStyle(document.querySelector('.np-page')).backgroundColor)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({ path: require('path').join('artifacts', 'ng-pension-768-dark.png') });
  await page.locator('#np-results').screenshot({ path: require('path').join('artifacts', 'ng-pension-768-dark-results.png') });
});

test('320px and 200% equivalent layouts do not overflow', async ({ page }) => {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto('/tools/ng-pension/');
    if (width === 768) await page.evaluate(() => { document.body.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

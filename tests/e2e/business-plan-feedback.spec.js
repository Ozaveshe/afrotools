const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
test.use({ trace: 'off', video: 'off', screenshot: 'off' });
const routes = [
  ['en', '/tools/business-plan-builder/'],
  ['fr', '/fr/tools/generateur-business-plan/'],
  ['sw', '/sw/zana/mjenzi-mpango-wa-biashara/']
];
const finance = ['monthlyRevenue', 'monthlyVariableCosts', 'monthlyFixedCosts', 'startupNeed', 'workingCapitalNeed', 'confirmedFunding'];
async function fill(page) {
  await page.locator('[name=name]').fill('Synthetic Foods');
  for (const name of finance) await page.locator(`[name=${name}]`).fill('100');
}
for (const [locale, route] of routes) {
  test(`${locale} identifies invalid fields and recovers without stealing typing focus`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route);
    await page.evaluate(locale => { document.documentElement.dataset.theme = locale === 'en' ? 'light' : 'dark'; }, locale);
    await page.locator('.bpd-build').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[name=name]')).toBeFocused();
    await expect(page.locator('[name=name]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('[name=name]')).toHaveCSS('border-top-color', locale === 'en' ? 'rgb(154, 52, 18)' : 'rgb(255, 181, 155)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const errorId = await page.locator('[data-error]').getAttribute('id');
    expect(errorId).toBeTruthy();
    await expect(page.locator('[name=name]')).toHaveAttribute('aria-describedby', errorId);
    await fill(page);
    await page.locator('[name=monthlyRevenue]').fill('-1');
    await page.locator('.bpd-build').click();
    await expect(page.locator('[name=monthlyRevenue]')).toBeFocused();
    await page.locator('[name=monthlyRevenue]').fill('100.001');
    await page.locator('.bpd-build').click();
    await expect(page.locator('[name=monthlyRevenue]')).toHaveAttribute('aria-invalid', 'true');
    await page.locator('[name=monthlyRevenue]').fill('100');
    await expect(page.locator('[name=monthlyRevenue]')).toBeFocused();
    await expect(page.locator('[name=monthlyRevenue]')).not.toHaveAttribute('aria-invalid', 'true');
    await page.locator('[name=scenarioChangePct]').fill('20.5');
    await page.locator('.bpd-build').click();
    await expect(page.locator('[name=scenarioChangePct]')).toBeFocused();
    await page.locator('[name=scenarioChangePct]').fill('20');
    await page.locator('.bpd-build').click();
    await expect(page.locator('[data-result]')).toBeVisible();
    await expect(page.locator('[aria-invalid=true]')).toHaveCount(0);
  });

  test(`${locale} clipboard failures retain TXT download and report a local alternative`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.name));
    await page.goto(route);
    await fill(page);
    await page.locator('.bpd-build').click();
    for (const mode of ['unavailable', 'rejected', 'throws']) {
      await page.evaluate(mode => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'unavailable' ? undefined : {
          writeText: () => { if (mode === 'throws') throw new Error('Unavailable'); return Promise.reject(new DOMException('Denied', 'NotAllowedError')); }
        } });
        document.querySelector('[data-result-status]').textContent = '';
      }, mode);
      await page.locator('[data-action=copy]').click();
      await expect(page.locator('[data-result-status]')).toContainText('TXT');
    }
    const pending = page.waitForEvent('download');
    await page.locator('[data-action=txt]').click();
    const download = await pending;
    expect(fs.readFileSync(await download.path(), 'utf8')).toContain('Synthetic Foods');
    expect(errors).toEqual([]);
  });
}

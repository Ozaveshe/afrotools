'use strict';

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ledger = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../../data/audits/generic-app-quality-200.json'),
  'utf8'
));
const routes = ledger.rows
  .filter((row) => row.locale === 'en' && row.repair === 'removed-score-oriented-duplicate-workspace')
  .map((row) => row.route);

test.describe.configure({ mode: 'parallel' });
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('ledger freezes the repaired English denominator', () => {
  expect(ledger.status).toBe('accepted');
  expect(ledger.target).toBe(200);
  expect(routes).toHaveLength(117);
});

for (const route of routes) {
  test(`${route} exposes its real workflow without the score-padding form`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('afrotools_cookie_consent', 'declined');
    });
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response && response.status(), `${route}: HTTP status`).toBe(200);
    await page.waitForTimeout(180);

    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('[data-df-upgrade]')).toHaveCount(0);
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/It is as accurate as the values you enter|completely free, works on any phone|Not sure how to get the most from the .*?Enter .*? and it returns/i);

    const workflow = page.locator('body input, body select, body textarea, body button, body [role="button"], body a[href$="/app"], body a[href$="/app.html"]');
    const visibleWorkflowControls = await workflow.evaluateAll((elements) => elements.filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return !element.closest('header, nav, footer, afro-navbar, afro-footer, [data-cookie-consent]')
        && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }).length);
    expect(visibleWorkflowControls, `${route}: real workflow controls`).toBeGreaterThan(0);

    const emptyRuntimeMounts = await page.locator('#sports-tool-root, #carImportApp').evaluateAll((elements) =>
      elements.filter((element) => element.childElementCount === 0).map((element) => element.id)
    );
    expect(emptyRuntimeMounts, `${route}: runtime mounts hydrated`).toEqual([]);
  });
}

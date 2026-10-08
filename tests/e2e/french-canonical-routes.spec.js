'use strict';
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { startCanonicalRouteArtifactServer } = require('../support/canonical-route-artifact-server');
let artifactServer;
test.beforeAll(async ({ baseURL }) => {
  if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT === '1' && ['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) {
    artifactServer = await startCanonicalRouteArtifactServer();
  }
});
test.afterAll(async () => { if (artifactServer) await artifactServer.close(); });

// Run against a Netlify candidate as well as the local artifact. The default
// static server does not model Netlify's flat-file versus directory priority.
const rows = [
  { route: '/fr/cape-verde/cv-paye', input: '#grossSalary', button: '#calculateBtn', output: '#netMonthly' },
  { route: '/fr/cape-verde/cv-vat', input: '#cvvAmount', button: '#cvvForm button[type=submit]', output: '#cvvGross' },
  { route: '/fr/eq-guinea/gq-paye', input: '#grossSalary', button: '.calc-btn', output: '#resAmount' },
  { route: '/fr/eq-guinea/gq-vat', input: '#gqvAmount', button: '#gqvForm button[type=submit]', output: '#gqvGross' },
  { route: '/fr/cote-divoire/ci-paye', canonical: '/fr/cote-divoire/calculateur-salaire-net', input: '#grossSalary' }
];

for (const width of [390, 1280]) for (const row of rows) for (const suffix of ['/', '', '.html']) {
  test(`${width}px ${row.route}${suffix} settles on the native calculator`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 850 });
    const targetBaseURL = artifactServer ? artifactServer.baseURL : baseURL;
    const origin = new URL(targetBaseURL).origin;
    let documentRequests = 0;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
        documentRequests++;
        if (documentRequests > 4) return route.abort('failed');
      }
      if (url.origin === origin) return route.continue();
      if (/\/Chart\.js\/4\.4\.1\/chart\.umd\.min\.js$/.test(url.pathname)) {
        return route.fulfill({ path: path.join(__dirname, '../fixtures/chart-4.4.1-test-fixture.js'), contentType: 'application/javascript' });
      }
      return route.abort();
    });
    // No real person or financial record is used. Remote requests are isolated
    // for this routing/control check; this is not an analytics/privacy test.
    await page.goto(new URL(row.route + suffix, targetBaseURL).href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await expect(page.locator(row.input)).toBeVisible();
    await expect(page.locator('meta[http-equiv="refresh" i]')).toHaveCount(0);
    const canonical = row.canonical || row.route;
    expect(new URL(page.url()).pathname.replace(/\/$/, '')).toBe(canonical);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', new RegExp(canonical + '/?$'));
    const settledRequests = documentRequests;
    const settledUrl = page.url();
    await page.waitForTimeout(1000); // Observe client refreshes after HTTP resolution.
    expect(page.url()).toBe(settledUrl);
    expect(documentRequests).toBe(settledRequests);
    expect(documentRequests).toBeLessThanOrEqual(4);
    if (row.output) {
      await page.locator(row.input).fill('100000');
      await page.locator(row.button).focus();
      await page.keyboard.press('Enter');
      const result = page.locator(row.output);
      await expect(result).toBeVisible();
      await expect(result).toHaveText(/\d/);
      const before = await result.innerText();
      expect(before).not.toMatch(/NaN|Infinity/);
      await page.locator(row.input).fill('200000');
      await page.locator(row.button).focus();
      await page.keyboard.press('Enter');
      await expect(result).not.toHaveText(before);
      expect(await result.innerText()).not.toMatch(/NaN|Infinity/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

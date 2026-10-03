const { test, expect } = require('@playwright/test');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

for (const width of [320, 390, 1365]) {
  test(`shared error alert treats text safely and remains keyboard usable at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.setContent('<main><h1>Synthetic error-boundary fixture</h1><button type="button" id="before">Existing control</button></main>');
    await page.addScriptTag({ url: `${baseURL}/assets/js/lib/error-boundary.js` });
    await page.evaluate(() => window.AfroTools.errors.showBanner('<img src=x onerror=window.syntheticInjection=true>'));
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => window.syntheticInjection === undefined)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const close = alert.getByRole('button', { name: 'Dismiss error', exact: true });
    const box = await close.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(alert).toHaveCount(0);
  });
}

test('served shared reporter sends only fixed metadata for sensitive synthetic exceptions', async ({ page, baseURL }) => {
  await page.setContent('<main><h1>Synthetic diagnostic fixture</h1></main>');
  await page.evaluate(() => {
    window.syntheticDiagnosticCalls = [];
    window.syntheticAnalyticsCalls = [];
    console.error = (...args) => window.syntheticDiagnosticCalls.push(args);
    window.AFRO_TOOLS = [{ id: 'cv-builder' }];
    window.AfroTools = { analytics: { trackError: (...args) => window.syntheticAnalyticsCalls.push(args) } };
  });
  await page.addScriptTag({ url: `${baseURL}/assets/js/lib/error-boundary.js` });
  const proof = await page.evaluate(async () => {
    const privateText = 'synthetic.person@example.invalid salary 123456';
    const error = new Error(privateText);
    window.AfroTools.errors.report('synthetic-person', error, { url: '/export?text=' + privateText });
    window.AfroTools.errors.wrap('cv-builder', () => { throw error; });
    await window.AfroTools.errors.wrapAsync('cv-builder', () => Promise.reject(error));
    return { reportCount: window.syntheticDiagnosticCalls.length, analyticsCount: window.syntheticAnalyticsCalls.length,
      privateDiagnosticContent: JSON.stringify(window.syntheticDiagnosticCalls).includes(privateText),
      privateAnalyticsContent: JSON.stringify(window.syntheticAnalyticsCalls).includes(privateText),
      unknownCallerForwarded: JSON.stringify(window.syntheticDiagnosticCalls).includes('synthetic-person'),
      fixedErrorCodes: window.syntheticAnalyticsCalls.every(args => args[1] === 'js_error' && args[2] === '') };
  });
  expect(proof).toEqual({ reportCount: 3, analyticsCount: 3, privateDiagnosticContent: false, privateAnalyticsContent: false, unknownCallerForwarded: false, fixedErrorCodes: true });
});

test('an actual calculator loads the bundled reporting fix without sending synthetic exception content', async ({ page }) => {
  let privateRequest = false;
  page.on('request', request => {
    if ((request.url() + (request.postData() || '')).includes('synthetic.person@example.invalid')) privateRequest = true;
  });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.goto('/nigeria/ng-vat.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.AfroTools && window.AfroTools.errors && window.AfroTools.analytics);
  expect(await page.locator('script[src*="/bundles/core."]').count()).toBeGreaterThan(0);
  const proof = await page.evaluate(() => {
    const privateText = 'synthetic.person@example.invalid salary 123456';
    const diagnostic = [], analytics = [];
    const originalConsole = console.error;
    const originalTrack = window.AfroTools.analytics.trackError;
    console.error = (...args) => diagnostic.push(args);
    window.AfroTools.analytics.trackError = (...args) => { analytics.push(args); return originalTrack(...args); };
    try {
      window.AfroTools.errors.report('synthetic-person', new Error(privateText), { source: '/export?text=' + privateText });
      return { diagnosticCount: diagnostic.length, analyticsCount: analytics.length,
        privateDiagnosticContent: JSON.stringify(diagnostic).includes(privateText),
        privateAnalyticsContent: JSON.stringify(analytics).includes(privateText),
        unknownCallerForwarded: JSON.stringify(diagnostic).includes('synthetic-person'),
        fixedErrorCodes: analytics.every(args => args[1] === 'js_error' && args[2] === '') };
    } finally { console.error = originalConsole; window.AfroTools.analytics.trackError = originalTrack; }
  });
  expect(proof).toEqual({ diagnosticCount: 1, analyticsCount: 1, privateDiagnosticContent: false, privateAnalyticsContent: false, unknownCallerForwarded: false, fixedErrorCodes: true });
  expect(privateRequest).toBe(false);
});

const { test, expect } = require('@playwright/test');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

test.skip(process.env.PLAYWRIGHT_LIVE_GA4 !== '1', 'Set PLAYWRIGHT_LIVE_GA4=1 for a real Google Analytics delivery check.');

for (const routePath of ['/', '/fr/']) {
  test(`real GA4 delivery probe ${routePath}`, async ({ browser }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 375, height: 812 },
      serviceWorkers: 'block',
    });
    await context.addInitScript(() => {
      localStorage.setItem('afrotools_cookie_consent', 'accepted');
    });
    const page = await context.newPage();
    const records = [];
    const isGoogleAnalytics = (url) => /(?:googletagmanager\.com\/gtag\/js|google-analytics\.com\/g\/collect)/.test(url);
    page.on('request', (request) => {
      if (isGoogleAnalytics(request.url())) records.push({ type: 'request', url: request.url(), method: request.method() });
    });
    page.on('response', (response) => {
      if (isGoogleAnalytics(response.url())) records.push({ type: 'response', url: response.url(), status: response.status() });
    });
    page.on('requestfailed', (request) => {
      if (isGoogleAnalytics(request.url())) records.push({ type: 'failed', url: request.url(), failure: request.failure() });
    });
    page.on('console', (message) => {
      if (/analytics|gtag|content security|blocked/i.test(message.text())) records.push({ type: 'console', level: message.type(), text: message.text() });
    });

    await page.goto(routePath, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(12000);
    const state = await page.evaluate(() => ({
      dataLayer: (window.dataLayer || []).map((entry) => Array.from(entry)),
      consent: localStorage.getItem('afrotools_cookie_consent'),
      cookies: document.cookie,
      scripts: Array.from(document.scripts).map((script) => script.src).filter(Boolean).filter((src) => /googletagmanager|lazy-analytics/.test(src)),
    }));
    expect(records.some((record) => record.type === 'response' && /gtag\/js/.test(record.url) && record.status === 200)).toBe(true);
    const collection = records.find((record) => record.type === 'request' && /google-analytics\.com\/g\/collect/.test(record.url) && /[?&]tid=G-D859CGF391(?:&|$)/.test(record.url));
    expect(collection).toBeTruthy();
    const payload = new URL(collection.url);
    expect(payload.searchParams.get('dl')).toBe(new URL(routePath, baseURL).href);
    expect(payload.searchParams.get('en')).toBe('page_view');
    expect(records.some((record) => record.type === 'response' && record.url === collection.url && record.status === 204)).toBe(true);
    await expect.poll(() => page.evaluate(() => document.cookie.includes('_ga=')), { timeout: 10000 }).toBe(true);
    console.log(JSON.stringify({
      routePath,
      tagLoaded: true,
      collection: {
        endpoint: payload.origin + payload.pathname,
        measurementId: payload.searchParams.get('tid'),
        pageLocation: payload.searchParams.get('dl'),
        eventName: payload.searchParams.get('en'),
        consentState: payload.searchParams.get('gcs'),
        responseStatus: 204,
      },
      gaCookieCreated: true,
      commandCount: state.dataLayer.length,
    }));
    await context.close();
  });
}

const { test, expect } = require('@playwright/test');

// Authored policy-enforcement cases. Run only with real local HTTP headers;
// their existence is not evidence that the browser or deployed CDN passed.
test.use({ serviceWorkers: 'block', trace: 'off', screenshot: 'off', video: 'off' });

async function prepare(page, baseURL) {
  expect(process.env.AFROTOOLS_TEST_SECURITY_HEADERS, 'enable actual server CSP responses').toBe('1');
  const origin = new URL(baseURL).origin;
  expect(new URL(origin).hostname, 'closed local server only').toBe('127.0.0.1');
  await page.context().route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const documents = ['/fr/blog/best-free-pdf-tools-online/', '/blog/best-free-pdf-tools-online/', '/fr/kenya/', '/kenya/'];
    const staticPath = documents.includes(url.pathname) || /^\/(?:assets|data|engines|blog\/assets)\//.test(url.pathname)
      || ['/favicon.ico', '/manifest.json', '/fr/manifest.json', '/robots.txt'].includes(url.pathname);
    if (url.origin === origin && request.method() === 'GET' && staticPath) return route.continue();
    return route.abort('blockedbyclient');
  });
  await page.addInitScript(() => {
    window.__afroChildFramePolicyViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__afroChildFramePolicyViolations.push({
        effectiveDirective: event.effectiveDirective,
        blockedURI: event.blockedURI,
        disposition: event.disposition
      });
    });
  });
  return origin;
}

function assertChildPolicy(response) {
  expect(response.status()).toBe(200);
  const policy = response.headers()['content-security-policy'];
  expect(policy, 'actual HTTP response must enforce CSP').toBeTruthy();
  for (const enforced of policy.split(',')) {
    const directives = enforced.split(';').map((value) => value.trim().split(/\s+/));
    const frames = directives.filter((tokens) => tokens[0] === 'frame-src');
    expect(frames).toHaveLength(1);
    expect(frames[0].slice(1)).toEqual(["'self'", 'https://js.stripe.com']);
  }
}

const cases = [
  { parent: '/fr/blog/best-free-pdf-tools-online/', child: '/blog/best-free-pdf-tools-online/', heading: '7 Free PDF Tools Online Compared in 2026' },
  { parent: '/fr/kenya/', child: '/kenya/', heading: /Kenya\s*Tools 2026/ }
];
for (const row of cases) {
  test('actual same-origin fallback child renders under HTTP CSP: ' + row.parent, async ({ page, baseURL }) => {
    const origin = await prepare(page, baseURL);
    const childResponses = [];
    page.on('response', (response) => {
      if (response.url() === origin + row.child && response.request().resourceType() === 'document') childResponses.push(response);
    });
    assertChildPolicy(await page.goto(row.parent, { waitUntil: 'domcontentloaded' }));
    const iframe = page.locator('iframe');
    await expect(iframe).toHaveCount(1);
    await expect(iframe).toHaveAttribute('src', row.child);
    await expect.poll(() => childResponses.length).toBe(1);
    assertChildPolicy(childResponses[0]);
    const child = page.frameLocator('iframe');
    await expect(child.getByRole('heading', { level: 1 })).toHaveText(row.heading);
    await expect(child.getByRole('heading', { level: 1 })).toBeVisible();
    if (row.child === '/blog/best-free-pdf-tools-online/') {
      const image = child.locator('img[src="/assets/img/blog/best-free-pdf-tools-online.webp"]');
      await expect(image).toHaveCount(1);
      await expect(image).toHaveAttribute('alt', 'Free PDF Tools Online');
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
    }

    await expect.poll(() => iframe.evaluate((element) => element.contentDocument?.location.href)).toBe(origin + row.child);
    const violations = await page.evaluate(() => window.__afroChildFramePolicyViolations);
    expect(violations.filter((event) => event.effectiveDirective === 'frame-src' && event.blockedURI.startsWith(origin + row.child))).toEqual([]);
  });
}

test('an unapproved child origin is denied by frame-src rather than merely the network guard', async ({ page, baseURL }) => {
  await prepare(page, baseURL);
  assertChildPolicy(await page.goto('/fr/blog/best-free-pdf-tools-online/', { waitUntil: 'domcontentloaded' }));
  const forbidden = 'https://afrotools-frame-denied.invalid/synthetic-child';
  await page.evaluate((url) => {
    const iframe = document.createElement('iframe');
    iframe.title = 'Synthetic forbidden-origin policy control';
    iframe.src = url;
    document.body.appendChild(iframe);
  }, forbidden);
  await expect.poll(() => page.evaluate(() => window.__afroChildFramePolicyViolations)).toEqual(expect.arrayContaining([
    expect.objectContaining({ effectiveDirective: 'frame-src', blockedURI: expect.stringContaining('https://afrotools-frame-denied.invalid'), disposition: 'enforce' })
  ]));
});

const { test, expect } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

const repositoryRoot = path.resolve(__dirname, '../..');
const assetRoot = process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT === '1'
  ? path.join(repositoryRoot, 'dist') : repositoryRoot;

// Routing/interception disables HTTP caching. This fixture uses an actual
// same-origin server and deliberately stale immutable bytes at the legacy URL.
async function createCacheFixture(navbarFile) {
  const requests = new Map();
  const navbar = fs.readFileSync(path.join(assetRoot, navbarFile));
  const animation = fs.readFileSync(path.join(assetRoot, 'assets/js/animations.js'));
  const animationCss = fs.readFileSync(path.join(assetRoot, 'assets/css/animations.css'));
  const legacy = 'window.__legacyAnimation = true; document.querySelector(".eyebrow").classList.add("rv");';
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    requests.set(req.url, (requests.get(req.url) || 0) + 1);
    res.setHeader('Cache-Control', 'no-store');
    if (url.pathname === '/assets/js/animations.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.end(url.search ? animation : legacy);
    }
    if (url.pathname === '/assets/css/animations.css') {
      res.setHeader('Content-Type', 'text/css');
      return res.end(animationCss);
    }
    if (url.pathname === '/navbar.js') {
      res.setHeader('Content-Type', 'application/javascript');
      return res.end(navbar);
    }
    if (url.pathname === '/assets/js/pwa-install.js') {
      res.setHeader('Content-Type', 'application/javascript');
      return res.end(fs.readFileSync(path.join(assetRoot, url.pathname)));
    }
    if (url.pathname === '/prime' || url.pathname === '/legacy' || url.pathname === '/current' || url.pathname === '/skip') {
      res.setHeader('Content-Type', 'text/html');
      // The fixture limits unrelated network activity, without changing public
      // product headers or modifying any animation/navbar source bytes.
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; worker-src 'none'");
      const current = url.pathname === '/current' || url.pathname === '/skip';
      const className = url.pathname === '/skip' ? 'eyebrow rv' : 'eyebrow';
      return res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="afrotools-network-policy" content="local-only" data-source-owner="cache-regression-fixture"><link data-afrotools-typography><link rel="manifest" href="data:,{}"><script id="afro-analytics-js"></script><script id="afro-error-boundary-js"></script><script id="afro-cmd-palette-js"></script><script id="afro-pro-gate-js"></script></head><body style="margin:16px;background:white;color:black"><p class="${className}">Contact us</p><h1>Get in touch</h1><script src="${current ? '/navbar.js' : '/assets/js/animations.js'}"></script></body></html>`);
    }
    res.writeHead(404); res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { origin: `http://127.0.0.1:${server.address().port}`, requests,
    close: () => new Promise(resolve => server.close(resolve)) };
}

for (const navbarFile of ['assets/js/components/navbar.js', 'assets/js/components/navbar.min.js']) {
  test(`returning visitors load current animations through ${path.basename(navbarFile)}`, async ({ browser }, testInfo) => {
    const fixture = await createCacheFixture(navbarFile);
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference', serviceWorkers: 'block' });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(fixture.origin + '/prime');
      expect(await page.evaluate(() => window.__legacyAnimation)).toBe(true);
      expect(fixture.requests.get('/assets/js/animations.js')).toBe(1);
      await page.goto(fixture.origin + '/legacy');
      expect(await page.evaluate(() => window.__legacyAnimation)).toBe(true);
      // A second page really reused immutable cached bytes without a server hit.
      expect(fixture.requests.get('/assets/js/animations.js')).toBe(1);
      await page.goto(fixture.origin + '/current');
      await expect(page.locator('.eyebrow')).toHaveClass(/\bin\b/);
      const scriptPath = await page.locator('#afro-animations-js').getAttribute('src');
      expect(scriptPath).toMatch(/^\/assets\/js\/animations\.js\?v=[a-f0-9]{8}$/);
      expect(fixture.requests.get(scriptPath)).toBe(1);
      expect(fixture.requests.get('/assets/js/animations.js')).toBe(1);
      expect(await page.evaluate(() => Boolean(window.__legacyAnimation))).toBe(false);
      await expect.poll(() => page.locator('.eyebrow').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
      expect(errors).toEqual([]);
      await testInfo.attach('real-http-warm-cache', { body: Buffer.from(JSON.stringify({ navbarFile, scriptPath, requests: Object.fromEntries(fixture.requests), pageErrors: errors })), contentType: 'application/json' });
    } finally { await context.close(); await fixture.close(); }
  });
}

for (const mode of [{ name: 'mobile', width: 320, reducedMotion: 'no-preference' }, { name: 'reduced motion', width: 1280, reducedMotion: 'reduce' }]) {
  test(`${mode.name} reveals content without loading decorative assets`, async ({ browser }) => {
    const fixture = await createCacheFixture('assets/js/components/navbar.min.js');
    const context = await browser.newContext({ viewport: { width: mode.width, height: 900 }, reducedMotion: mode.reducedMotion, serviceWorkers: 'block' });
    try {
      const page = await context.newPage();
      await page.goto(fixture.origin + '/skip');
      await expect(page.locator('.eyebrow')).toHaveClass(/\bin\b/);
      await expect(page.locator('#afro-animations-js, #afro-animations-css')).toHaveCount(0);
      expect([...fixture.requests.keys()].filter(url => url.startsWith('/assets/js/animations.js') || url.startsWith('/assets/css/animations.css'))).toEqual([]);
    } finally { await context.close(); await fixture.close(); }
  });
}

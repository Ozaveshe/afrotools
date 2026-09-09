'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createSmokeContext } = require('../scripts/lib/browser-smoke-context');
test('sandbox frames stay usable while service-worker registration remains blocked', async () => {
  const browser = await chromium.launch();
  try {
    const context = await createSmokeContext(browser);
    const page = await context.newPage();
    const errors = [];
    let workerRequests = 0;
    page.on('pageerror', e => errors.push(e.message));
    await context.route('**/*', route => {
      if (route.request().url().endsWith('/sw.js')) workerRequests++;
      return route.fulfill({ contentType: 'text/html', body: '<html><body><iframe sandbox="allow-scripts" srcdoc="<script>window.ready=true</script>"></iframe></body></html>' });
    });
    await page.goto('https://fixture.test/');
    await page.waitForTimeout(100);
    assert.equal(await page.frames()[1].evaluate(() => window.ready), true);
    await page.evaluate(() => navigator.serviceWorker.register('/sw.js'));
    assert.equal(workerRequests, 0);
    assert.deepEqual(errors, []);
    await page.evaluate(() => setTimeout(() => { throw new Error('real application failure'); }, 0));
    await page.waitForTimeout(100);
    assert.deepEqual(errors, ['real application failure']);
    await context.close();
  } finally { await browser.close(); }
});

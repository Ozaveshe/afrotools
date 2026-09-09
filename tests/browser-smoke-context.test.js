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

test('CLI gate does not misclassify deliberately blocked external requests', () => {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const { spawnSync } = require('child_process');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'afro-reliability-'));
  try {
    const run = spawnSync(process.execPath, ['scripts/audit-tool-quality.js', '--browser', '--route=/tools/html-to-pdf/', '--port=4221', '--output-dir', output, '--gate'], { encoding: 'utf8', timeout: 45000 });
    assert.equal(run.status, 0, run.stdout + run.stderr);
    const report = JSON.parse(fs.readFileSync(path.join(output, 'tool-quality-ranking.json'), 'utf8'));
    const row = report.tools[0];
    assert.equal(row.runtime.gate, 'passed');
    assert.ok(row.browser.blockedByHarness.length > 0, 'test must exercise the external-request blocker');
    assert.deepEqual(row.browser.thirdPartyFailures, []);
  } finally { fs.rmSync(output, { recursive: true, force: true }); }
});

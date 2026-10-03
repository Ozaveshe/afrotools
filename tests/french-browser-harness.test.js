'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { isExpectedHomepageNavigationAbort } = require('./support/runtime-request-status');

test('homepage unload classification preserves genuine resource failures', () => {
  const base = { url: 'http://localhost/assets/js/bundles/chat.123abc.min.js', error: 'NS_BINDING_ABORTED', requestDocumentUrl: 'http://localhost/fr/', navigation: { from: 'http://localhost/fr/', to: 'http://localhost/fr/all-tools/?q=PDF' } };
  assert.equal(isExpectedHomepageNavigationAbort(base), true);
  assert.equal(isExpectedHomepageNavigationAbort({ ...base, url: 'http://localhost/fr/manifest.json', error: 'Load request cancelled' }), true);
  for (const changed of [
    { error: 'net::ERR_FAILED' }, { error: '404' }, { url: 'http://localhost/assets/js/bundles/core.123abc.min.js' },
    { url: 'https://elsewhere.invalid/assets/js/bundles/chat.123abc.min.js' },
    { requestDocumentUrl: 'http://localhost/fr/all-tools/?q=PDF' },
    { navigation: null }, { navigation: { from: 'http://localhost/fr/', to: 'http://localhost/tools/' } }
  ]) assert.equal(isExpectedHomepageNavigationAbort({ ...base, ...changed }), false);
});

test('static proof server honors declared locale manifest rewrites and keeps unknown assets missing', { timeout: 30000 }, async () => {
  const root = path.resolve(__dirname, '..');
  const child = spawn(process.execPath, ['tests/support/static-server.js'], { cwd: root, env: { ...process.env, PORT: '0', AFROTOOLS_TEST_PUBLISH_ARTIFACT: '0', AFROTOOLS_LOCAL_SKIP_DATA_STORE_WRITES: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const origin = await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error('Owned test server did not become ready')), 10000);
      child.stdout.on('data', bytes => { output += bytes; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error('Owned test server exited ' + code)); });
    });
    const expected = fs.readFileSync(path.join(root, 'manifest.json'));
    // Current Netlify contract declares the French alias. No other locale is inferred.
    for (const locale of ['fr']) {
      const response = await fetch(origin + '/' + locale + '/manifest.json');
      assert.equal(response.status, 200, locale);
      assert.match(response.headers.get('content-type'), /application\/json/);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected);
    }
    assert.equal((await fetch(origin + '/xx/manifest.json')).status, 404);
    assert.equal((await fetch(origin + '/fr/not-a-real-asset.json')).status, 404);
  } finally {
    if (child.exitCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
  }
});

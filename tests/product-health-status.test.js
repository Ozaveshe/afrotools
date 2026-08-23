'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const health = require('../assets/js/lib/product-health');

const ROOT = path.resolve(__dirname, '..');

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

test('stale source cannot be operational or current', () => {
  const status = health.deriveStatus({
    lastVerified: '2026-01-01T00:00:00Z',
    cadenceDays: 7,
    coverageTotal: 1,
    coverageVerified: 1,
    declaredStatus: 'operational'
  }, new Date('2026-08-22T00:00:00Z'));
  assert.equal(status, health.STATUS.STALE);
  assert.equal(health.isOperational(status), false);
  assert.equal(health.normalizeStatus('stale'), health.STATUS.STALE);
});

test('unknown evidence is never operational', () => {
  assert.equal(health.deriveStatus({ declaredStatus: 'operational' }), health.STATUS.UNKNOWN);
  assert.equal(health.normalizeStatus('not checked'), health.STATUS.UNKNOWN);
  assert.equal(health.isOperational('unknown'), false);
});

test('degraded and unavailable products have visible public labels', () => {
  assert.equal(health.LABELS[health.STATUS.DEGRADED], 'Degraded');
  assert.equal(health.LABELS[health.STATUS.UNAVAILABLE], 'Temporarily unavailable');
  const page = read('status/index.html');
  const renderer = read('assets/js/pages/product-health-status.js');
  assert.match(renderer, /class="status-badge" data-status=/);
  assert.match(renderer, /api\.LABELS\[status\]/);
  assert.match(page, /aria-live="polite"/);
});

test('status snapshot and page do not contain secret-shaped values', () => {
  const snapshot = JSON.parse(read('status/product-health.json'));
  assert.equal(health.containsUnsafePublicText(snapshot), false);
  assert.equal(health.containsUnsafePublicText(read('status/index.html')), false);
  assert.doesNotMatch(read('status/index.html'), /SUPABASE_SERVICE|ADMIN_SECRET|NETLIFY_AUTH_TOKEN/i);
});

test('deploy SHA and date are represented only by the safe public schema', () => {
  const safe = health.safeReleaseMetadata({
    context: 'production', production: true,
    commit: 'ebef26f04948a56cee3d8880051d965892d9f147',
    built_at: '2026-08-22T12:00:00Z', secret: 'do-not-copy'
  });
  assert.deepEqual(Object.keys(safe), ['context', 'production', 'commit', 'built_at']);
  assert.equal(safe.production, true);
  assert.equal(safe.commit.length, 40);
  assert.equal(health.safeReleaseMetadata({ context: 'production', production: true, commit: 'branch-name' }).commit, null);
});

test('status page has a complete embedded snapshot and no live API prerequisite', () => {
  const page = read('status/index.html');
  const match = page.match(/<script id="productHealthSnapshot" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'embedded health snapshot is required');
  const snapshot = JSON.parse(match[1]);
  assert.equal(snapshot.platform.length, 4);
  assert.equal(snapshot.products.length, 8);
  assert.match(page, /remains useful even if live health APIs are unavailable/i);
});

test('public release annotations point to merged history without exposing commit subjects', () => {
  const releases = JSON.parse(read('changelog/releases.json')).releases;
  assert.ok(releases.length >= 1);
  for (const release of releases) {
    assert.match(release.commit, /^[0-9a-f]{40}$/);
    let commitIsAvailable = true;
    try {
      execFileSync('git', ['cat-file', '-e', release.commit + '^{commit}'], { cwd: ROOT, stdio: 'pipe' });
    } catch (_error) {
      commitIsAvailable = false;
    }
    if (commitIsAvailable) {
      execFileSync('git', ['merge-base', '--is-ancestor', release.commit, 'HEAD'], { cwd: ROOT, stdio: 'pipe' });
    }
    assert.equal(health.containsUnsafePublicText(release), false);
    assert.equal(Object.prototype.hasOwnProperty.call(release, 'commit_subject'), false);
  }
});

test('AfroStream empty and failure surfaces explicitly label live-data degradation', () => {
  for (const relative of [
    'tools/afrostream/index.html',
    'tools/afrostream/news.html',
    'tools/afrostream/rankings-degradation.js'
  ]) {
    assert.match(read(relative), /Live data temporarily unavailable/);
  }
});

test('public API status endpoint does not infer dependency health', async () => {
  const response = await require('../netlify/functions/api-status').handler({
    httpMethod: 'GET', headers: {}, queryStringParameters: {}
  }, {});
  const body = JSON.parse(response.body);
  assert.notEqual(body.status, 'operational');
  assert.equal(body.status, 'available');
  assert.equal(body.dependency_status, 'not_checked');
});

test('dist builder emits release identity from allowlisted fields only', () => {
  const source = read('scripts/build-dist.js');
  assert.match(source, /writeReleaseMetadata/);
  assert.match(source, /process\.env\.NETLIFY === 'true'/);
  assert.match(source, /process\.env\.COMMIT_REF/);
  assert.doesNotMatch(source, /release\.json[\s\S]{0,500}(ADMIN|TOKEN|SECRET|SERVICE_ROLE)/i);
});

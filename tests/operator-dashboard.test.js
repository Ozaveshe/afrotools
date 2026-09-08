'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { build } = require('../scripts/build-operator-dashboard');

test('snapshot counts derive from named ledger fields and retain their evidence', () => {
  const data = build(undefined, new Date('2026-09-08T00:00:00Z'));
  const registry = require('../reports/canonical-registry-report.json');
  assert.equal(data.registry.canonicalPublishedTools, registry.summary.canonicalPublishedTools);
  assert.equal(data.live.status, 'unavailable');
  assert.equal(data.build.status, 'unverified');
  assert.ok(data.evidence.every(row => row.status === 'unavailable' || /^[a-f0-9]{64}$/.test(row.sha256)));
  const old = data.sources.find(row => row.id === 'api-health-admin-status');
  assert.equal(old.status, 'review overdue');
  assert.ok(data.pro.length >= 20);
  assert.ok(data.pro.every(row => row.next && row.route));
  assert.equal(data.pro.find(row => row.id === 'books').status, 'shell');
});

test('dashboard and generated snapshot remain outside publish boundaries', () => {
  const builder = fs.readFileSync('scripts/build-dist.js','utf8');
  assert.match(builder, /'mc-7a2f9x\.html'/);
  assert.match(builder, /'admin'/);
  const html = fs.readFileSync('mc-7a2f9x.html','utf8');
  assert.match(html, /noindex, nofollow/);
  assert.doesNotMatch(html, /lazy-analytics|supabase|admin.key|Math.random/i);
  const legacy = fs.readFileSync('admin/legacy-operations.html','utf8');
  assert.match(legacy, /mc_review_comments/);
  assert.match(legacy, /MATCHDAY_OPS_KEY/);
  assert.match(legacy, /Open current operator dashboard/);
});

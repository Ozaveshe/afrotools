'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { buildManifest } = require('../scripts/build-sw-agriculture-parity-manifest');

const ROOT = path.resolve(__dirname, '..');

test('Swahili Agriculture manifest owns the exact 447-row English scope', () => {
  const manifest = buildManifest();
  assert.equal(manifest.rows.length, 447);
  assert.equal(new Set(manifest.rows.map(row => row.english.routeKey)).size, 447);
  assert.equal(new Set(manifest.rows.map(row => row.swahili.routeKey)).size, 447);
  assert.equal(manifest.rows.filter(row => row.artwork.state === 'present').length, 447);
  assert.equal(
    manifest.rows.find(row => row.english.id === 'crop-yield-kenya').country.swahiliName,
    'Kenya'
  );
  assert.equal(manifest.rows.filter(row => row.acceptance.state === 'accepted').length, 56);
  assert.equal(
    manifest.rows.find(row => row.english.id === 'vaccination-schedule').acceptance.state,
    'accepted'
  );
  assert.equal(
    manifest.rows.filter(row => row.family === 'crop-yield' && row.acceptance.state === 'accepted').length,
    55
  );
});

test('existing Swahili Agriculture routes remain canonical owners', () => {
  const manifest = buildManifest();
  const routes = new Map(manifest.rows.map(row => [row.english.id, row.swahili.route]));
  assert.equal(routes.get('crop-yield-estimator'), '/sw/zana/makisio-ya-mavuno/');
  assert.equal(routes.get('crop-yield-kenya'), '/sw/kilimo/mavuno/kenya/');
  assert.equal(routes.get('vaccination-schedule'), '/sw/zana/ratiba-ya-chanjo-za-mifugo/');
  assert.equal(routes.get('farm-loans-hub'), '/sw/zana/ustahiki-wa-mkopo-wa-shamba/');
});

test('all manifest output files stay inside the Swahili source tree', () => {
  const manifest = buildManifest();
  for (const row of manifest.rows) {
    assert.match(row.swahili.file, /^sw\//);
    assert.equal(path.resolve(ROOT, row.swahili.file).startsWith(path.join(ROOT, 'sw') + path.sep), true);
  }
});

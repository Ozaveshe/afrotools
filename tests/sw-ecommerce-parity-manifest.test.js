'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildManifest } = require('../scripts/build-sw-ecommerce-parity-manifest');

test('Swahili Ecommerce manifest owns exactly 63 rows with coordinator acceptance reconciled', () => {
  const manifest = buildManifest();
  assert.equal(manifest.rows.length, 63);
  assert.equal(new Set(manifest.rows.map(row => row.english.id)).size, 63);
  assert.equal(manifest.families.reduce((sum, family) => sum + family.rowCount, 0), 63);
  assert.equal(manifest.rows.filter(row => row.acceptance.state === 'accepted-scoped').length, 3);
  assert.equal(manifest.rows.filter(row => row.acceptance.state === 'pending').length, 60);
});

test('every row resolves an exact maintained English owner contract', () => {
  const manifest = buildManifest();
  for (const row of manifest.rows) {
    assert.ok(row.english.file);
    assert.ok(row.owners.englishEngine.length);
    assert.ok(row.owners.englishController.length);
    assert.equal(row.productContract.preserveEnglishInputsOutputs, true);
  }
});

test('pricing foundations is the bounded first family', () => {
  const manifest = buildManifest();
  const rows = manifest.rows.filter(row => row.family === 'pricing-foundations');
  assert.deepEqual(rows.map(row => row.english.id), ['profit-margin', 'markup-calc', 'discount-calc']);
  assert.equal(rows.every(row => row.swahili.file && row.swahili.ownerState === 'mapped-accepted-scoped'), true);
  assert.equal(rows.every(row => row.acceptance.state === 'accepted-scoped'), true);
});

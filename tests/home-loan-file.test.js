const test = require('node:test');
const assert = require('node:assert/strict');
const file = require('../assets/js/pages/home-loan-file.js');

test('summarizes administrative evidence states without a score', () => {
  assert.deepEqual(file.summarize(['ready', 'gathering', 'update', 'not-started', 'not-requested']), {
    valid: true,
    total: 5,
    required: 4,
    counts: { ready: 1, gathering: 1, update: 1, open: 1, excluded: 1 }
  });
});

test('accepts at most twenty known evidence states', () => {
  assert.equal(file.summarize(new Array(20).fill('ready')).valid, true);
  assert.equal(file.summarize(new Array(21).fill('ready')).valid, false);
  assert.equal(file.summarize(['approved']).valid, false);
  assert.equal(file.summarize([]).valid, false);
  assert.equal(file.summarize(null).valid, false);
});

test('bounds optional non-sensitive labels at eighty characters', () => {
  assert.equal(file.cleanLabel('  Bank A  '), 'Bank A');
  assert.equal(file.cleanLabel('x'.repeat(80)), 'x'.repeat(80));
  assert.equal(file.cleanLabel('x'.repeat(81)), null);
  assert.equal(file.cleanLabel(null), '');
});

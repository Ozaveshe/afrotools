const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { build } = require('../scripts/build-sw-fuel-tracker');

test('fuel regeneration preserves one primary heading alongside both workflows', () => {
  const page = fs.readFileSync('sw/zana/ufuatiliaji-bei-za-mafuta/index.html', 'utf8');
  const regenerated = build(page);
  assert.equal((regenerated.match(/<h1\b/gi) || []).length, 1);
  assert.match(regenerated, /id="fuel-finder"/);
  assert.match(regenerated, /id="sw-fuel-form"/);
  assert.equal(build(regenerated), regenerated);
});

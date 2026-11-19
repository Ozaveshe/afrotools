const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const rules = fs.readFileSync(path.join(root, '_redirects'), 'utf8')
  .split(/\r?\n/).filter(line => line.startsWith('/'))
  .map(line => line.trim().split(/\s+/));

test('Swahili agriculture aliases match the accepted hub and country owners', () => {
  const fallback = rules.findIndex(([source]) => source === '/sw/agriculture/*');
  assert.ok(fallback >= 0, 'Keep the fallback for routes without a localized owner');
  const families = /^\/agriculture\/(coffee-calculator|fertilizer|greenhouse|seed-rate)\//;
  const expected = new Map();
  for (const { english, swahili } of manifest.rows.filter(row => families.test(row.english.route))) {
    expected.set('/sw' + english.route, swahili.route);
    if (!english.route.endsWith('/')) expected.set('/sw' + english.route + '.html', swahili.route);
  }
  const aliases = rules.slice(0, fallback).filter(([source]) => families.test(source.slice(3)) && source.startsWith('/sw/'));
  assert.equal(aliases.length, expected.size);
  for (const [source, destination, status] of aliases) {
    assert.equal(destination, expected.get(source), source);
    assert.equal(status, '301', source);
    expected.delete(source);
  }
  assert.equal(expected.size, 0);
});

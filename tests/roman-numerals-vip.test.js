'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const engine = require('../tools/roman-numerals/roman-numerals-engine.js');

test('converts canonical boundary and subtractive values', () => {
  assert.equal(engine.toRoman(1), 'I');
  assert.equal(engine.toRoman(4), 'IV');
  assert.equal(engine.toRoman(944), 'CMXLIV');
  assert.equal(engine.toRoman(3999), 'MMMCMXCIX');
  assert.equal(engine.fromRoman('mcmxciv'), 1994);
});

test('rejects values outside the supported convention', () => {
  for (const value of [0, -1, 1.5, 4000, Infinity, NaN]) {
    assert.equal(engine.toRoman(value), null);
  }
  for (const value of ['', 'IIII', 'IL', 'IC', 'VX', 'MMMM', 'abc']) {
    assert.equal(engine.fromRoman(value), null);
  }
});

test('does not partially parse malformed decimal input', () => {
  for (const value of ['12abc', '12.5', '1e3', '+12', '0012', '4,000']) {
    assert.equal(engine.convert(value).ok, false, value);
  }
  assert.deepEqual(
    engine.explainDecimal(2024),
    [{ value: 2000, symbols: 'MM' }, { value: 20, symbols: 'XX' }, { value: 4, symbols: 'IV' }]
  );
});

test('batch conversion reports invalid rows and enforces its limit', () => {
  const batch = engine.convertBatch('42\nXLII\n12abc\n0');
  assert.equal(batch.rows[0].result.output, 'XLII');
  assert.equal(batch.rows[1].result.output, '42');
  assert.equal(batch.rows[2].result.ok, false);
  assert.equal(batch.rows[3].result.ok, false);

  const limited = engine.convertBatch('1\n2\n3', 2);
  assert.equal(limited.rows.length, 2);
  assert.equal(limited.truncated, true);
});

test('quiz checking requires an exact canonical answer', () => {
  assert.equal(engine.checkQuizAnswer('toRoman', 4, 'IV'), true);
  assert.equal(engine.checkQuizAnswer('toRoman', 4, 'IIII'), false);
  assert.equal(engine.checkQuizAnswer('toDecimal', 12, '12'), true);
  assert.equal(engine.checkQuizAnswer('toDecimal', 12, '12abc'), false);
  assert.equal(engine.checkQuizAnswer('toDecimal', 12, '12.0'), false);
});

test('page does not add a competing local font stack', () => {
  const html = fs.readFileSync(path.join(__dirname, '../tools/roman-numerals/index.html'), 'utf8');
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|DM Sans/);
});

test('search metadata stays parseable and describes the implemented scope', () => {
  const html = fs.readFileSync(path.join(__dirname, '../tools/roman-numerals/index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]));
  assert.ok(scripts.some(item => Array.isArray(item['@type']) && item['@type'].includes('EducationalApplication')));
  assert.ok(scripts.some(item => item['@type'] === 'HowTo'));
  assert.ok(scripts.some(item => item['@type'] === 'FAQPage' && item.mainEntity.length === 4));
  assert.match(html, /convert up to 200 rows locally/i);
});

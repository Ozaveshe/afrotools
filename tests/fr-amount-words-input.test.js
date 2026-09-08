'use strict';
const assert = require('node:assert/strict');
const input = require('../assets/js/pages/fr-amount-words-input');
const maximum = '999999999999';
for (const [raw, canonical] of [
  ['1.005', '1.01'], ['0.005', '0.01'], ['2.675', '2.68'], ['999.995', '1000.00'],
  ['1,250.75', '1250.75'], ['1 250,75', '1250.75'], ['1\u202f250,75', '1250.75'],
  ['1\u00a0250.75', '1250.75'], ['1250,75', '1250.75'], ['1 250,755', '1250.76'],
  ['1,250,000', '1250000.00'], ['0', '0.00'], ['1', '1.00'],
  ['999999999999.99', '999999999999.99']
]) assert.equal(input.parse(raw, maximum).canonical, canonical, raw);
for (const raw of ['', 'abc', '-1', '+1', '1e3', '1.2.3', '1,250', '1,005', '12 50,75',
  '1,25.75', 'NGN 1', '999999999999.995', '1000000000000']) {
  const result = input.parse(raw, maximum);
  assert.equal(result.valid, false, raw);
  assert.ok(result.error, raw);
}
console.log('French amount-word grammar: 14 valid and 13 invalid fixtures passed.');

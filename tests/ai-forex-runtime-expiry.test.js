'use strict';
const assert = require('node:assert/strict');
const { guardForexContext } = require('../netlify/functions/_shared/ai-tool-context-freshness.js');
const advisor = require('../netlify/functions/ai-advisor.js');
const generated = require('../netlify/functions/_shared/ai-tool-context.generated.js');
const freshness = require('../netlify/functions/_shared/ai-tool-context-freshness.generated.js');
const keys = ['currency-converter', 'convertisseur-devises-fr', 'zana-kibadilishaji-sarafu-sw'];
const asOf = '2026-10-07T00:00:00.000Z';
const timestamp = Date.parse(asOf);
const sample = 'Synthetic rate-bearing context: 1 USD = 123 TEST';
for (const key of keys) {
  const records = { [key]: { asOf, maxAgeDays: 7 } };
  for (const delta of [0, 7 * 86400000, 8 * 86400000 - 1]) {
    assert.equal(guardForexContext(key, sample, timestamp + delta, records), sample);
  }
  for (const delta of [-1, 8 * 86400000, 100 * 86400000]) {
    const result = guardForexContext(key, sample, timestamp + delta, records);
    assert.doesNotMatch(result, /123 TEST|1 USD =/);
    assert.match(result, /Do not quote or infer/);
  }
  for (const record of [undefined, null, {}, { asOf: 'invalid', maxAgeDays: 7 }, { asOf, maxAgeDays: 99 }]) {
    assert.doesNotMatch(guardForexContext(key, sample, timestamp, { [key]: record }), /123 TEST|1 USD =/);
  }
  // Load once, then move the clock across expiry: a warm function must recheck.
  assert.ok(freshness[key], key + ' needs generated source-bound metadata');
  const sourceTime = Date.parse(freshness[key].asOf);
  assert.ok(Number.isFinite(sourceTime));
  const savedNow = Date.now;
  try {
    Date.now = () => sourceTime;
    assert.equal(advisor.__test__.getToolContext(key), generated[key]);
    Date.now = () => sourceTime + 8 * 86400000;
    const expired = advisor.__test__.getToolContext(key);
    assert.doesNotMatch(expired, /1 USD =/);
    assert.match(expired, /Do not quote or infer/);
    assert.equal(advisor.__test__.getToolContext('investment-return'), generated['investment-return']);
  } finally { Date.now = savedNow; }
}
assert.equal(guardForexContext('unrelated', sample, NaN, null), sample);
console.log('ai-forex-runtime-expiry.test.js passed');

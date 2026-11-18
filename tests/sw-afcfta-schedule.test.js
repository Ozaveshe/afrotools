const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculate, rows } = require('../assets/js/pages/sw-afcfta-schedule');
const { AFCFTA_DATA } = require('../data/trade/afcfta-schedule');
const { HS_DATABASE } = require('../data/trade/hs-codes-database');
const original = { origin:'KE', destination:'GH', hsCode:'0901', year:2026 };
const run = edit => calculate({...original,...edit}, AFCFTA_DATA, HS_DATABASE);

test('destination determines the general schedule; product-specific duty is unknown', () => {
  assert.equal(run({}).categoryAReductionPercent,null);
  assert.equal(run({origin:'GH',destination:'KE'}).categoryAReductionPercent,60);
  assert.equal(run({origin:'GH',destination:'KE',year:2031}).categoryAReductionPercent,null);
  assert.equal(run({hsCode:'8502'}).classificationReference.description,'Electric generating sets');
  assert.equal(run({hsCode:'0901.11'}).classificationReference.code,'0901.11');
  assert.equal(run({hsCode:'0901110000'}).productDutyPercent,null);
});
test('sensitivity hints require a matching HS range in the importing country', () => {
  assert.match(run({origin:'GH',destination:'KE',hsCode:'0402.10'}).sensitiveProductHint,/Milk/);
  assert.equal(run({origin:'GH',destination:'KE',hsCode:'0403'}).sensitiveProductHint,null);
  assert.equal(run({hsCode:'1006'}).sensitiveProductHint,null);
  assert(rows(run({})).some(([,value])=>value.includes('Hakijathibitishwa')));
});
test('invalid input never produces a general or product result', () => {
  for (const code of ['abcd','9','09011','0901...11','+0901', '0901/11','']) assert.throws(()=>run({hsCode:code}));
  assert.throws(()=>run({destination:'KE'}));
  assert.throws(()=>run({year:'20x6'}));
});

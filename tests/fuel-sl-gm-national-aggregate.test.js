'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { projectNationalPumpPrices, countryPageRows } = require('../scripts/lib/fuel-country-reference');
const { merge } = require('../assets/js/lib/fuel-market-observations');
const markets = require('../data/fuel/markets.json');
const snapshot = require('../data/fuel/latest.json');
const now = '2026-11-27T00:00:00Z';
const expected = {SL:[40,45], GM:[109.8,120]};

for (const [code, prices] of Object.entries(expected)) {
  test(code + ' projects dated national prices and preserves unrelated products', () => {
    const old = snapshot.countries.find(row => row.code === code);
    const row = projectNationalPumpPrices(old, markets, now);
    assert.deepEqual([row.petrol.price,row.diesel.price],prices);
    assert.equal(row.lpg,old.lpg);
    assert.equal(row.last_updated,old.last_updated);
    assert.equal(row.official_verified,false);
    for (const item of [row.petrol,row.diesel]) {
      assert.equal(item.usd,null);
      assert.equal(item.unit,'liter');
      assert.equal(item.change_pct,undefined);
      assert.equal(item.historical,false);
      assert.equal(item.observed_at,code === 'SL' ? '2026-10-28' : '2026-11-01');
      assert.ok(item.source_url.startsWith('https:'));
    }
    assert.deepEqual(projectNationalPumpPrices(row,markets,now),row);
    const page = countryPageRows({countries:[row]},markets,now)[0];
    assert.equal(page.references.petrol.date_basis,'effective');
    assert.equal(page.references.diesel.valid_to,code === 'GM' ? '2026-11-30' : undefined);
    assert.deepEqual(merge(markets.markets,{countries:[row]},now),markets.markets);
    const newer = {...old.petrol,price:146,observed_at:'2026-11-29'};
    const partial = projectNationalPumpPrices({...old,petrol:newer},markets,'2026-11-30');
    assert.equal(partial.petrol,newer);
    assert.equal(partial.diesel.price,prices[1]);
  });
}
test('Gambia expires at the end of November and never acquires a December effective date', () => {
  const old = snapshot.countries.find(row => row.code === 'GM');
  const nov = projectNationalPumpPrices(old,markets,'2026-11-30T23:59:00Z');
  const dec = projectNationalPumpPrices(nov,markets,'2026-12-01T00:00:00Z');
  assert.equal(nov.petrol.historical,false);
  assert.equal(dec.petrol.historical,true);
  assert.equal(dec.diesel.valid_to,'2026-11-30');
  assert.equal(dec.petrol.effective_date,'2026-11-01');
});
test('all other country objects, wrong currency, future and absent schedules are preserved', () => {
  for (const row of snapshot.countries.filter(row => !(row.code in expected))) {
    assert.equal(projectNationalPumpPrices(row,markets,now),row);
  }
  const old = snapshot.countries.find(row => row.code === 'SL');
  const wrong = {...old,currency:'SLL'};
  assert.equal(projectNationalPumpPrices(wrong,markets,now),wrong);
  assert.equal(projectNationalPumpPrices(old,markets,'2026-05-01'),old);
  assert.equal(projectNationalPumpPrices(old,{markets:[]},now),old);
});

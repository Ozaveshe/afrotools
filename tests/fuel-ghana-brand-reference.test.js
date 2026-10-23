'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../assets/js/engines/fuel-tracker-engine.js');
const observations = require('../assets/js/lib/fuel-market-observations.js');
const copy = require('../assets/js/lib/fuel-market-copy.js');
const dataset = require('../data/fuel/markets.json');
const gh = dataset.markets.find(m => m.market_id === 'gh-goil-published-reference');
const petrol = engine.marketRecord(gh, 'petrol');
const diesel = engine.marketRecord(gh, 'diesel');

test('Ghana is enrolled as a named brand, without a fabricated station location', () => {
  assert.equal(engine.validateDataset(dataset).valid, true);
  assert.equal(gh.country_code, 'GH');
  assert.equal(gh.granularity, 'brand');
  assert.equal(gh.locality_name, 'Ghana — GOIL');
  assert.equal(gh.latitude, null);
  assert.equal(gh.longitude, null);
  assert.equal(engine.nearestMarket([gh],5.56,-0.2), null);
  assert.equal(engine.validateDataset({...dataset,markets:[{...gh,latitude:5.56,longitude:-0.2}]}).valid,false);
});

test('dated operator announcement remains different from a current or national quote', () => {
  assert.equal(petrol.price,16.64);
  assert.equal(diesel.price,18.46);
  for (const r of gh.fuels) {
    assert.equal(r.effective_date,'2026-09-17');
    assert.equal(r.last_verified_at,'2026-10-23');
    assert.equal(r.source_url,'https://goil.com.gh/new-fuel-prices/');
    assert.equal(r.price_kind,'brand-published-retail');
    assert.equal(r.valid_to,undefined);
    assert.match(r.notes,/does not establish that the price is unchanged today/);
    assert.equal(observations.status(r,'2026-10-23',45).basis,'brand-reference');
  }
});

test('Ghana petrol quantity and diesel tank budgets produce useful amounts', () => {
  const p=engine.calculateFillCost({pricePerLitre:petrol.price,mode:'quantity',quantity:20,unit:'litre'});
  assert.equal(p.ok,true); assert.ok(Math.abs(p.totalCost-332.8)<1e-8);
  const d=engine.calculateFillCost({pricePerLitre:diesel.price,mode:'tank',tankSize:50,currentLevelPct:25,unit:'litre'});
  assert.equal(d.ok,true); assert.equal(d.litres,37.5); assert.ok(Math.abs(d.totalCost-692.25)<1e-8);
});

test('normal age policy still changes the GOIL publication into explicit historical planning', () => {
  assert.equal(observations.status(petrol,'2026-11-01T23:59:59Z',45).ageDays,45);
  assert.equal(observations.status(petrol,'2026-11-01T23:59:59Z',45).basis,'brand-reference');
  const s=observations.status(petrol,'2026-11-02T00:00:00Z',45);
  assert.equal(s.ageDays,46);
  assert.equal(s.available,false); assert.equal(s.historical,true); assert.equal(s.basis,'historical-estimate');
  assert.equal(observations.status({...petrol,source_url:''},'2026-10-23',45).valid,false);
});

test('a genuine newer Ghana national feed cannot overwrite the named GOIL publication', () => {
  const feed={countries:[{code:'GH',name:'Ghana',currency:'GHS',last_updated:'2026-10-22',source_url:'https://example.test/dated-national',petrol:{price:17.2,unit:'liter',observed_at:'2026-10-21'}}]};
  const merged=observations.merge([gh],feed,'2026-10-23');
  assert.equal(merged.length,2);
  assert.deepEqual(merged.find(m=>m.market_id===gh.market_id),gh);
  assert.equal(merged.find(m=>m.granularity==='national').fuels[0].price,17.2);
});

test('brand and date survive the export context, with translated visible labels', () => {
  const context=observations.priceContext(gh,petrol,'brand-reference');
  assert.equal(context.name,'Ghana — GOIL'); assert.equal(context.granularity,'brand');
  assert.equal(context.effectiveDate,'2026-09-17'); assert.equal(context.priceKind,'brand-published-retail');
  for (const locale of ['en','fr','sw']) {
    assert.ok(copy.get(locale,'brand').length>10);
    assert.ok(copy.get(locale,'brand-reference').length>15);
  }
});

test('manual pump override can replace the published starting price without altering source data', () => {
  const r=engine.calculateFillCost({pricePerLitre:17.1,mode:'quantity',quantity:20,unit:'litre'});
  assert.equal(r.ok,true); assert.equal(r.totalCost,342); assert.equal(petrol.price,16.64);
});

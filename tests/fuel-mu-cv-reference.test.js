'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const data=require('../data/fuel/markets.json'),engine=require('../assets/js/engines/fuel-tracker-engine'),observations=require('../assets/js/lib/fuel-market-observations');
const market=code=>data.markets.find(m=>m.country_code===code);
test('official national references validate without fabricated station coordinates or LPG',()=>{
 assert.equal(engine.validateDataset(data).valid,true);
 for(const code of ['MU','CV']){const m=market(code);assert.equal(data.markets.filter(x=>x.country_code===code).length,1);assert.equal(m.latitude,null);assert.equal(m.longitude,null);assert.equal(m.granularity,'national');assert.deepEqual(m.fuels.map(r=>r.fuel_type),['petrol','diesel']);for(const r of m.fuels){assert.equal(r.unit,'litre');assert.equal(r.date_basis,'effective');assert.equal(r.last_verified_at,'2026-11-07');assert.equal(observations.status(r,'2026-11-07').available,true);}}
});
test('20 litre budgets use actual official product values and currencies',()=>{
 for(const [code,currency,values,totals] of [['MU','MUR',[77.7,78.35],[1554,1567]],['CV','CVE',[189.3,185.8],[3786,3716]]])for(let i=0;i<2;i++){const r=market(code).fuels[i];assert.equal(r.price,values[i]);assert.equal(r.currency,currency);assert.equal(engine.calculateFillCost({pricePerLitre:r.price,quantity:20}).totalCost,totals[i]);}
});
test('effective date, cap end date and conservative ageing remain distinct from verification',()=>{
 const mu=market('MU').fuels[0],cv=market('CV').fuels[1];assert.equal(mu.effective_date,'2026-09-29');assert.equal(mu.valid_to,undefined);assert.equal(observations.status(mu,'2026-11-14').available,true);assert.equal(observations.status(mu,'2026-12-23').historical,true);assert.equal(cv.valid_to,'2026-11-30');assert.equal(observations.status(cv,'2026-12-02').historical,true);
 const context=observations.priceContext(market('CV'),cv,'market-reference');assert.equal(context.priceKind,'regulated-retail-cap');assert.equal(context.effectiveDate,'2026-11-01');assert.equal(context.validTo,'2026-11-30');assert.match(context.notes,/road diesel/);
});
test('older fallback cannot replace verified petrol and diesel and manual quote remains usable',()=>{
 const fallback={countries:[{code:'MU',name:'Mauritius',currency:'MUR',last_updated:'2026-03-01',source_url:'https://example.test/old',petrol:{price:74,unit:'liter'},diesel:{price:59,unit:'liter'}}]};assert.deepEqual(observations.merge([market('MU')],fallback,'2026-11-07'),[market('MU')]);assert.equal(engine.calculateFillCost({pricePerLitre:80,quantity:20}).totalCost,1600);assert.equal(market('MU').fuels[0].price,77.7);
});

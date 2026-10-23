const test = require('node:test');
const assert = require('node:assert/strict');
const dataset = require('../data/fuel/markets.json');
const engine = require('../assets/js/engines/fuel-tracker-engine');
const observations = require('../assets/js/lib/fuel-market-observations');
const id = 'za-gauteng-9c-petrol95-2026-10';
const market = () => { const row = dataset.markets.find(m => m.market_id === id); assert.ok(row, 'Gauteng 95 RON regional price must be selectable'); return row; };
const now = '2026-10-23T12:00:00.000Z';
test('official October petrol95 schedule is a regional reference, not a national or diesel pump quote', () => {
 const m = market(), r = m.fuels[0]; assert.equal(engine.validateDataset(dataset).valid, true);
 assert.equal(m.country_code, 'ZA'); assert.equal(m.granularity, 'region'); assert.match(m.locality_name, /Gauteng.*9C.*95 RON/);
 assert.equal(engine.granularityLabel(m.granularity), 'Regional reference'); assert.equal(m.fuels.length, 1); assert.equal(r.fuel_type, 'petrol');
 assert.equal(r.price, 3025 / 100); assert.equal(r.currency, 'ZAR'); assert.equal(r.unit, 'litre'); assert.equal(r.effective_date, '2026-10-07');
 assert.equal(r.price_kind, 'regulated-retail'); assert.match(r.source_url, /^https:\/\/www\.dmpr\.gov\.za\//); assert.match(r.source_url, /ItemId=3501/);
 assert.match(r.notes, /wholesale/); assert.equal(engine.marketRecord(m, 'diesel'), null);
});
test('twenty litres gives R605 and carries exact product, region, date and source into export context', () => {
 const m=market(), r=m.fuels[0], s=observations.status(r,now), context=observations.priceContext(m,r,s.basis);
 assert.equal(s.available,true); assert.equal(engine.calculateFillCost({pricePerLitre:r.price,quantity:20,mode:'quantity',unit:'litre'}).totalCost,605);
 assert.equal(context.granularity,'region'); assert.match(context.name,/95 RON/); assert.equal(context.effectiveDate,'2026-10-07'); assert.equal(context.sourceUrl,r.source_url); assert.equal(context.priceKind,'regulated-retail');
});
test('a newer country snapshot cannot overwrite the scoped regulator regional price', () => {
 const m=market(); const merged=observations.merge([m],{countries:[{code:'ZA',name:'South Africa',currency:'ZAR',last_updated:'2026-10-22',source_url:'https://example.test/country-snapshot',petrol:{price:10,unit:'litre'}}]},now);
 assert.deepEqual(merged.find(r=>r.market_id===id),m); assert.equal(merged.find(r=>r.granularity==='national').fuels[0].price,10);
});
test('future verification is rejected and a reviewed reference becomes historical without changing its amount or date', () => {
 const r=market().fuels[0]; assert.equal(observations.status(r,'2026-10-07T12:00:00Z').available,false); // Verification must not be future-dated.
 assert.equal(observations.status(r,now).available,true); const late=observations.status(r,'2026-12-01T12:00:00Z'); assert.equal(late.historical,true); assert.equal(late.basis,'historical-estimate'); assert.equal(r.price,30.25); assert.equal(r.effective_date,'2026-10-07');
});
test('location matching points to a named regional reference rather than claiming a nearby station', () => {
 const m=market(), n=engine.nearestMarket([m],-26.2096,28.0462); assert.equal(n.market.market_id,id); assert.equal(n.distanceKm,0); assert.match(m.coverage_note,/not a station/); assert.match(m.coordinate_source_url,/statssa\.gov\.za/);
});

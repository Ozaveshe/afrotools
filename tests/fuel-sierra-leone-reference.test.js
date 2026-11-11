'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const data=require('../data/fuel/markets.json');
const engine=require('../assets/js/engines/fuel-tracker-engine');
const observations=require('../assets/js/lib/fuel-market-observations');
const copy=require('../assets/js/lib/fuel-market-copy');
const market=()=>{const rows=data.markets.filter(m=>m.country_code==='SL');assert.equal(rows.length,1,'one maintained Sierra Leone reference');return rows[0];};
const record=type=>engine.marketRecord(market(),type);
const now='2026-11-07';
test('NPRA effective-date reference uses new leones per litre and no unsupported product or station',()=>{
 assert.equal(engine.validateDataset(data).valid,true);const m=market();assert.equal(m.market_id,'sl-national-npra');assert.equal(m.granularity,'national');assert.equal(m.latitude,null);assert.equal(m.longitude,null);assert.match(m.coverage_note,/SLE \(new leones\).*not old SLL/);assert.deepEqual(m.fuels.map(r=>r.fuel_type),['petrol','diesel']);assert.equal(engine.marketRecord(m,'lpg'),null);
 for(const r of m.fuels){assert.equal(r.currency,'SLE');assert.equal(r.unit,'litre');assert.equal(r.effective_date,'2026-10-28');assert.equal(r.last_verified_at,'2026-11-07');assert.equal(r.date_basis,'effective');assert.equal(r.price_kind,'regulated-retail');assert.equal(r.source_url,'https://pra.gov.sl/pricing-formula');assert.equal(r.valid_to,undefined);assert.match(r.notes,/1 SLE equals 1,000 old SLL/);assert.match(r.notes,/No published end date/);assert.match(r.source_name,/National Petroleum Regulatory Authority/);}
});
test('20 litres costs800 SLE petrol or900 SLE diesel, never800000 old-unit amounts',()=>{
 assert.equal(record('petrol').price,40);assert.equal(record('diesel').price,45);
 assert.equal(engine.calculateFillCost({pricePerLitre:record('petrol').price,quantity:20}).totalCost,800);
 assert.equal(engine.calculateFillCost({pricePerLitre:record('diesel').price,quantity:20}).totalCost,900);
 const label=new Intl.NumberFormat('en',{style:'currency',currency:record('petrol').currency}).format(800);assert.match(label,/SLE/);assert.doesNotMatch(label,/SLL|800,000/);
});
test('tank remainder and US-gallon conversion retain litre price arithmetic',()=>{
 assert.equal(engine.calculateFillCost({pricePerLitre:40,mode:'tank',tankSize:50,currentLevelPct:40,unit:'litre'}).totalCost,1200);
 const gallon=engine.calculateFillCost({pricePerLitre:45,quantity:2,unit:'gallon'});assert.equal(gallon.litres,7.570823568);assert.equal(gallon.totalCost,7.570823568*45);
});
test('dated reference/export context retains official source, SLE and effective rather than observed date',()=>{
 const r=record('petrol'),status=observations.status(r,now),context=observations.priceContext(market(),r,status.basis);assert.equal(status.available,true);assert.equal(status.basis,'market-reference');assert.equal(context.effectiveDate,'2026-10-28');assert.equal(context.observationDate,null);assert.equal(context.lastVerifiedAt,'2026-11-07');assert.equal(context.currency,'SLE');assert.equal(context.sourceUrl,r.source_url);assert.equal(context.granularity,'national');assert.equal(context.priceKind,'regulated-retail');assert.match(context.notes,/station-stock/);
});
test('45-day threshold becomes historical without advancing effective or verification dates',()=>{
 const r=record('diesel'),before=JSON.stringify(r);assert.equal(observations.status(r,'2026-12-12').available,true);const late=observations.status(r,'2026-12-13');assert.equal(late.available,false);assert.equal(late.historical,true);assert.equal(late.basis,'historical-estimate');assert.equal(engine.recordStatus(r,'2026-12-13',data.stale_after_days).stale,true);assert.equal(JSON.stringify(r),before);
 assert.equal(observations.status(r,'2026-10-27').valid,false);assert.equal(observations.status(r,'2026-11-06').valid,false);
});
test('existing country snapshot without usable source cannot create or overwrite a finder quote',()=>{
 const snapshot={countries:[{code:'SL',name:'Sierra Leone',currency:'SLE',last_updated:'2026-03-08',source:'globalpetrolprices',petrol:{price:30,unit:'liter'},diesel:{price:30,unit:'liter'}}]};assert.deepEqual(observations.merge([],snapshot,now),[]);assert.deepEqual(observations.merge([market()],snapshot,now),[market()]);
});
test('older source-linked snapshot cannot downgrade the regulator reference; malformed newer price is rejected',()=>{
 const snapshot={countries:[{code:'SL',name:'Sierra Leone',currency:'SLE',last_updated:'2026-03-08',source_url:'https://example.test/dated',petrol:{price:30,unit:'liter'}}]};assert.deepEqual(observations.merge([market()],snapshot,now),[market()]);snapshot.countries[0].last_updated='2026-11-07';snapshot.countries[0].petrol.price=-1;assert.deepEqual(observations.merge([market()],snapshot,now),[market()]);
});
test('manual local quote and invalid-input guards remain useful without changing official reference',()=>{
 const r=record('petrol');assert.equal(engine.calculateFillCost({pricePerLitre:42.5,quantity:20}).totalCost,850);assert.equal(r.price,40);for(const price of [0,-1,NaN])assert.equal(engine.calculateFillCost({pricePerLitre:price,quantity:20}).ok,false);
});

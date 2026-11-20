const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const Price=require('../assets/js/lib/car-price-intelligence');
const Import=require('../assets/js/lib/car-import-cost-engine');
const read=name=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',name),'utf8'));
const data=read('data/cars/price-intelligence.json');
const imports=Import.mergeData(read('data/trade/car-import-cost-core.json'),['ng','ke','gh','ug','tz','zm'].map(c=>read(`data/trade/car-import-cost-${c}.json`)),read('data/forex/latest.json').rates);
const rows=Price.filterVehicles(data,{country:'NG'},imports);
test('full Nigeria catalog retains petrol, diesel and out-of-band model browsing',()=>{
 assert.equal(rows.length,data.vehicles.length);
 const known=rows.find(v=>v._context.landed.normal>0);
 const diesel=rows.find(v=>v.fuel[0]==='diesel');
 const big=rows.find(v=>v.cc[0]>3000);
 assert(known);assert(diesel);assert(big);
 for(const v of [diesel,big]) {
  const ctx=v._context;
  assert.equal(ctx.landed.normal,null);assert.equal(ctx.landed.best,null);assert.equal(ctx.landed.painful,null);
  assert(ctx.sourcePrice.median>0);assert.equal(ctx.recommendation.status,'scenario-required');
  assert.equal(ctx.financing.bestOffer,null);assert.deepEqual(ctx.financing.offers,[]);
  const exported=Price.buildAiContext(ctx);assert.equal(exported.landedCost.normal,null);assert.equal(exported.landedCost.officialTaxesUsd,null);
  const link=new URL(ctx.calculatorUrl,'https://afrotools.com');
  assert.equal(link.searchParams.get('price'),String(Math.round(ctx.sourcePrice.median)));
  assert.equal(link.searchParams.get('fuelType'),v.fuel[0]);assert.equal(link.searchParams.get('bodyType'),v.body);
  assert.equal(link.searchParams.get('newQuote'),'1');
 }
 assert(known._context.aiContext.landedCost.normal>0);
});
test('unknown cost is not zero, cheapest, budget-qualified or a finance offer',()=>{
 const known=rows.find(v=>v._context.landed.normal>0),unknown=rows.find(v=>v._context.landed.normal===null);
 const mixed=[unknown,known].sort((a,b)=>Price.compareKnownCosts(a._context.landed.normal,b._context.landed.normal));
 assert.equal(mixed[0].id,known.id);assert.equal(mixed[1].id,unknown.id);
 const filtered=Price.filterVehicles(data,{country:'NG',maxLanded:known._context.landed.normal+1},imports);
 assert(filtered.some(v=>v.id===known.id));assert(filtered.every(v=>v._context.landed.normal!==null));
 assert.equal(Price.formatMoney(null,'NGN'),'Choose charge assumptions');
 assert(!Price.formatMoney(known._context.landed.normal,'USD').includes('Choose'));
 assert.equal(unknown._context.financing.bestOffer,null);
});
test('explicit custom inputs restore a useful diesel total without changing the seller price',()=>{
 const vehicle=rows.find(v=>v.fuel[0]==='diesel');
 const ctx=Price.buildVehicleContext(data,imports,{countryCode:'NG',vehicle,overrides:{ngScenario:'custom',ngRates:{duty:20,levy:5,etls:0,surcharge:7,fob:1,green:2,vat:7.5}}});
 assert(ctx.landed.normal>ctx.sourcePrice.median);assert.equal(ctx.landed.normalResult.valueBasis.fobUsd,ctx.sourcePrice.median);
 assert(ctx.landed.best>0);assert(ctx.landed.painful>=ctx.landed.normal);
 assert.equal(ctx.landed.normalResult.ngAssessment.label,'Custom assumptions');
});

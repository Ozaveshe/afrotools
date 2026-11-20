const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Engine=require('../assets/js/lib/src/car-import-cost-engine');
const read=file=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
const data=Engine.mergeData(read('data/trade/car-import-cost-core.json'),['ng','ke','gh','ug','tz','zm'].map(c=>read(`data/trade/car-import-cost-${c}.json`)),{NGN:1355.3036,KES:129.45,GHS:14.89,UGX:3720,ZMW:27.5,TZS:2650});
const input={countryCode:'NG',condition:'used',fuelType:'petrol',engineCc:2500,vehicleClass:'sedan',year:2020,sourceMarket:'japan',inputMode:'fob',fobUsd:9000,freightUsd:900,insuranceUsd:100,asOfDate:'2026-11-20',outputMode:'official',ngScenario:'portal-8703232000'};
const calc=changes=>Engine.calculate({...input,...changes},data);
const rates={duty:20,levy:5,etls:0,surcharge:7,fob:1,green:2,vat:7.5};
test('dated HS example reproduces each observed portal line and VAT exclusion',()=>{
 const r=calc(), rows=r.ngAssessment.rows;
 assert.deepEqual(rows.map(x=>x.amountUsd),[2000,1500,50,140,360,0,941.25]);
 assert.deepEqual(rows.map(x=>x.baseUsd),[10000,10000,10000,2000,9000,10000,12550]);
 assert.equal(r.ngAssessment.taxesUsd,4991.25);
 assert.equal(Math.round(r.ngAssessment.taxesUsd*1355.3036*100)/100,6764659.09);
 assert.equal(r.ngAssessment.observedOn,'2026-11-20');
 assert.match(rows.at(-1).notes,/excludes vehicle levy/);
 assert.ok(!r.badges.some(x=>x.label==='official'));
});
test('comparison is separate, retains other portal assumptions and adds levy plus green to VAT',()=>{
 const r=calc(), c=r.ngAssessment.comparison;
 assert.equal(c.vatBaseUsd,14250);assert.equal(c.taxesUsd,5318.75);
 assert.equal(c.onRoadUsd-r.totals.onRoadUsd,327.5);
 assert.equal(r.breakdowns.officialTaxes.at(-1).baseUsd,12550);
 assert.match(c.note,/not a verified replacement/);
});
test('portal scope rejects new, diesel, electric, pickup and out-of-band engines',()=>{
 for(const change of [{condition:'new'},{fuelType:'diesel'},{fuelType:'ev'},{vehicleClass:'pickup'},{engineCc:1500},{engineCc:3001}]) assert.throws(()=>calc(change),/used petrol passenger/);
 assert.throws(()=>calc({ngScenario:''}),/Choose a Nigeria/);
});
test('custom assumptions accept zero exclusions and compound only the selected duty base',()=>{
 const r=calc({ngScenario:'custom',fuelType:'diesel',ngRates:rates});
 assert.equal(r.ngAssessment.taxesUsd,3899.75);assert.equal(r.ngAssessment.comparison,null);
 assert.equal(r.ngAssessment.rows.find(x=>x.id==='ng-surcharge').amountUsd,140);
 assert.equal(r.ngAssessment.rows.find(x=>x.id==='ng-etls').amountUsd,0);
 const noTaxes=Object.fromEntries(Object.keys(rates).map(key=>[key,0]));
 assert.equal(calc({ngScenario:'custom',ngRates:noTaxes}).ngAssessment.taxesUsd,0);
});
test('invalid or incomplete custom rates cannot produce an apparent total',()=>{
 for(const value of ['',null,undefined,NaN,Infinity,-1,101]) assert.throws(()=>calc({ngScenario:'custom',ngRates:{...rates,levy:value}}),/every custom charge rate/);
});
test('assessed CIF changes taxes but not known cash purchase or shipping',()=>{
 for(const change of [{inputMode:'fob'},{inputMode:'cif',cifUsd:10000},{inputMode:'purchase',purchasePriceUsd:9000,fobUsd:12345}]) {
  const r=calc({...change,customsValueUsd:12000});
  assert.equal(r.valueBasis.fobUsd,9000);assert.equal(r.valueBasis.cifUsd,10000);assert.equal(r.valueBasis.customsValueUsd,12000);
  assert.equal(r.totals.onRoadUsd,10000+r.ngAssessment.taxesUsd+r.totals.registrationUsd);
 }
});
test('green comparison threshold starts at2000; EV uses explicit custom exemption',()=>{
 assert.equal(calc({engineCc:1999}).ngAssessment.comparison.rows.find(x=>x.id==='ng-green').amountUsd,0);
 assert.equal(calc({engineCc:2000}).ngAssessment.comparison.rows.find(x=>x.id==='ng-green').amountUsd,200);
 assert.equal(calc({ngScenario:'custom',fuelType:'ev',engineCc:0,ngRates:{...rates,green:0}}).ngAssessment.rows.find(x=>x.id==='ng-green').amountUsd,0);
});
test('practical documentation allowance is separate from taxes and omitted in charges-only mode',()=>{
 const practical=calc({outputMode:'practical'}),official=calc();
 assert.equal(practical.breakdowns.practicalCosts.find(x=>x.id==='ng-port-documentation').amountUsd,90);
 assert.ok(!practical.breakdowns.officialFees.some(x=>x.id==='ng-port-documentation'));
 assert.equal(practical.ngAssessment.taxesUsd,official.ngAssessment.taxesUsd);
});
test('actual export assembler retains cash, assessed basis, rates, comparison, FX and policy limits',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../assets/js/car-import-cost.js'),'utf8');
 const start=source.indexOf('    function exportRows(result) {'),end=source.indexOf('    function I() {',start);
 assert.ok(start>0&&end>start);const context={};vm.createContext(context);vm.runInContext(source.slice(start,end)+';this.exportRows=exportRows;',context);
 const rows=context.exportRows(calc({customsValueUsd:12000}));
 assert.equal(rows.find(x=>x.label==='Cash CIF (vehicle + freight + insurance)').amount_usd,10000);
 assert.equal(rows.find(x=>x.label==='Assessed CIF used for tax').amount_usd,12000);
 const duty=rows.find(x=>x.section==='officialTaxes'&&x.label==='Import duty');assert.equal(duty.base_usd,12000);assert.equal(duty.rate_percent,20);
 assert.ok(rows.some(x=>x.section==='comparison-total'));assert.ok(rows.some(x=>x.section==='warning'));
 assert.match(rows[0].notes,/1355.3036 NGN/);assert.match(rows[0].notes,/not an official payable quote/);
 assert.ok(rows.some(x=>x.section==='source'&&x.notes.includes('nass.gov.ng')));
});

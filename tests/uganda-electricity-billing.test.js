const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../engines/src/electricity-cost-engine.js');
const billing=require('../assets/js/engines/uganda-electricity-billing.js');
const data=require('../data/energy/electricity-tariffs.json');
const standard=data.records.find(r=>r.tariff_id==='ug-uedcl-domestic-standard-q4-2026');
const lifeline=data.records.find(r=>r.tariff_id==='ug-uedcl-domestic-lifeline-q4-2026');
function prepaid(r,prior,months,money){const p=billing.prepare(r,{mode:'money_to_units',previousUnits:prior,serviceMonths:months});assert.equal(p.ok,true);return engine.calculateUnits(p.record,money);}
test('Q4 domestic provenance, validity and unchanged paused commercial scope',()=>{
 assert.equal(engine.validateDataset(data).valid,true);assert.equal(engine.recordStatus(standard,'2026-11-07').available,true);assert.equal(engine.recordStatus(standard,'2027-01-01').reason,'expired');
 assert.equal(engine.recordStatus(data.records.find(r=>r.customer_class==='commercial_low_voltage'),'2026-11-07').reason,'expired');
 assert.equal(standard.fixed_charge,3360);assert.equal(standard.taxes[0].value,18);
});
test('monthly bill includes eligible lifeline, cooking band, one service charge and VAT',()=>{
 assert.equal(engine.calculateBill(lifeline,30).total,22185.18);
 for(const units of [15,16,80,81,100,150,151]){
  const energy=Math.min(units,15)*250+Math.max(0,Math.min(units,80)-15)*779.4+Math.max(0,Math.min(units,150)-80)*412+Math.max(0,units-150)*779.4;
  assert.equal(engine.calculateBill(lifeline,units).total,Math.round((energy+3360)*118)/100);
 }
 assert.equal(engine.calculateBill(standard,100).energy_charge,70592);
});
test('first and later purchases use remaining monthly bands without charging VAT twice',()=>{
 const first=prepaid(standard,0,1,10000);assert.ok(Math.abs(first.units-(10000/1.18-3360)/779.4)<0.0001);assert.equal(first.total_charged,10000);
 const later=prepaid(standard,80,0,4861.6);assert.equal(later.units,10);assert.equal(later.fixed_charge,0);assert.equal(later.taxes[0].amount,741.6);
 assert.equal(prepaid(lifeline,15,0,9196.92).units,10);
 assert.equal(prepaid(standard,150,0,9196.92).units,10);
 const original=JSON.stringify(standard);prepaid(standard,80,2,20000);assert.equal(JSON.stringify(standard),original);
});
test('invalid billing context blocks estimates; non-Uganda/custom behavior remains untouched',()=>{
 for(const options of [{previousUnits:-1,serviceMonths:1},{previousUnits:'',serviceMonths:1},{previousUnits:0,serviceMonths:0.5},{previousUnits:0,serviceMonths:''}])assert.equal(billing.prepare(standard,{mode:'money_to_units',...options}).ok,false);
 const tz=data.records.find(r=>r.tariff_id==='tz-tanesco-d1');assert.equal(billing.prepare(tz,{}).record,tz);assert.equal(engine.calculateBill(tz,100).total,16250);
 const custom=engine.customRateRecord({rate:2.5,fixed_charge:10,tax_percent:10});assert.equal(billing.prepare(custom,{}).record,custom);assert.equal(engine.calculateUnits(custom,66).units,20);
});

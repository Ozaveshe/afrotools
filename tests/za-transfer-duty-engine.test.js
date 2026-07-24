const assert=require('assert');
const engine=require('../engines/src/za-transfer-duty-engine.js');
const base={agreementDate:'2026-07-23',vatStatus:'not-vat',otherConsideration:0};
function duty(value){return engine.calculate({...base,consideration:value,fairValue:value}).duty}
assert.equal(duty(1210000),0);
assert.equal(duty(1210001),0.03);
assert.equal(duty(1663800),13614);
assert.equal(duty(1663801),13614.06);
assert.equal(duty(2329300),53544);
assert.equal(duty(2994800),106784);
assert.equal(duty(13310000),1241456);
assert.equal(duty(13310001),1241456.13);
assert.equal(duty(2500000),67200);
const greater=engine.calculate({...base,consideration:2000000,otherConsideration:100000,fairValue:2200000});
assert.equal(greater.taxableBasis,2200000);assert.equal(greater.duty,45786);
const vat=engine.calculate({...base,consideration:2500000,fairValue:2500000,vatStatus:'vat'});assert.equal(vat.duty,0);assert.equal(vat.taxableBasis,2500000);
assert.equal(engine.calculate({...base,consideration:2500000,fairValue:2500000,agreementDate:'2026-03-31'}).error,'unsupported_date');
assert.equal(engine.calculate({...base,consideration:0,fairValue:1}).error,'invalid_consideration');
console.log('South Africa transfer-duty engine: 13 checks passed');

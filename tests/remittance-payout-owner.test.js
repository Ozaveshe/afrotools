const assert=require('node:assert/strict');
const {APPS,page,syncPayoutLabels}=require('../scripts/build-remittance-quote-parity');
const app=APPS[0],source='UNOWNED BEFORE'+page(app,'sw')+'UNOWNED AFTER';
const actual=syncPayoutLabels(source,app);assert.equal(actual,source);assert.match(actual,/>Benki</);assert.match(actual,/>Pochi ya simu</);
const legacy=source.replaceAll('>Benki<','>Bank<');assert.equal(syncPayoutLabels(legacy,app),source);
assert.throws(()=>syncPayoutLabels(source.replace('id="rm-a-payout"','id="missing"'),app),/exactly one/);
assert.throws(()=>syncPayoutLabels(source+source,app),/exactly one/);
console.log('remittance payout owner: pass');

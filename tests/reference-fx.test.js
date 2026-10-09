'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {quoteUsdToLocal,convertReferenceAmount,timestamp}=require('../netlify/functions/_shared/reference-fx');
const contracts=require('../data/calculation-quality/external-data-contracts.json');
const maxAgeMs=contracts.datasets.find(x=>x.storageKey==='forex-latest').maxAgeHours*3600000;
const options={now:'2026-10-09T05:00:00.000Z',maxAgeMs,direction:'usd-to-local',decimals:2};
const valid=()=>({schemaVersion:1,base:'USD',source:'exchangerate-api',timestamp:'2026-10-09T00:00:00.000Z',rates:{NGN:1500,KES:130},retained_rate_codes:[]});

test('known reference conversion and reverse salary conversion preserve units and inputs',()=>{
 const data=valid(),before=JSON.stringify(data);
 assert.equal(convertReferenceAmount(300,'NGN',data,options).converted_amount,450000);
 assert.equal(convertReferenceAmount(450000,'NGN',data,{...options,direction:'local-to-usd'}).converted_amount,300);
 assert.equal(JSON.stringify(data),before);
});
for(const rate of [undefined,null,0,-1,Infinity,NaN,'1500',true,{}])test('invalid rate rejected: '+String(rate),()=>{
 const data=valid();data.rates.NGN=rate;const actual=convertReferenceAmount(300,'NGN',data,options);
 assert.equal(actual.status,'unavailable');assert.equal(actual.reference_amount,300);assert.equal(actual.converted_amount,null);
});
for(const [name,change,reason] of [
 ['missing timestamp',x=>delete x.timestamp,'invalid-fx-observation'],
 ['invalid calendar',x=>x.timestamp='2026-02-30T00:00:00Z','invalid-fx-observation'],
 ['future',x=>x.timestamp='2026-10-10T00:00:00Z','future-fx-observation'],
 ['stale',x=>x.timestamp='2026-10-08T04:59:59.999Z','expired-fx-observation'],
 ['wrong base',x=>x.base='EUR','wrong-fx-base'],
 ['missing source',x=>x.source=' ','missing-fx-source'],
 ['object source',x=>x.source={},'missing-fx-source'],
 ['unknown schema',x=>x.schemaVersion=99,'unsupported-fx-schema'],
 ['retained target',x=>x.retained_rate_codes=['NGN'],'retained-rate-unverified'],
 ['malformed retention',x=>x.retained_rate_codes='NGN','invalid-retained-rate-metadata']
])test(name,()=>{const data=valid();change(data);const actual=convertReferenceAmount(300,'NGN',data,options);assert.equal(actual.reason,reason);assert.equal(actual.converted_amount,null);assert.equal(actual.reference_amount,300);});
test('retained unrelated currency does not block an independently current rate',()=>{const data=valid();data.retained_rate_codes=['KES'];assert.equal(quoteUsdToLocal(data,'NGN',options).status,'available');});
test('exact age boundary is valid and one millisecond beyond is expired',()=>{const data=valid();data.timestamp='2026-10-08T05:00:00Z';assert.equal(quoteUsdToLocal(data,'NGN',options).status,'available');assert.equal(quoteUsdToLocal(data,'NGN',{...options,now:'2026-10-09T05:00:00.001Z'}).reason,'expired-fx-observation');});
test('zero reference amount is preserved without becoming missing',()=>assert.equal(convertReferenceAmount(0,'NGN',valid(),options).converted_amount,0));
test('overflow and unsafe precision never become numeric output or JSON null without a reason',()=>{for(const amount of [Number.MAX_VALUE,Number.MAX_SAFE_INTEGER]){const actual=convertReferenceAmount(amount,'NGN',valid(),options);assert.equal(actual.converted_amount,null);assert.equal(actual.status,'unavailable');assert.ok(actual.reason);}});
test('offset time is normalized but invalid calendar/hour values are rejected',()=>{assert.equal(timestamp('2026-10-09T05:00:00+05:00'),'2026-10-09T00:00:00.000Z');assert.equal(timestamp('2026-10-09T24:00:00Z'),null);assert.equal(timestamp('2026-02-30T00:00:00Z'),null);});
test('invalid invocation cannot fabricate a conversion',()=>{assert.equal(quoteUsdToLocal(valid(),'NGN',{}).status,'unavailable');assert.equal(convertReferenceAmount(300,'NGN',valid(),{...options,direction:'multiply'}).reason,'invalid-direction');assert.equal(convertReferenceAmount(300,'NGN',valid(),{...options,decimals:Infinity}).reason,'invalid-rounding-policy');});

test('legacy absence of retention metadata cannot imply a newly observed currency',()=>{const data=valid();delete data.retained_rate_codes;const actual=convertReferenceAmount(300,'NGN',data,options);assert.equal(actual.status,'unavailable');assert.equal(actual.reason,'missing-retained-rate-metadata');assert.equal(actual.reference_amount,300);});
test('decimal midpoint amounts round half-up without floating multiplication drift',()=>{const data=valid();data.rates.NGN=1;for(const [amount,expected] of [[1.005,1.01],[1.015,1.02],[2.675,2.68],[0.615,0.62]])assert.equal(convertReferenceAmount(amount,'NGN',data,options).converted_amount,expected);});
test('reverse salary conversion rounds a decimal midpoint after division',()=>{const data=valid();data.rates.NGN=100;assert.equal(convertReferenceAmount(100.5,'NGN',data,{...options,direction:'local-to-usd'}).converted_amount,1.01);});
test('scientific notation, tiny rates and huge ratios retain explicit safe outcomes',()=>{const data=valid();data.rates.NGN=1e-7;assert.equal(convertReferenceAmount(1e7,'NGN',data,options).converted_amount,1);data.rates.NGN=Number.MIN_VALUE;const actual=convertReferenceAmount(1,'NGN',data,{...options,direction:'local-to-usd'});assert.equal(actual.status,'unavailable');assert.equal(actual.reason,'unsafe-converted-amount');});

test('safe integer cents that lose a digit during JSON-number serialization are unavailable',()=>{const data=valid();data.rates.NGN=0.01;const actual=convertReferenceAmount(Number.MAX_SAFE_INTEGER,'NGN',data,options);assert.equal(actual.status,'unavailable');assert.equal(actual.reason,'converted-precision-loss');assert.equal(actual.reference_amount,Number.MAX_SAFE_INTEGER);});

test('an arbitrary nonempty provider identifier cannot qualify a rate',()=>{
 const data=valid();data.source='unregistered-provider';assert.equal(quoteUsdToLocal(data,'NGN',options).reason,'unregistered-fx-source');
});
test('syntactically valid but unsupported currencies remain unavailable',()=>{
 const data=valid();data.rates.ZZZ=5;assert.equal(quoteUsdToLocal(data,'ZZZ',options).reason,'invalid-currency');
});
test('expired registered observation retains original source and date without a numeric rate',()=>{
 const data=valid();data.timestamp='2026-10-01T00:00:00Z';const quote=quoteUsdToLocal(data,'NGN',options);
 assert.equal(quote.source,data.source);assert.equal(quote.observed_at,'2026-10-01T00:00:00.000Z');assert.equal(quote.rate,null);assert.equal(quote.reason,'expired-fx-observation');
});
test('inherited object properties cannot create observed rates',()=>{
 const data=valid();data.rates=Object.create({NGN:1500});assert.equal(quoteUsdToLocal(data,'NGN',options).reason,'invalid-fx-rate');
});

test('expired snapshot keeps the original retained observation metadata',()=>{
 const data=valid();data.timestamp='2026-10-01T00:00:00Z';data.retained_rate_codes=['NGN'];
 data.rate_observations={NGN:{rate:1500,source:'fawazahmed',observed_at:'2026-09-30T00:00:00Z'}};
 const quote=quoteUsdToLocal(data,'NGN',options);
 assert.equal(quote.status,'unavailable');assert.equal(quote.rate,null);
 assert.equal(quote.source,'fawazahmed');assert.equal(quote.observed_at,'2026-09-30T00:00:00.000Z');
});

test('expired snapshot cannot date an unverified retained rate',()=>{
 const data=valid();data.timestamp='2026-10-01T00:00:00Z';data.retained_rate_codes=['NGN'];
 const quote=quoteUsdToLocal(data,'NGN',options);
 assert.equal(quote.status,'unavailable');assert.equal(quote.rate,null);
 assert.equal(quote.source,null);assert.equal(quote.observed_at,null);
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const file = path.resolve(__dirname, '../netlify/functions/api-fx-rates.js');
const nativeRequire = createRequire(file);
const now = '2026-11-13T00:00:00Z';
function snapshot(timestamp = now) {
  return {schemaVersion: 1, base: 'USD', source: 'exchangerate-api', timestamp,
    rates: {USD: 1, GHS: 12, NGN: 1500}, retained_rate_codes: []};
}
function handler(data, options = {}) {
  const exports = {};
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } }
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {exports, Date: Clock, console,
    require(name) {
      if (name === './utils/api-auth') return {validateApiKey: async () => ({valid: true, sandbox: !!options.sandbox}), rateLimitHeaders: () => ({}), authErrorBody: () => ({})};
      if (name === './utils/cors') return {getAllowedOrigin: () => 'https://afrotools.com'};
      if (name === './_shared/rate-limit') return {checkRateLimit: () => true, getRemaining: () => 99};
      if (name === './_shared/data-store') return {getData: async () => options.history || null};
      if (name === './_lib/cache') return {getOrFetch: async () => ({data})};
      if (name === './_shared/with-api') return {withApi: fn => fn};
      return nativeRequire(name);
    }
  }, {filename: file});
  return async (params = {}) => {
    const response = await exports.handler({httpMethod: 'GET', headers: options.sandbox ? {'x-api-key':'synthetic-test-key'} : {}, queryStringParameters: params});
    return {...response, payload: JSON.parse(response.body)};
  };
}
for (const params of [{}, {base:'USD'}, {base:'USD', target:'GHS', amount:'100'}]) {
  test('expired snapshot fails closed: '+JSON.stringify(params), async () => {
    const response = await handler(snapshot('2026-11-01T00:00:00Z'))(params);
    assert.equal(response.statusCode, 503);
    assert.equal(response.payload.reason, 'expired-fx-observation');
    assert.equal(response.payload.converted_amount, undefined);
    if (params.target) assert.equal(response.payload.rate, null);
    else assert.deepEqual(response.payload.rates, {});
    for (const key of ['Cache-Control','CDN-Cache-Control','Netlify-CDN-Cache-Control']) assert.equal(response.headers[key], 'no-store');
  });
}
test('fresh pair and list preserve values and provenance', async () => {
  const call = handler(snapshot());
  const pair = await call({base:'USD',target:'GHS',amount:'100'});
  assert.equal(pair.statusCode,200); assert.equal(pair.payload.rate,12); assert.equal(pair.payload.converted_amount,1200);
  assert.equal(pair.payload.qualification.target.observed_at,new Date(now).toISOString());
  const list = await call({base:'GHS'}); assert.equal(list.statusCode,200); assert.equal(list.payload.rates.NGN,125);
});
test('retained expired target cannot inherit the newer collection clock', async () => {
  const data=snapshot(); data.retained_rate_codes=['GHS']; data.rate_observations={GHS:{rate:12,source:'exchangerate-api',observed_at:'2026-11-01T00:00:00Z'}};
  const response=await handler(data)({base:'USD',target:'GHS'});
  assert.equal(response.statusCode,503); assert.equal(response.payload.rate,null);
  const list=await handler(data)({base:'USD'}); assert.equal(list.payload.rates.GHS,undefined); assert.equal(list.payload.rates.NGN,1500);
});
test('unsupported currency is 404 with a fresh snapshot',async()=>assert.equal((await handler(snapshot())({base:'USD',target:'ZZZ'})).statusCode,404));
test('history bypasses latest qualification without changing payload',async()=>{
  const history={series:[{date:'2026-11-01',rate:12}]}; const response=await handler(snapshot('2026-11-01T00:00:00Z'),{history})({base:'USD',target:'GHS',days:'30'});
  assert.equal(response.statusCode,200);assert.deepEqual(response.payload,history);
});
test('deterministic sandbox remains separately labeled',async()=>{
  const response=await handler(null,{sandbox:true})({base:'USD',target:'NGN'});
  assert.equal(response.statusCode,200);assert.equal(response.payload.sandbox,true);assert.equal(response.payload.rate,1500.25);
});

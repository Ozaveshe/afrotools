'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const file=path.resolve(__dirname,'../netlify/functions/api-fuel.js'),nativeRequire=createRequire(file);
const markets=require('../data/fuel/markets.json');
const now='2026-11-13T00:00:00Z';
const rows=['KE','MU','ZM','BW','UG'].map(code=>({code,name:code,region:['KE','UG'].includes(code)?'east':'south',currency:code==='UG'?'UGX':'USD',last_updated:'2026-11-09',petrol:{price:100,usd:2,unit:'liter',observed_at:'2026-11-08',source_url:'https://example.org/fuel'}}));
const data={timestamp:'2026-11-12T23:00:00Z',as_of:'2026-11-09',countries:rows};
function load(clock=now,sandbox=false){const exports={};class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]));}}
vm.runInNewContext(fs.readFileSync(file,'utf8'),{exports,Date:Clock,console,require(name){
 if(name==='./_shared/data-store')return {getData:async()=>null};
 if(name==='./_lib/cache')return {getOrFetch:async()=>({data,fromCache:false}),cacheHeaders:()=>({'Cache-Control':'public, max-age=300'})};
 if(name==='./utils/cors')return {getAllowedOrigin:()=> 'https://afrotools.com'};
 if(name==='./utils/api-auth')return {validateApiKey:async()=>({valid:true,sandbox}),rateLimitHeaders:()=>({}),authErrorBody:()=>({})};
 if(name==='./_shared/rate-limit')return {checkRateLimit:()=>true};
 if(name==='./_shared/with-api')return {withApi:x=>x};return nativeRequire(name);
}},{filename:file});return async params=>{const r=await exports.handler({httpMethod:'GET',headers:sandbox?{'x-api-key':'synthetic-test-key'}:{},queryStringParameters:params||{}});return {...r,payload:JSON.parse(r.body)};};}
test('default aggregate values are preserved and observation dates stay separate from collection',async()=>{
 const before=JSON.stringify(data),r=await load()({});assert.equal(r.statusCode,200);assert.equal(r.payload.markets,undefined);assert.equal(r.payload.summary.petrol_avg_usd,2);assert.equal(r.payload.collected_at,data.timestamp);assert.equal(r.payload.as_of,data.as_of);assert.equal(r.payload.countries[0].price_provenance.products.petrol.observed_at,'2026-11-08');assert.equal(JSON.stringify(data),before);
});
test('single-country references preserve city/national coverage and clock-sensitive headers',async()=>{
 for(const country of ['KE','MU','BW','UG']){const r=await load()({country,include:'markets'});assert.equal(r.statusCode,200);assert.deepEqual(r.payload.markets.map(x=>x.market_id),markets.markets.filter(x=>x.country_code===country).map(x=>x.market_id));assert.ok(r.payload.markets.length);for(const key of ['Cache-Control','CDN-Cache-Control','Netlify-CDN-Cache-Control'])assert.equal(r.headers[key],'no-store');}
});
test('region only includes references belonging to returned countries',async()=>{const r=await load()({region:'east',include:'markets'});assert.ok(r.payload.markets.length);assert.ok(r.payload.markets.every(x=>['KE','UG'].includes(x.country_code)));});
test('Zambia becomes historical after declared expiry without changing its original price',async()=>{
 const r=await load('2026-12-01T00:00:00Z')({country:'ZM',include:'markets'});const m=r.payload.markets.find(x=>x.market_id==='zm-national');assert.ok(m);assert.equal(m.fuels[0].reference_status,'historical');assert.equal(m.fuels[0].price,33.06);
});
test('Uganda remains a dated survey and newer collection does not relabel the period',async()=>{
 const r=await load()({country:'UG',include:'markets'}),m=r.payload.markets.find(x=>x.market_id==='ug-national');assert.equal(m.fuels[0].date_basis,'survey-period');assert.equal(m.fuels[0].period_end,'2026-10-31');assert.equal(m.fuels[0].price,6774);assert.equal(m.fuels[1].price,7014);
});
test('sandbox does not expose production market inventory',async()=>{const r=await load(now,true)({include:'markets'});assert.equal(r.payload.sandbox,true);assert.equal(r.payload.markets,undefined);});

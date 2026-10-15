'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const Module = require('node:module');
const ROOT = path.resolve(__dirname,'..');
const NOW = '2026-10-14T00:00:00.000Z';
const COLLECTED = '2026-10-13T04:52:00.000Z';
const reference = require('../netlify/functions/_shared/shipping-reference');
const plain = value => JSON.parse(JSON.stringify(value));

// Execute actual maintained handlers with no provider, database or scheduler access.
function load(name, mocks) {
  const file = path.join(ROOT,'netlify/functions',name), module = {exports:{}};
  class Clock extends Date { constructor(...args) {super(...(args.length ? args : [NOW]));} static now(){return Date.parse(NOW);} }
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{
    module,exports:module.exports,Date:Clock,URL,Set,Map,Buffer,AbortController,
    process:{env:{}},console:{log(){},warn(){},error(){}},
    fetch(){throw new Error('Unexpected network access');},
    require(id){if(Object.hasOwn(mocks,id))return mocks[id]; throw new Error('Unexpected dependency: '+id);}
  },{filename:file});
  return module.exports;
}
function collector(providerFails=false) {
  let config;
  const owner = load('scheduled-fetch-shipping.js',{
    './_shared/shipping-reference':reference,
    './_shared/scraper-base':{
      runScraper:async value => {config=value;return value;},
      fetchWithRetry:async url => {
        assert.equal(url,reference.LPI_URL);
        if(providerFails)throw new Error('Synthetic optional context outage');
        return {json:async()=>[{},[{country:{id:'NG'},value:2.6,date:'2023'}]]};
      }
    }
  });
  return {owner,get config(){return config;}};
}
const catalog = collector().owner._referenceCatalog;
function legacy() {
  return {timestamp:COLLECTED,
    routes:catalog.routes.map(r=>({origin:r.from,destination:catalog.ports[r.to].name,destination_port:r.to,
      destination_country:catalog.ports[r.to].country,rate_20ft_usd:r.rate_20ft,rate_40ft_usd:r.rate_40ft,
      transit_days:r.transit_days,last_updated:'2026-10-13',source:'reference'})),
    ports:Object.entries(catalog.ports).map(([id,p])=>({id,...plain(p),demurrage:plain(catalog.demurrage[id] || null),
      logistics_score:null,logistics_year:null})),route_count:20,port_count:15};
}
function status(payload,meta={}){return reference.referenceStatus(payload,meta,NOW,10080,catalog);}
function api(payload,meta={}) {
  return load('api-v1.js',{
    './_lib/cache':{getOrFetch:async key=>{assert.equal(key,'shipping-rates-latest');return {data:payload};}},
    './_shared/data-store':{getData:async key=>key==='meta'?meta:key==='shipping-rates-latest'?payload:null},
    './_shared/api-auth':{validateApiKey:async()=>({tier:'free'})},
    './_shared/shipping-reference':reference,'./scheduled-fetch-shipping':{_referenceCatalog:catalog},
    './_shared/agri-reference':{referenceStatus:()=>({status:'offline'})},
    './_shared/reference-feeds':{KEYS:{},referenceStatus:()=>({status:'offline'})}
  });
}
const request = (owner,params={},route='shipping') => owner.handler({httpMethod:'GET',path:'/api/v1/'+route,queryStringParameters:params});
function freshness(payload) {
  return load('api-data-freshness.js',{
    './_shared/data-store':{getData:async key=>{assert.equal(key,'shipping-rates-latest');return payload;}},
    './_shared/scholarship-platform':{},'./_shared/market-data-refresh':{},'./utils/cors':{},'./_shared/env':{},
    './_shared/with-api':{withApi:handler=>handler},'./_shared/shipping-reference':reference,
    './scheduled-fetch-shipping':{_referenceCatalog:catalog}
  })._test;
}
async function watchdog(payload,meta={}) {
  const owner = load('scheduled-source-health-watchdog.js',{
    './_shared/data-store':{getData:async key=>key==='meta'?meta:key==='shipping-rates-latest'?payload:null,
      setData(){throw new Error('Unexpected write');}},
    './_shared/scholarship-platform':{},'./_shared/market-data-refresh':{},'./_shared/email-adapter':{},
    './_shared/scheduled-event':{},'./_shared/scraper-run-health':{},
    './_shared/shipping-reference':reference,'./scheduled-fetch-shipping':{_referenceCatalog:catalog},
    './_shared/reference-feeds':{referenceStatus:()=>({collection_status:'offline'})},
    './_shared/agri-reference':{referenceStatus:()=>({collection_status:'offline'})}
  });
  const summary={ok:true,sources:{},stale:[],degraded:[],failures:[]};
  await owner._test.checkLiveDataMeta(summary,Date.parse(NOW));
  return summary;
}

test('catalog remains the live-corroborated immutable 20-route/15-port/10-demurrage planning corpus',()=>{
  const rows=catalog.routes.map(r=>[r.from,r.to,r.rate_20ft,r.rate_40ft,r.transit_days].join('|')).sort().join('\n');
  assert.equal(createHash('md5').update(rows).digest('hex'),'64ddeb6cf07f138d0af775088bcf0b0e');
  assert.equal(Object.keys(catalog.ports).length,15);
  assert.equal(Object.keys(catalog.demurrage).length,10);
});
test('real CommonJS public classification imports only the reference helper, with no collector/provider/storage initialization',()=>{
  const filename=require.resolve('../netlify/functions/scheduled-fetch-shipping'),original=Module._load,imports=[];
  delete require.cache[filename];
  Module._load=function(id,parent,...args){
    if(parent?.filename===filename){imports.push(id);assert.equal(id,'./_shared/shipping-reference');}
    if(/scraper-base|data-store|storage-diagnostics|scraper-request/.test(id))throw new Error('Unexpected collector initialization: '+id);
    return original.call(this,id,parent,...args);
  };
  let real;
  try{real=require(filename);assert.deepEqual(plain(real._referenceCatalog),plain(catalog));
    assert.equal(reference.normalizeSnapshot(legacy(),NOW,real._referenceCatalog).route_count,20);
  }finally{Module._load=original;delete require.cache[filename];}
  assert.deepEqual(imports,['./_shared/shipping-reference']);
});
test('exact legacy snapshot with missing meta is recognized but never verified or live',()=>{
  const input=legacy(), before=JSON.stringify(input), normalized=reference.normalizeSnapshot(input,NOW,catalog), s=status(input);
  assert.equal(JSON.stringify(input),before);
  assert.equal(normalized.source,reference.SOURCE);
  assert.equal(normalized.reference_reviewed_at,null);
  assert.equal(s.status,'stale');assert.equal(s.collection_status,'ok');assert.equal(s.availability,'reference');
  assert.equal(s.current_prices,false);assert.equal(s.confidence,null);assert.equal(s.records_count,20);
  assert.equal(normalized.collected_at,COLLECTED);
  for(const row of normalized.routes){assert.equal(row.last_updated,null);assert.equal(row.current_prices,false);}
  assert.deepEqual(reference.normalizeSnapshot(normalized,NOW,catalog),normalized);
});
test('collection recency and failures do not become price review timestamps',()=>{
  const input=legacy();input.timestamp='2026-09-01T00:00:00.000Z';
  assert.equal(status(input).collection_status,'stale');
  assert.equal(status(legacy(),{status:'error'}).collection_status,'degraded');
  assert.equal(status(legacy(),{last_fetch:NOW,status:'live',source:'official carrier'}).current_prices,false);
  assert.equal(status(null).status,'offline');assert.equal(status(null).source,null);
});
const badMutations = {
  'unknown schema':p=>{p.schemaVersion=2;},'unknown declared source':p=>{p.source='official carrier';},
  'unknown snapshot type':p=>{p.snapshot_type='live';},'unknown field':p=>{p.official=true;},
  'future collection':p=>{p.timestamp='2026-10-15T00:00:00.000Z';},
  'invalid calendar date':p=>{p.timestamp='2026-02-30T00:00:00.000Z';},
  'invalid timezone timestamp':p=>{p.timestamp='2026-10-13T04:52:00+00:00';},
  'missing collection':p=>{delete p.timestamp;},'fake current prices':p=>{p.current_prices=true;},
  'fake review':p=>{p.reference_reviewed_at=COLLECTED;},'official route claim':p=>{p.routes[0].source_type='official';},
  'changed price':p=>{p.routes[0].rate_20ft_usd++;},'changed transit':p=>{p.routes[0].transit_days++;},
  'changed port fee':p=>{p.ports[0].demurrage.rate_after++;},'missing route':p=>{p.routes.pop();p.route_count--;},
  'duplicate route':p=>{p.routes[1]=plain(p.routes[0]);},'duplicate port':p=>{p.ports[1]=plain(p.ports[0]);},
  'prototype port':p=>{p.ports[0].id='__proto__';},'unknown port':p=>{p.routes[0].destination_port='toString';},
  'bad logistics score':p=>{p.ports[0].logistics_score=6;p.ports[0].logistics_year='2023';},
  'future logistics year':p=>{p.ports[0].logistics_score=2;p.ports[0].logistics_year='2027';},
  'false context source':p=>{p.ports[0].logistics_score=2;p.ports[0].logistics_year='2023';p.ports[0].logistics_source={name:'Carrier',url:'https://invalid.example'};}
};
for(const [name,mutate] of Object.entries(badMutations))test('fail closed: '+name,async()=>{
  const input=legacy();mutate(input);
  assert.equal(reference.normalizeSnapshot(input,NOW,catalog),null);
  assert.equal(status(input).availability,'unavailable');
  assert.equal((await request(api(input))).statusCode,503);
});
test('contradictory modern collection timestamp and reference claims fail closed',()=>{
  const input=reference.normalizeSnapshot(legacy(),NOW,catalog);input.timestamp=NOW;
  assert.equal(reference.normalizeSnapshot(input,NOW,catalog),null);
  input.timestamp=COLLECTED;input.routes[0].current_prices=true;
  assert.equal(reference.normalizeSnapshot(input,NOW,catalog),null);
});
test('collector labels fees as references and World Bank LPI only as separate dated context',async()=>{
  const c=collector();await c.owner.handler({});const config=c.config;
  assert.equal(config.sourceType,'reference');assert.equal(config.id,'shipping-rates');assert.equal(config.metaKey,'shipping');
  assert.equal(config.sources[0].name,reference.SOURCE);
  const result=config.transform(await config.sources[0].fn());
  assert.equal(result.timestamp,NOW);assert.equal(result.reference_reviewed_at,null);assert.equal(result.current_prices,false);
  const port=result.ports.find(p=>p.id==='lagos');
  assert.equal(port.logistics_observation.source.url,reference.LPI_URL);
  assert.equal(port.logistics_observation.source_type,'dated_statistical_context');
  assert.equal(port.logistics_observation.current_price_evidence,false);
  assert.equal(port.demurrage.current_prices,false);
  assert.equal(result.routes[0].source,'reference');
  const old=legacy();old.ports[0].logistics_score=2.6;old.ports[0].logistics_year='2023';
  const observation=reference.normalizeSnapshot(old,NOW,catalog).ports[0].logistics_observation;
  assert.equal(observation.source,null);assert.equal(observation.attribution_status,'legacy_unverified');
});
test('optional LPI outage never invents context or upgrades reference prices',async()=>{
  const c=collector(true);await c.owner.handler({});const result=c.config.transform(await c.config.sources[0].fn());
  assert.equal(result.route_count,20);assert.equal(result.current_prices,false);
  assert.ok(result.ports.every(p=>p.logistics_score===null&&p.logistics_observation===null));
});
test('actual scraper base writes reference metadata with null confidence; failed writes remain failed',async()=>{
  const c=collector();await c.owner.handler({});
  for(const written of [true,false]){
    let stored=null, metadata=null, writes=0;
    const base=load('_shared/scraper-base.js',{
      './data-store':{getData:async()=>null,setData:async(key,value)=>{assert.equal(key,'shipping-rates-latest');writes++;stored=value;return written;},
        updateMeta:async(key,value)=>{assert.equal(key,'shipping');metadata=value;}},
      './storage-diagnostics':{storageDiagnostic:()=> 'Synthetic diagnostic'},
      './scraper-request':{fetchWithRetry(){throw new Error('Unexpected provider');}}
    });
    const result=await base.runScraper(c.config);
    assert.equal(writes,1);assert.equal(stored.current_prices,false);
    assert.equal(result.statusCode,written?200:503);
    if(written){assert.equal(metadata.source_type,'reference');assert.equal(metadata.confidence,null);assert.equal(metadata.source,reference.SOURCE);}
    else assert.equal(metadata.status,'write-failed');
  }
});
test('API retains all routes, port-country filtering and destination/origin filters',async()=>{
  const input=legacy(),owner=api(input);
  const all=JSON.parse((await request(owner)).body);
  assert.equal(all.route_count,20);assert.equal(all.port_count,15);assert.equal(all.current_prices,false);
  const filtered=JSON.parse((await request(owner,{route_to:'NG',route_from:'shanghai'})).body);
  assert.equal(filtered.count,1);
  for(const key of ['origin','destination','destination_port','destination_country','rate_20ft_usd','rate_40ft_usd','transit_days','source'])
    assert.equal(filtered.routes[0][key],input.routes[0][key]);
  const ports=JSON.parse((await request(owner,{port:'ZA'})).body);
  assert.equal(ports.count,2);assert.ok(ports.ports.every(p=>p.country==='ZA'));
  assert.equal(JSON.parse((await request(owner,{route_to:'missing'})).body).count,0);
});
test('freshness, API health and watchdog agree on unverified reference without metadata',async()=>{
  const payload=legacy(), f=freshness(payload);
  const publicStatus=await f.buildCategoryStatus('shipping',f.CATEGORY_CONFIGS.shipping,{},Date.parse(NOW));
  const health=JSON.parse((await request(api(payload),{},'health')).body);
  const w=await watchdog(payload), monitored=w.sources.live_data_meta.categories.find(p=>p.id==='shipping');
  assert.equal(health.status,'degraded');
  for(const s of [publicStatus,health.categories.shipping,monitored]){
    assert.equal(s.status,'stale');assert.equal(s.collection_status,'ok');assert.equal(s.source,reference.SOURCE);
    assert.equal(s.current_prices,false);assert.equal(s.reference_reviewed_at,null);assert.equal(s.records_count,20);
  }
  assert.ok(w.degraded.some(p=>p.id==='shipping'&&p.message.includes('unreviewed planning references')));
});
test('invalid stored snapshot remains unavailable in public and watchdog summaries',async()=>{
  const payload=legacy();payload.routes[0].rate_40ft_usd++;
  const f=freshness(payload), s=await f.buildCategoryStatus('shipping',f.CATEGORY_CONFIGS.shipping,{shipping:{status:'live',last_fetch:NOW}},Date.parse(NOW));
  const w=await watchdog(payload,{shipping:{status:'live',last_fetch:NOW}});
  assert.equal(s.status,'offline');assert.equal(s.records_count,0);
  assert.ok(w.stale.some(p=>p.id==='shipping'&&p.message.includes('invalid')));
});

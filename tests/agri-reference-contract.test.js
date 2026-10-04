'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const agri=require('../netlify/functions/_shared/agri-reference');
const now='2026-10-04T04:00:00.000Z';
const configs={NG:{name:'Nigeria',currency:'NGN',inputs:{urea_50kg:28000}},KE:{name:'Kenya',currency:'KES',inputs:{urea_50kg:4500}}};
const row=(code,year,value)=>({country:{id:code},indicator:{id:agri.FOOD_INDICATOR},date:String(year),value});
const legacy=()=>({timestamp:now,countries:[{code:'NG',currency:'NGN',name:'Nigeria',inputs:[{item:'urea_50kg',price_local:28000,price_usd:28000}],last_updated:'2026-10-04',source:'reference-with-wb',food_production_index:100}]});
function load(file,stubs){const exports={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../netlify/functions',file),'utf8'),{exports,console:{log(){},error(){},warn(){}},Date,URL,Set,Map,Buffer,process:{env:{}},require:name=>{if(name==='./_shared/agri-reference')return agri;if(Object.hasOwn(stubs,name))return stubs[name];throw new Error('Unstubbed dependency: '+name);}}, {filename:file});return exports;}
function storage(payload,meta={}){return {getData:async key=>key==='agri-inputs-latest'?payload:key==='meta'?meta:null,setData:async()=>{throw new Error('Unexpected live write');}};}

test('latest food observation uses year, preserves zero and ignores invalid/future/unrelated records',()=>{
 const rows=[row('NG',2024,140),row('NG',2022,120),row('KE',2023,0),row('NG',2025,null),row('NG',2027,900),row('XX',2024,1),{...row('NG',2026,100),indicator:{id:'wrong'}}];
 const observations=agri.latestFoodObservations(rows,['NG','KE'],now);
 assert.equal(observations.NG.value,140);assert.equal(observations.NG.year,2024);assert.equal(observations.KE.value,0);
 assert.deepEqual(observations,agri.latestFoodObservations(rows.slice().reverse(),['NG','KE'],now));
});

test('fertilizer benchmark needs a valid dated series and preserves a zero observation',()=>{
 const make=(id,period,price,extra={})=>({id,period,price,source:'worldbank-cmo-xlsx',currency:'USD',unit:'mt',
  source_url:'https://thedocs.worldbank.org/en/doc/synthetic/related/CMO-Historical-Data-Monthly.xlsx',...extra});
 const payload={timestamp:now,commodities:[make('phosphate','2025M09',10),make('phosphate','2026M08',0),
 make('urea',null,80),make('phosphate','2026M12',500),make('urea','2026M09',50),make('urea','2026M10',70,{source:'reference-fallback'})]};
 const result=agri.fertilizerBenchmarks(payload,now);
 assert.equal(result.DAP.value,0);assert.equal(result.DAP.period,'2026M08');assert.equal(result.UREA_EE_BULK.period,'2026M09');
 assert.deepEqual(agri.fertilizerBenchmarks({...payload,timestamp:'2026-09-01T00:00:00Z'},now),{});
 assert.deepEqual(agri.fertilizerBenchmarks({timestamp:now,commodities:[make('urea','2026M09',50,{source_url:'https://example.com/CMO-Historical-Data-Monthly.xlsx'})]},now),{});
});

test('missing, invalid, stale, future and wrong-base FX never creates USD amounts',()=>{
 for(const forex of [null,{base:'USD',rates:{NGN:0}}, {base:'USD',source:'test',timestamp:now,rates:{NGN:' '}},
 {base:'USD',source:'test',timestamp:'2026-09-01T00:00:00Z',rates:{NGN:1400}},
 {base:'USD',source:'test',timestamp:'2026-10-05T00:00:00Z',rates:{NGN:1400}},
 {base:'NGN',source:'test',timestamp:now,rates:{NGN:1400}}]) {
  const snapshot=agri.buildSnapshot(configs,{}, {},forex,now);assert.equal(snapshot.countries[0].inputs[0].price_usd,null);assert.equal(snapshot.countries[0].inputs[0].price_local,28000);
 }
 const snapshot=agri.buildSnapshot(configs,{}, {},{base:'USD',source:'synthetic source',timestamp:now,rates:{NGN:1400}},now);
 assert.equal(snapshot.countries[0].inputs[0].price_usd,20);assert.equal(snapshot.countries[1].inputs[0].price_usd,null);
 const expired=agri.normalizeSnapshot(snapshot,'2026-10-08T04:00:00Z');assert.equal(expired.countries[0].inputs[0].price_usd,null);
});

test('collection date cannot become price review; partial metric lineage remains explicit',()=>{
 const snapshot=agri.buildSnapshot(configs,agri.latestFoodObservations([row('NG',2024,150)],['NG','KE'],now),{},null,now);
 assert.equal(snapshot.price_reviewed_at,null);assert.equal(snapshot.current_prices,false);
 assert.equal(snapshot.countries[0].source,'reference-with-wb');assert.equal(snapshot.countries[1].source,'reference');
 assert.equal(snapshot.countries[0].last_updated,null);assert.equal(snapshot.countries[0].collected_at,now);
 assert.equal(snapshot.countries[0].metrics.food_production_index.year,2024);assert.equal(snapshot.countries[0].metrics.global_dap_usd_mt,null);
});

test('legacy references normalize without fake review dates, metrics, conversions or storage mutation',()=>{
 const payload=legacy(),before=JSON.stringify(payload),normalized=agri.normalizeSnapshot(payload,now);
 assert.equal(normalized.countries[0].inputs[0].price_local,28000);assert.equal(normalized.countries[0].inputs[0].price_usd,null);
 assert.equal(normalized.countries[0].last_updated,null);assert.equal(normalized.countries[0].food_production_index,null);
 assert.equal(normalized.countries[0].source,'reference');
 assert.equal(JSON.stringify(payload),before);
 for(const bad of [null,{...payload,timestamp:'invalid'},{...payload,schemaVersion:999},{...payload,schemaVersion:2,source:'unrecognized'},
 {...payload,countries:[{...payload.countries[0],source:'unknown'}]}]) assert.equal(agri.referenceStatus(bad,{},now,10080).status,'offline');
 assert.equal(agri.referenceStatus({...payload,timestamp:'2026-10-05T00:00:00Z'}, {},now,10080).status,'offline');
 assert.equal(agri.referenceStatus(payload,{status:'ok'},now,10080).status,'stale');
 assert.equal(agri.referenceStatus(payload,{status:'write-failed'},now,10080).collection_status,'degraded');
});

test('public freshness reader uses agriculture owner and never calls retained references live',async()=>{
 const api=load('api-data-freshness.js',{'./_shared/data-store':storage(legacy()),'./_shared/scholarship-platform':{},'./_shared/market-data-refresh':{},
 './utils/cors':{},'./_shared/env':{},'./_shared/with-api':{withApi:fn=>fn}});
 assert.equal(api._test.CATEGORY_CONFIGS.agri_inputs.metaKey,'agriculture');
 const result=await api._test.buildCategoryStatus('agri_inputs',api._test.CATEGORY_CONFIGS.agri_inputs,{agriculture:{status:'write-failed'}},new Date(now).getTime());
 assert.equal(result.collection_status,'degraded');assert.equal(result.status,'stale');assert.equal(result.source_type,'reference');assert.equal(result.records_count,1);
});

test('agriculture API preserves filters, auth and provenance while unrelated generic output stays compatible',async()=>{
 let deny=false,reads=0;const payload=legacy();
 const api=load('api-v1.js',{'./_shared/data-store':storage(payload),'./_lib/cache':{getOrFetch:async()=>{reads++;return {data:payload};}},
 './_shared/api-auth':{validateApiKey:async()=>deny?{error:'denied',status:403}:{tier:'free'}}});
 const call=async(endpoint,params={})=>api.handler({httpMethod:'GET',path:'/api/v1/'+endpoint,queryStringParameters:params});
 const response=await call('agriculture',{country:'ng'}),body=JSON.parse(response.body);
 assert.equal(response.statusCode,200);assert.equal(body.count,1);assert.equal(body.source_type,'reference');assert.equal(body.current_prices,false);assert.equal(body.price_reviewed_at,null);
 assert.equal(body.data[0].inputs[0].price_usd,null);assert.equal((await call('agriculture',{country:'XX'})).statusCode,404);
 const insurance=JSON.parse((await call('insurance')).body);assert.deepEqual(Object.keys(insurance).sort(),['count','data','timestamp']);
 deny=true;const previousReads=reads;assert.equal((await call('agriculture')).statusCode,403);assert.equal(reads,previousReads);
});

test('watchdog keeps reference-price debt visible and honors failed collector metadata',async()=>{
 const watchdog=load('scheduled-source-health-watchdog.js',{'./_shared/data-store':storage(legacy(),{agriculture:{status:'write-failed'}}),
 './_shared/scholarship-platform':{},'./_shared/market-data-refresh':{},'./_shared/email-adapter':{},'./_shared/scheduled-event':{},'./_shared/scraper-run-health':{}});
 const summary={ok:true,stale:[],degraded:[],failures:[],warnings:[],sources:{}};
 await watchdog._test.checkLiveDataMeta(summary,new Date(now).getTime());
 const result=summary.sources.live_data_meta.categories.find(row=>row.id==='agri_inputs');
 assert.equal(result.collection_status,'degraded');assert.equal(result.price_reviewed_at,null);assert(summary.degraded.some(row=>row.id==='agri_inputs'));assert.equal(summary.ok,false);
});

test('collector includes all supported countries and follows bounded pagination without live writes',async()=>{
 let pageCalls=0;const collector=load('scheduled-fetch-agri-inputs.js',{'./_shared/data-store':storage(null),
 './_shared/scraper-base':{runScraper:async config=>config.transform(await config.sources[0].fn()),fetchWithRetry:async url=>{
  if(url.includes('/indicator/')){pageCalls++;assert(!url.includes('/ALL/'));return {json:async()=>[{pages:2},[row(pageCalls===1?'NG':'KE',2024,pageCalls*100)]]};}
  return {json:async()=>({source:[{data:[]}]})};
 }}});
 const snapshot=await collector.handler({});assert.equal(pageCalls,2);assert.equal(snapshot.countries.length,12);
 assert.equal(snapshot.countries.find(row=>row.code==='KE').food_production_index,200);assert.equal(snapshot.external_sources.food_production.status,'partial');
 assert.equal(snapshot.external_sources.fertilizer.status,'unavailable');assert.equal(snapshot.current_prices,false);
});

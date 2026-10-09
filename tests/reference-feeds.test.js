'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const feeds=require('../netlify/functions/_shared/reference-feeds');
const fx=require('../netlify/functions/_shared/reference-fx');
const responses=require('../netlify/functions/_shared/forex-response');
const now='2026-10-09T06:00:00.000Z';
class Clock extends Date {constructor(...args){super(...(args.length?args:[now]));}static now(){return Date.parse(now);}}
const valid=()=>({schemaVersion:1,base:'USD',source:'exchangerate-api',timestamp:now,rates:{NGN:1500,KES:130},retained_rate_codes:[]});
const clone=value=>JSON.parse(JSON.stringify(value));
function load(name,modules={},extras={}) {
  const file=path.join(__dirname,'../netlify/functions',name),nativeRequire=createRequire(file),module={exports:{}};
  const logs=[];
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{module,exports:module.exports,Date:Clock,URL,Set,Map,Buffer,
    AbortController,Response,Promise,setTimeout,clearTimeout,process:{env:{}},
    console:Object.fromEntries(['log','warn','error'].map(key=>[key,(...args)=>logs.push(args.join(' '))])),
    require:id=>Object.hasOwn(modules,id)?modules[id]:nativeRequire(id),
    fetch:async()=>{throw new Error('Unexpected network');},...extras},{filename:file});
  return {api:module.exports,logs};
}
async function collect(category,forex=valid(),rows=[]) {
  let config;
  const owner=load('scheduled-fetch-'+({insurance:'insurance',property:'property',salaries:'salaries'}[category])+'.js',{
    './_shared/scraper-base':{runScraper:async value=>{config=value;return value;},fetchWithRetry:async()=>new Response(JSON.stringify(rows))},
    './_shared/data-store':{getData:async()=>forex}
  },{process:{env:{SUPABASE_SERVICE_ROLE_KEY:'synthetic-unused'}}});
  await owner.api.handler({});
  assert.equal(config.sourceType,'reference');
  return clone(config.transform(await config.sources[0].fn()));
}
const first= (category,country)=>category==='insurance'?country.products[0]:category==='property'?country.cities[0]:country.sectors[0];
const usdField={insurance:'avg_premium_usd',property:'rent_1br_center_usd',salaries:'median_usd'};
const localField={insurance:'avg_premium_local',property:'rent_1br_center_local',salaries:'median_local'};
for(const category of Object.keys(feeds.KEYS)) {
  test(category+' collector and API normalizer preserve references and separately qualify FX',async()=>{
    const snapshot=await collect(category),before=JSON.stringify(snapshot),row=snapshot.countries.find(r=>r.code==='NG');
    const value=first(category,row);
    assert.equal(value[localField[category]],value[usdField[category]]*1500);
    assert.equal(row.last_updated,null);assert.equal(snapshot.reference_reviewed_at,null);assert.equal(snapshot.current_prices,false);
    const normalized=feeds.normalizeSnapshot(category,snapshot,now);
    assert.ok(normalized);assert.equal(first(category,normalized.countries.find(r=>r.code==='NG'))[localField[category]],value[localField[category]]);
    const expired=feeds.normalizeSnapshot(category,snapshot,'2026-10-11T06:00:00Z');
    assert.equal(first(category,expired.countries.find(r=>r.code==='NG'))[localField[category]],null);
    assert.equal(first(category,expired.countries.find(r=>r.code==='NG'))[usdField[category]],value[usdField[category]]);
    assert.equal(JSON.stringify(snapshot),before);
  });
  for(const [name,change] of [
    ['missing snapshot',()=>null],['zero',data=>({...data,rates:{NGN:0}})],['negative',data=>({...data,rates:{NGN:-1}})],
    ['string',data=>({...data,rates:{NGN:'1500'}})],['infinite',data=>({...data,rates:{NGN:Infinity}})],
    ['wrong base',data=>({...data,base:'EUR'})],['unknown source',data=>({...data,source:'unknown'})],
    ['future',data=>({...data,timestamp:'2026-10-10T06:00:00Z'})],['stale',data=>({...data,timestamp:'2026-10-01T06:00:00Z'})],
    ['retained',data=>({...data,retained_rate_codes:['NGN']})],['missing retention',data=>{delete data.retained_rate_codes;return data;}]
  ])test(category+' rejects '+name+' FX without discarding USD reference',async()=>{
    const snapshot=await collect(category,change(valid())),row=snapshot.countries.find(r=>r.code==='NG'),value=first(category,row);
    assert.equal(value[localField[category]],null);assert.ok(value[usdField[category]]>0);assert.equal(row.conversion.status,'unavailable');assert.ok(row.conversion.reason);
  });
  test(category+' legacy cache has no new price review, FX or provider claim',async()=>{
    const payload=await collect(category);delete payload.schemaVersion;
    payload.countries.forEach(row=>{row.source=category==='property'?'numbeo-with-reference':'reference-with-forex';row.last_updated='2026-10-09';});
    const normalized=feeds.normalizeSnapshot(category,payload,now);
    assert.ok(normalized);assert.equal(normalized.countries[0].source,'reference');
    assert.equal(first(category,normalized.countries[0])[localField[category]],null);
    assert.equal(normalized.countries[0].last_updated,null);
  });
  test(category+' missing or invalid snapshot cannot be healthy from metadata alone',async()=>{
    const good=await collect(category);
    for(const payload of [null,{...good,schemaVersion:99},{...good,timestamp:'2026-02-30T00:00:00Z'},
      {...good,timestamp:'2026-10-10T06:00:00Z'},{...good,countries:[null]}]) {
      assert.equal(feeds.normalizeSnapshot(category,payload,now),null);
      const status=feeds.referenceStatus(category,payload,{status:'ok',last_fetch:now},now,10080);
      assert.equal(status.status,'offline');assert.equal(status.availability,'unavailable');
    }
    assert.equal(feeds.referenceStatus(category,good,{status:'ok'},now,10080).status,'stale');
    assert.equal(feeds.referenceStatus(category,good,{status:'write-failed'},now,10080).collection_status,'degraded');
  });
}

const salary=extra=>({country_code:'NG',role_category:'technology',experience_level:'senior',currency:'NGN',period:'monthly',
  sample_size:25,median_gross:450000,p25_gross:300000,p75_gross:600000,updated_at:now,...extra});
test('salary cohorts retain units, observed quantiles and original annual/monthly periods',()=>{
  const rows=[salary(),salary({experience_level:'junior',median_gross:300000,p25_gross:null}),salary({period:'annual'})];
  const actual=feeds.communityObservations(rows,'NG','technology',valid(),now);
  assert.equal(actual.length,3);assert.equal(actual[0].median_usd,300);assert.equal(actual[0].median_local,450000);
  assert.equal(actual[0].p25_usd,200);assert.equal(actual[0].p75_usd,400);assert.equal(actual[1].p25_usd,null);
  assert.equal(actual[2].period,'annual');assert.equal(actual[2].median_local,450000);
  assert.equal(actual[0].sample_size,25);assert.equal(actual[0].observed_at,now);
});
test('ambiguous, wrong-unit, unknown-cohort and conflicting salary observations are rejected',()=>{
  for(const extra of [{currency:'USD'},{period:'weekly'},{experience_level:null},{role_category:null},{median_gross:'450000'},
    {sample_size:'25'},{sample_size:0},{p25_gross:500000},{p75_gross:300000},{updated_at:'2026-10-10T06:00:00Z'}])
    assert.equal(feeds.communityObservations([salary(extra)],'NG','technology',valid(),now).length,0);
  assert.equal(feeds.communityObservations([salary(),salary({median_gross:500000})],'NG','technology',valid(),now).length,0);
});
test('salary collector leaves reference medians independent of community values and invents no quartiles',async()=>{
  const payload=await collect('salaries',valid(),[salary()]);
  const tech=payload.countries.find(c=>c.code==='NG').sectors.find(s=>s.sector==='technology');
  assert.equal(tech.median_usd,800);assert.equal(tech.p25_usd,null);assert.equal(tech.p75_usd,null);assert.equal(tech.sample_size,0);
  assert.equal(tech.community_observations[0].median_usd,300);
  const read=feeds.normalizeSnapshot('salaries',payload,'2026-10-11T06:00:00Z').countries.find(c=>c.code==='NG').sectors[0];
  assert.equal(read.community_observations[0].median_local,450000);assert.equal(read.community_observations[0].median_usd,null);
});
test('legacy community-enriched salary values remain needs-review instead of being reinterpreted',async()=>{
  const payload=await collect('salaries');delete payload.schemaVersion;
  payload.countries.forEach(c=>c.source='community-enriched');
  const sector=feeds.normalizeSnapshot('salaries',payload,now).countries[0].sectors[0];
  assert.equal(sector.median_usd,null);assert.equal(sector.median_local,null);assert.equal(sector.reference_status,'needs_review');
  assert.equal(sector.p25_usd,null);assert.equal(sector.community_observations.length,0);
});
test('retained cross-rate legs use only original individual observation metadata',()=>{
  const data=valid();data.retained_rate_codes=['NGN'];
  assert.equal(fx.quotePair(data,'NGN','KES',feeds.options(now)).rate,null);
  assert.equal(fx.quotePair(data,'KES','NGN',feeds.options(now)).rate,null);
  assert.equal(fx.quotePair(data,'USD','KES',feeds.options(now)).rate,130);
  const unavailable=fx.quoteUsdToLocal(data,'NGN',feeds.options(now));
  assert.equal(unavailable.observed_at,null);assert.equal(unavailable.source,null);
  data.rate_observations={NGN:{rate:1500,source:'fawazahmed',observed_at:'2026-10-09T00:00:00Z'}};
  const quote=fx.quotePair(data,'NGN','KES',feeds.options(now));assert.equal(quote.rate,130/1500);
  assert.equal(quote.base.source,'fawazahmed');assert.equal(quote.base.observed_at,'2026-10-09T00:00:00.000Z');
  data.rate_observations.NGN.observed_at='2026-10-01T00:00:00Z';assert.equal(fx.quotePair(data,'NGN','KES',feeds.options(now)).rate,null);
});
test('re-reading an unavailable conversion preserves its known original observation without a rate',()=>{
  const data=valid();data.timestamp='2026-10-01T00:00:00Z';
  const receipt=fx.conversionReceipt(data,'NGN',feeds.options(now));
  const again=fx.revalidateReceipt(receipt,'NGN',feeds.options(now));
  assert.equal(again.observed_at,'2026-10-01T00:00:00.000Z');assert.equal(again.source,'exchangerate-api');
  assert.equal(again.rate,null);assert.equal(again.reason,'expired-fx-observation');
});
test('all-rate responses explicitly null retained currency, including alternate base',()=>{
  const data=valid();data.retained_rate_codes=['NGN'];
  assert.equal(responses.ratesResponse(data,'USD',now).rates.NGN,null);
  assert.equal(responses.ratesResponse(data,'USD',now).rates.KES,130);
  assert.ok(Object.values(responses.ratesResponse(data,'NGN',now).rates).every(rate=>rate===null));
});
test('crypto needs its own source and date; fiat collection cannot refresh old crypto',()=>{
  for(const payload of [null,{BTC_USD:87450}])assert.equal(responses.cryptoResponse(payload,now).quotes.BTC_USD,null);
  const payload={schemaVersion:1,quotes:{BTC_USD:{asset:'bitcoin',currency:'USD',price:50000,source:'coingecko',observed_at:now},
    USDT_USD:{asset:'tether',currency:'USD',price:0.998,source:'coingecko',observed_at:now}}};
  assert.equal(responses.cryptoResponse(payload,now).quotes.BTC_USD,50000);
  assert.equal(responses.cryptoResponse(payload,now).quotes.USDT_USD,0.998);
  assert.equal(responses.cryptoResponse(payload,'2026-10-09T08:00:00.001Z').quotes.BTC_USD,null);
});

test('agriculture uses the same FX rule and old conversion objects cannot gain missing retention evidence',()=>{
  const agri=require('../netlify/functions/_shared/agri-reference');
  const config={NG:{name:'Nigeria',currency:'NGN',inputs:{urea_50kg:30000}}};
  const snapshot=agri.buildSnapshot(config,{}, {},valid(),now);
  assert.equal(snapshot.countries[0].inputs[0].price_usd,20);
  assert.equal(agri.normalizeSnapshot(snapshot,now).countries[0].inputs[0].price_usd,20);
  const prior=clone(snapshot);delete prior.countries[0].conversion.qualification_version;
  assert.equal(agri.normalizeSnapshot(prior,now).countries[0].inputs[0].price_usd,null);
  assert.equal(agri.normalizeSnapshot(snapshot,'2026-10-11T06:00:00Z').countries[0].inputs[0].price_usd,null);
  const retained=valid();retained.retained_rate_codes=['NGN'];
  const rejected=agri.buildSnapshot(config,{}, {},retained,now);
  assert.equal(rejected.countries[0].inputs[0].price_local,30000);assert.equal(rejected.countries[0].inputs[0].price_usd,null);
});

test('both forex API families qualify single, multiple, full and alternate-base outputs',async()=>{
  const data=valid();data.retained_rate_codes=['NGN'];data.crypto={BTC_USD:87450};
  const cache={getOrFetch:async()=>({data,fromCache:true}),cacheHeaders:()=>({'Content-Type':'application/json'})};
  const api=load('api-forex.js',{'./_lib/cache':cache,'./_shared/data-store':{},'./_shared/with-api':{withApi:fn=>fn}}).api;
  const request=async params=>{
    const result=await api.handler({httpMethod:'GET',headers:{'x-api-key':'synthetic-key-for-test'},queryStringParameters:params});
    return {...result,payload:JSON.parse(result.body)};
  };
  assert.equal((await request({from:'USD',to:'NGN'})).payload.rate,null);
  assert.equal((await request({from:'USD',to:'KES'})).payload.rate,130);
  assert.equal((await request({pairs:'USD-NGN,USD-KES'})).payload.pairs['USD/NGN'],null);
  assert.equal((await request({base:'USD'})).payload.rates.NGN,null);
  assert.equal((await request({base:'USD'})).payload.crypto.BTC_USD,null);
  assert.equal((await request({base:'NGN'})).statusCode,503);
  const v1=load('api-v1.js',{'./_lib/cache':cache,'./_shared/data-store':{},
    './_shared/api-auth':{validateApiKey:async()=>({tier:'free'})}}).api;
  const response=await v1.handler({httpMethod:'GET',path:'/api/v1/forex',queryStringParameters:{base:'NGN',target:'KES'}});
  assert.equal(response.statusCode,503);assert.equal(JSON.parse(response.body).rate,null);
});

test('qualified forex APIs preserve unknown-currency status and v1 explicit-base identity',async()=>{
  const data=valid(),cache={getOrFetch:async()=>({data,fromCache:true}),cacheHeaders:()=>({'Content-Type':'application/json'})};
  const api=load('api-forex.js',{'./_lib/cache':cache,'./_shared/data-store':{},'./_shared/with-api':{withApi:fn=>fn}}).api;
  for(const queryStringParameters of [{from:'USD',to:'ZZZ'},{base:'ZZZ'}]) {
    const response=await api.handler({httpMethod:'GET',headers:{'x-api-key':'synthetic-key-for-test'},queryStringParameters});
    assert.equal(response.statusCode,404);
  }
  const v1=load('api-v1.js',{'./_lib/cache':cache,'./_shared/data-store':{},
    './_shared/api-auth':{validateApiKey:async()=>({tier:'free'})}}).api;
  const request=queryStringParameters=>v1.handler({httpMethod:'GET',path:'/api/v1/forex',queryStringParameters});
  assert.equal((await request({base:'ZZZ'})).statusCode,404);
  assert.equal((await request({base:'USD',target:'ZZZ'})).statusCode,404);
  for(const base of ['USD','NGN']) {
    const response=await request({base});assert.equal(response.statusCode,200);
    assert.equal(JSON.parse(response.body).rates[base],1);
  }
  data.retained_rate_codes=['NGN'];
  const rejected=await request({base:'NGN'});assert.equal(rejected.statusCode,503);
  assert.equal(JSON.parse(rejected.body).rates.NGN,null);
});
test('forex collector cannot invent crypto observations and keeps public stabilization diagnostics',async()=>{
  const rates=Object.fromEntries(fx.SUPPORTED_CURRENCIES.filter(code=>code!=='USD').map(code=>[code,code==='NGN'?1500:130]));
  let saved;
  const owner=load('scheduled-fetch-forex-rates.js',{
    './_shared/data-store':{getData:async()=>({timestamp:'2026-10-08T06:00:00Z',rates}),setData:async(_key,data)=>{saved=clone(data);return true;},updateMeta:async()=>{}},
    './_shared/scraper-request':{fetchWithRetry:async url=>new Response(JSON.stringify(url.includes('er-api') ?
      {result:'success',rates,time_last_update_utc:now} :
      {date:'2026-10-09',usd:Object.fromEntries(Object.entries(rates).map(([code,value])=>[code.toLowerCase(),value]))}))}
  }).api;
  assert.equal((await owner.handler({})).statusCode,200);assert.equal(saved.crypto,null);
  assert.deepEqual(Object.keys(saved.rates).sort(),fx.SUPPORTED_CURRENCIES.filter(code=>code!=='USD').sort());
  assert.deepEqual(saved.retained_rate_codes,[]);
  assert.deepEqual(saved.source_warnings,[]);
});

test('partial forex refresh preserves each previously observed rate provider and date',async()=>{
  const rates=Object.fromEntries(fx.SUPPORTED_CURRENCIES.filter(code=>code!=='USD').map(code=>[code,code==='NGN'?1500:130]));
  const earlier='2026-10-09T05:00:00.000Z';let saved=null,partial=false;
  const owner=load('scheduled-fetch-forex-rates.js',{
    './_shared/data-store':{getData:async()=>saved,setData:async(_key,data)=>{saved=clone(data);return true;},updateMeta:async()=>{}},
    './_shared/scraper-request':{fetchWithRetry:async url=>{
      const upstream={...rates};if(partial)delete upstream.NGN;
      return new Response(JSON.stringify(url.includes('er-api') ?
        {result:'success',rates:upstream,time_last_update_utc:partial?now:earlier} :
        {date:'2026-10-09',usd:Object.fromEntries(Object.entries(rates).map(([code,value])=>[code.toLowerCase(),value]))}));
    }}
  }).api;
  assert.equal((await owner.handler({})).statusCode,200);
  assert.deepEqual(saved.rate_observations.NGN,{rate:1500,source:'exchangerate-api',observed_at:earlier});
  partial=true;assert.equal((await owner.handler({})).statusCode,200);
  assert.equal(saved.timestamp,now);assert.ok(saved.retained_rate_codes.includes('NGN'));
  assert.deepEqual(saved.rate_observations.NGN,{rate:1500,source:'exchangerate-api',observed_at:earlier});
  assert.deepEqual(saved.rate_observations.KES,{rate:130,source:'exchangerate-api',observed_at:now});
  assert.equal(fx.quoteUsdToLocal(saved,'NGN',feeds.options(now)).rate,1500);
  const expired=fx.quoteUsdToLocal(saved,'NGN',feeds.options('2026-10-11T06:00:00Z'));
  assert.equal(expired.rate,null);assert.equal(expired.observed_at,earlier);
});

test('partial forex refresh cannot infer retained legacy provenance from an old snapshot date',async()=>{
  const rates=Object.fromEntries(fx.SUPPORTED_CURRENCIES.filter(code=>code!=='USD').map(code=>[code,code==='NGN'?1500:130]));
  let saved;const upstream={...rates};delete upstream.NGN;
  const legacy={schemaVersion:1,base:'USD',source:'exchangerate-api',timestamp:'2026-10-09T05:00:00Z',rates,retained_rate_codes:[]};
  const owner=load('scheduled-fetch-forex-rates.js',{
    './_shared/data-store':{getData:async()=>legacy,setData:async(_key,data)=>{saved=clone(data);return true;},updateMeta:async()=>{}},
    './_shared/scraper-request':{fetchWithRetry:async url=>new Response(JSON.stringify(url.includes('er-api') ?
      {result:'success',rates:upstream,time_last_update_utc:now} :
      {date:'2026-10-09',usd:Object.fromEntries(Object.entries(rates).map(([code,value])=>[code.toLowerCase(),value]))}))}
  }).api;
  assert.equal((await owner.handler({})).statusCode,200);
  assert.ok(saved.rate_observations);assert.equal(Object.hasOwn(saved.rate_observations,'NGN'),false);
  const quote=fx.quoteUsdToLocal(saved,'NGN',feeds.options(now));
  assert.equal(quote.rate,null);assert.equal(quote.source,null);assert.equal(quote.observed_at,null);
});

for(const category of Object.keys(feeds.KEYS))test(category+' API response/status, old caches and country filter',async()=>{
  let payload=await collect(category),reads=[];
  const storage={getData:async key=>{reads.push(key);return key==='meta'?{[category]:{status:'ok',last_fetch:now}}:key===feeds.KEYS[category]?payload:null;}};
  const api=load('api-v1.js',{'./_lib/cache':{getOrFetch:async()=>({data:payload})},'./_shared/data-store':storage,
    './_shared/api-auth':{validateApiKey:async()=>({tier:'free'})}}).api;
  const request=params=>api.handler({httpMethod:'GET',path:'/api/v1/'+category,queryStringParameters:params});
  assert.equal((await request({country:'NG'})).statusCode,200);
  assert.equal((await request({country:'XX'})).statusCode,404);
  payload=null;assert.equal((await request({})).statusCode,503);
  const fresh=load('api-data-freshness.js',{'./_shared/data-store':storage,'./_shared/with-api':{withApi:fn=>fn},
    './_shared/scholarship-platform':{},'./_shared/market-data-refresh':{},'./_shared/env':{getEnv:()=>null}}).api;
  const config=fresh._test.CATEGORY_CONFIGS[category];
  assert.equal((await fresh._test.buildCategoryStatus(category,config,{[category]:{status:'ok',last_fetch:now}},Date.parse(now))).availability,'unavailable');
  assert.ok(reads.includes(feeds.KEYS[category]));
  payload=await collect(category);
  assert.equal((await fresh._test.buildCategoryStatus(category,config,{},Date.parse(now))).status,'stale');
  const watchdog=load('scheduled-source-health-watchdog.js',{'./_shared/data-store':storage,
    './_shared/scholarship-platform':{},'./_shared/market-data-refresh':{},'./_shared/email-adapter':{},
    './_shared/scheduled-event':{},'./_shared/scraper-run-health':{}}).api;
  const summary={sources:{},stale:[],degraded:[],failures:[],warnings:[],ok:true};
  await watchdog._test.checkLiveDataMeta(summary,Date.parse(now));
  assert.ok(summary.degraded.some(row=>row.id===category));
  assert.equal(summary.sources.live_data_meta.categories.find(row=>row.id===category).availability,'reference');
});

module.exports={load,valid,now};

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=process.env.AFROTOOLS_ARTICLE_CACHE_TEST_ROOT||path.join(__dirname,'..');
const templates=require(path.join(ROOT,'netlify/functions/_shared/afrostream-templates.json'));
const U=require(path.join(ROOT,'tools/afrostream/news-utils.js'));
const row={id:42,slug:'synthetic-public-report',title:'Synthetic public report',category:'platform',author:'AfroStream editorial',external_id:'editorial:synthetic',source_name:'Public source',source_url:'https://example.org/report',body:Array(150).fill('reporting').join(' '),excerpt:'Synthetic article.',published_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'};
function runtime(options={}) {
  const logs=[],calls=[],exports={},clock={now:1000};
  class Clock extends Date { static now(){return clock.now;} }
  const context=vm.createContext({exports,URL,AbortSignal,Date:Clock,process:{env:options.noKey?{}:{SUPABASE_DATA_SERVICE_ROLE_KEY:'DO_NOT_LOG_KEY'}},console:{warn(...args){logs.push(args);if(options.logThrows)throw Error('logger failure');}},fetch:async(url,config)=>{calls.push({url,config});return options.fetch?options.fetch(clock):new Response(JSON.stringify([row]),{status:200});},require(name){if(name==='./_shared/afrostream-templates.json')return options.templates||templates;if(name==='../../tools/afrostream/news-utils')return options.utils||U;throw Error('Unexpected dependency '+name);}});
  const filename=path.join(ROOT,'netlify/functions/afrostream-article.js');
  vm.runInContext(fs.readFileSync(filename,'utf8'),context,{filename});
  return {handler:exports.handler,logs,calls,clock};
}
const event={httpMethod:'GET',path:'/tools/afrostream/news/synthetic-public-report',rawUrl:'https://afrotools.com/tools/afrostream/news/synthetic-public-report?private=DO_NOT_LOG_QUERY',headers:{cookie:'DO_NOT_LOG_COOKIE'}};
function assertFailureLog(instance,category,status,view='article') {
  assert.equal(instance.logs.length,1);
  const [name,detail]=instance.logs[0];
  assert.equal(name,'afrostream_article_unavailable');
  assert.equal(detail.category,category);assert.equal(detail.view,view);
  assert.ok(Number.isInteger(detail.elapsed_ms)&&detail.elapsed_ms>=0&&detail.elapsed_ms<=60000);
  assert.deepEqual(Object.keys(detail).sort(),['category','elapsed_ms','view',...(status===undefined?[]:['upstream_status'])].sort());
  if(status!==undefined)assert.equal(detail.upstream_status,status);
  assert.ok(!JSON.stringify(instance.logs).includes('DO_NOT_LOG'));
}
function assertUncacheable(result,status) {
  assert.equal(result.statusCode,status);
  assert.equal(result.headers['Cache-Control'],'no-store');
  assert.equal(result.headers['Netlify-CDN-Cache-Control'],'no-store');
  assert.equal(result.headers['X-Robots-Tag'],'noindex,follow');
  assert.ok(!result.body.includes('id="as-article-bootstrap"'));
}
test('only successful public article/collection responses opt into durable without changing expiry or publication filters',async()=>{
  for(const request of [event,{httpMethod:'HEAD',path:event.path},{httpMethod:'GET',path:'/tools/afrostream/news'},{httpMethod:'GET',path:'/tools/afrostream'}]){
    const r=runtime(),response=await r.handler(request);
    assert.equal(response.statusCode,200);assert.equal(response.headers['Cache-Control'],'public,max-age=60');
    assert.equal(response.headers['Netlify-CDN-Cache-Control'],'public,durable,max-age=120,stale-while-revalidate=300');
    assert.equal(response.headers['Netlify-Cache-ID'],undefined);assert.equal(r.logs.length,0);assert.equal(r.calls.length,1);
    const url=new URL(r.calls[0].url);assert.equal(url.origin,'https://zpclagtgczsygrgztlts.supabase.co');
    assert.equal(url.searchParams.get('is_published'),'eq.true');assert.match(url.searchParams.get('published_at'),/^lte\.\d{4}-/);
    assert.equal(url.searchParams.get('select'),'id,title,slug,category,image_url,author,excerpt,body,is_featured,published_at,updated_at,source_url,source_name,external_id');
    if(request.httpMethod==='HEAD')assert.equal(response.body,'');
    if(request===event){assert.ok(response.body.includes('<h1>Synthetic public report</h1>'));assert.equal(response.headers['X-Robots-Tag'],'index,follow,max-image-preview:large');}
  }
});
test('public wire briefs retain noindex and empty collections remain valid without inventing stories',async()=>{
  const wire=runtime({fetch:async()=>new Response(JSON.stringify([{...row,author:'Publisher',external_id:'wire:fixture',body:'Brief.'}]))});
  assert.equal((await wire.handler(event)).headers['X-Robots-Tag'],'noindex,follow');
  const empty=runtime({fetch:async()=>new Response('[]')});const result=await empty.handler({httpMethod:'GET',path:'/tools/afrostream/news'});
  assert.equal(result.statusCode,200);assert.ok(result.body.includes('The scene is taking shape'));assert.equal(empty.logs.length,0);
});
test('missing/invalid stories and rejected methods are never cached or misreported as outages',async()=>{
  const missing=runtime({fetch:async()=>new Response('[]')});assertUncacheable(await missing.handler(event),404);assert.equal(missing.logs.length,0);
  const invalid=runtime();assertUncacheable(await invalid.handler({httpMethod:'GET',path:'/tools/afrostream/news/INVALID'}),404);assert.equal(invalid.calls.length,0);assert.equal(invalid.logs.length,0);
  assert.equal((await invalid.handler({...event,httpMethod:'POST'})).statusCode,405);assert.equal(invalid.calls.length,0);
});
test('missing credentials emit only a fixed configuration category',async()=>{
  const r=runtime({noKey:true});assertUncacheable(await r.handler(event),503);assert.equal(r.calls.length,0);assertFailureLog(r,'configuration_missing');
});
test('HTTP failure status is classified without retry or upstream-body leakage',async()=>{
  for(const status of [401,403,429,500,502,503,504]){
    const r=runtime({fetch:async()=>new Response('DO_NOT_LOG_UPSTREAM_BODY',{status})});assertUncacheable(await r.handler(event),503);assert.equal(r.calls.length,1);assertFailureLog(r,'upstream_http',status);
  }
});
test('network and body timeouts are separate from malformed payloads and renderer failures',async()=>{
  const cases=[
    ['upstream_network',{fetch:async()=>{throw TypeError('DO_NOT_LOG_CONNECTION');}},undefined],
    ['upstream_timeout',{fetch:async()=>{const error=Error('DO_NOT_LOG_TIMEOUT');error.name='TimeoutError';throw error;}},undefined],
    ['upstream_timeout',{fetch:async()=>({ok:true,status:200,json:async()=>{const error=Error('DO_NOT_LOG_BODY');error.name='AbortError';throw error;}})},200],
    ['invalid_payload',{fetch:async()=>new Response('DO_NOT_LOG_JSON')},200],
    ['invalid_payload',{fetch:async()=>new Response('{"private":"DO_NOT_LOG_ROW"}')},200],
    ['render_failure',{utils:{...U,articleHTML(){throw TypeError('DO_NOT_LOG_RENDER');}}},200]
  ];
  for(const [category,options,status]of cases){const r=runtime(options);assertUncacheable(await r.handler(event),503);assertFailureLog(r,category,status);assert.equal(r.calls.length,1);}
});
test('numeric log fields stay bounded and logger failure does not replace the public error response',async()=>{
  for(const now of [-1,900000,NaN]){
    const r=runtime({logThrows:true,fetch:async(clock)=>{clock.now=now;throw Error('DO_NOT_LOG_FAILURE');}});assertUncacheable(await r.handler(event),503);assertFailureLog(r,'upstream_network');
  }
  const collection=runtime({fetch:async()=>new Response('{}',{status:503})});await collection.handler({httpMethod:'GET',path:'/tools/afrostream/news'});assertFailureLog(collection,'upstream_http',503,'news');
});

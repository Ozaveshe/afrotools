'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const SECRET='synthetic-secret-response-marker';
function load(name,fetch,modules={}) {
  const file=path.join(__dirname,'../netlify/functions/_shared',name),realRequire=createRequire(file),module={exports:{}},logs=[];
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{module,exports:module.exports,require:id=>Object.hasOwn(modules,id)?modules[id]:realRequire(id),
    console:Object.fromEntries(['log','warn','error'].map(level=>[level,(...args)=>logs.push(args.join(' '))])),
    process:{env:{SUPABASE_SERVICE_ROLE_KEY:'synthetic-test-key'}},fetch,Response,AbortController,URL,Buffer,Date,Promise,setTimeout,clearTimeout}, {filename:file});
  return {api:module.exports,logs};
}
const pending=()=>new Promise(()=>{});
const expectSafe=(logs,error)=>{assert.ok(!logs.join('\n').includes(SECRET));assert.ok(!String(error).includes(SECRET));};
test('never-settling fetch is aborted and rejects inside the operation deadline',async()=>{
  let signal;const request=load('scraper-request.js',async(_url,opts)=>{signal=opts.signal;return pending();});
  const start=performance.now();await assert.rejects(request.api.fetchWithRetry('https://invalid.example/'+SECRET,{timeoutMs:35}),error=>error.code==='UPSTREAM_TIMEOUT');
  assert.equal(signal.aborted,true);assert.ok(performance.now()-start<1000);expectSafe(request.logs);
});
test('body deadline survives successful headers, including an abort-ignorant body',async()=>{
  let signal;const request=load('scraper-request.js',async(_url,opts)=>{signal=opts.signal;return {ok:true,status:200,arrayBuffer:pending};});
  await assert.rejects(request.api.fetchWithRetry('https://invalid.example/',{timeoutMs:35}),error=>error.code==='UPSTREAM_TIMEOUT');
  assert.equal(signal.aborted,true);
});
test('caller cancellation before fetch and during body is preserved without leaking its reason',async()=>{
  let calls=0;const request=load('scraper-request.js',async()=>{calls++;return {ok:true,status:200,arrayBuffer:pending};});
  const controller=new AbortController();controller.abort(new Error(SECRET));
  await assert.rejects(request.api.fetchWithRetry('https://invalid.example/',{signal:controller.signal}),error=>error.code==='UPSTREAM_ABORTED');
  assert.equal(calls,0);
  const active=new AbortController();const result=request.api.fetchWithRetry('https://invalid.example/',{signal:active.signal});
  setTimeout(()=>active.abort(new Error(SECRET)),20);
  await assert.rejects(result,error=>{expectSafe(request.logs,error);return error.code==='UPSTREAM_ABORTED';});assert.equal(calls,1);
});
test('retry backoff consumes the same deadline and cannot start a late attempt',async()=>{
  let calls=0;const request=load('scraper-request.js',async()=>{calls++;return new Response('',{status:503});});
  await assert.rejects(request.api.fetchWithRetry('https://invalid.example/?api_key='+SECRET,{backoffMs:100,timeoutMs:35}),error=>error.code==='UPSTREAM_TIMEOUT');
  await new Promise(resolve=>setTimeout(resolve,120));assert.equal(calls,1);expectSafe(request.logs);
});
for(const status of [400,401,403,404])test('nonretryable HTTP '+status+' fails once with metadata only',async()=>{
  let calls=0;const request=load('scraper-request.js',async()=>{calls++;return new Response(SECRET,{status});});
  await assert.rejects(request.api.fetchWithRetry('https://invalid.example/'+SECRET,{backoffMs:0}),error=>{expectSafe(request.logs,error);return error.status===status&&error.code==='UPSTREAM_HTTP_ERROR';});
  assert.equal(calls,1);
});
for(const status of [429,500,503])test('retryable HTTP '+status+' can recover without forwarding helper options',async()=>{
  let calls=0,options;const request=load('scraper-request.js',async(_url,opts)=>{calls++;options=opts;return new Response(calls===1?SECRET:'{"ok":true}',{status:calls===1?status:200});});
  const result=await request.api.fetchWithRetry('https://invalid.example/?key='+SECRET,{backoffMs:0,retries:2,timeoutMs:500,headers:{Accept:'application/json'}});
  assert.deepEqual(await result.json(),{ok:true});assert.equal(calls,2);
  for(const key of ['backoffMs','retries','timeoutMs'])assert.equal(Object.hasOwn(options,key),false);
  assert.equal(options.headers.Accept,'application/json');expectSafe(request.logs);
});
test('network errors with forged internal codes never escape as original errors',async()=>{
  const request=load('scraper-request.js',async()=>{const error=new Error(SECRET);error.code='UPSTREAM_HTTP_ERROR';throw error;});
  await assert.rejects(request.api.fetchWithRetry('https://invalid.example/'+SECRET,{retries:2,backoffMs:0}),error=>{
    expectSafe(request.logs,error);return error.code==='UPSTREAM_NETWORK_ERROR';});
});
test('native malformed JSON is replaced with a fixed body failure',async()=>{
  const request=load('scraper-request.js',async()=>new Response(SECRET));
  const response=await request.api.fetchWithRetry('https://invalid.example/');
  await assert.rejects(response.json(),error=>{expectSafe(request.logs,error);return error.code==='UPSTREAM_BODY_ERROR';});
});
test('text, arrayBuffer, headers and clone still work after the bounded read',async()=>{
  const request=load('scraper-request.js',async()=>new Response('fixture',{headers:{'x-fixture':'yes'}}));
  const response=await request.api.fetchWithRetry('https://invalid.example/');
  assert.equal(response.headers.get('x-fixture'),'yes');assert.equal(await response.clone().text(),'fixture');
  assert.equal(Buffer.from(await response.arrayBuffer()).toString(),'fixture');
});
test('source/transform exceptions never reach console, database payload, metadata or response body',async()=>{
  for(const stage of ['source','transform']) {
    const inserts=[],patches=[];
    const runner=load('scraper-base.js',async(_url,opts)=>{inserts.push(JSON.parse(opts.body));return {ok:true};},{
      './data-store':{getData:async()=>null,setData:async()=>{throw new Error('Unexpected write');},updateMeta:async(_key,patch)=>patches.push(patch)},
      './scraper-request':{fetchWithRetry:async()=>{throw new Error('Unexpected upstream request');}}
    });
    const result=await runner.api.runScraper({id:'synthetic-reference',blobKey:'synthetic-reference-latest',
      sources:[{name:'FixtureSource',fn:async()=>{if(stage==='source')throw new Error(SECRET);return {countries:[]};}}],
      transform:()=>{throw new Error(SECRET);}});
    assert.equal(result.statusCode,500);assert.ok(inserts.length);expectSafe(runner.logs);
    assert.ok(!JSON.stringify({result,inserts,patches}).includes(SECRET));
  }
});
test('source fallback stays ordered and reference collection never gains numeric confidence',async()=>{
  const order=[],inserts=[],patches=[];
  const runner=load('scraper-base.js',async(_url,opts)=>{inserts.push(JSON.parse(opts.body));return {ok:true};},{
    './data-store':{getData:async()=>null,setData:async()=>true,updateMeta:async(_key,patch)=>patches.push(patch)},
    './scraper-request':{}
  });
  const result=await runner.api.runScraper({id:'synthetic-reference',blobKey:'fixture-latest',sourceType:'reference',sources:[
    {name:'First',fn:async()=>{order.push('first');throw new Error(SECRET);}},
    {name:'CommunityReference',fn:async()=>{order.push('second');return {countries:[{code:'NG'}]};}},
    {name:'Third',fn:async()=>{order.push('third');return {};}}
  ]});
  assert.equal(result.statusCode,200);assert.deepEqual(order,['first','second']);
  assert.equal(patches[0].source_type,'reference');assert.equal(patches[0].confidence,null);
  assert.equal(inserts.length,1);assert.equal(inserts[0].status,'ok');expectSafe(runner.logs);
});

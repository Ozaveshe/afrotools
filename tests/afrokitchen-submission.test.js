'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://zpclagtgczsygrgztlts.supabase.co';
const KEY = 'synthetic-service-key';
const plain = v => JSON.parse(JSON.stringify(v));
const payload = () => ({ action: 'submit-recipe', name: 'Synthetic recipe', country_code: 'SL', ingredients_text: '2 cups beans\n1 onion', steps_text: '1. Mix.\n2. Bake.', story: 'Family story', consent: true, website: '', photo_permission: false });
function fixture({ status = 201, env = {}, transport } = {}) {
  const calls = [], logs = [], timers = new Map(); let nextTimer = 0;
  const sandbox = { Buffer, URL, AbortController, process: {env: {SUPABASE_AUTH_URL: ORIGIN, SUPABASE_AUTH_SERVICE_KEY: KEY, ...env}},
    console: {log: (...v) => logs.push(v), error: (...v) => logs.push(v)},
    setTimeout: (fn, ms) => { timers.set(++nextTimer, {fn, ms}); return nextTimer; }, clearTimeout: id => timers.delete(id),
    fetch: async (url, options) => { calls.push({url, options}); if (transport) return transport(url, options); return {status, ok: status >= 200 && status < 300}; }
  };
  const context=vm.createContext(sandbox), cache=new Map();
  function load(relative) {
    if(cache.has(relative))return cache.get(relative).exports;
    const module={exports:{}};cache.set(relative,module);
    const requireMock = name => {
      if(name === 'crypto')return {randomUUID:()=>{throw Error('No UUID required');}};
      if(name === '@netlify/blobs')return {getStore:()=>{throw Error('No blob access permitted');}};
      if(name === './_shared/afrokitchen-publication')return {checkPublicRecipe:()=>{throw Error('No parent read permitted');},isRecipeId:()=>false};
      if(name === './_shared/rate-limit')return load('netlify/functions/_shared/rate-limit.js');
      throw Error('Unexpected dependency');
    };
    vm.runInContext('(function(require,module,exports){'+fs.readFileSync(path.join(ROOT,relative),'utf8')+'\n})',context)(requireMock,module,module.exports);
    return module.exports;
  }
  const handler=load('netlify/functions/afrokitchen-community.js').handler;
  const send=(body=payload(), extra={})=>handler({httpMethod:'POST',headers:{origin:'https://afrotools.com','content-type':'application/json','x-nf-client-connection-ip':'192.0.2.1'},body:JSON.stringify(body),...extra});
  return {send,calls,logs,timers,timeout(){assert.equal(timers.size,1);const t=[...timers.values()][0];assert.equal(t.ms,8000);t.fn();}};
}
test('valid recipe makes one fixed private pending INSERT, preserves Unicode/lines and composes context once', async()=>{
  const f=fixture();const body={...payload(), name:'Synthetic ñame', email:'cook@example.invalid', photo_links:'https://example.invalid/photo', photo_permission:true, region_community:'Synthetic community'};
  const r=await f.send(body);assert.equal(r.statusCode,201);assert.deepEqual(JSON.parse(r.body),{success:true,status:'pending'});
  assert.equal(f.calls.length,1);const {url,options}=f.calls[0];assert.equal(url,ORIGIN+'/rest/v1/recipe_submissions');
  assert.equal(options.method,'POST');assert.equal(options.headers.Prefer,'return=minimal');assert.equal(options.headers.apikey,KEY);
  const row=JSON.parse(options.body);assert.deepEqual(Object.keys(row).sort(),['name','country_code','description','ingredients_text','steps_text','story','submitted_by','email','status'].sort());
  assert.equal(row.status,'pending');assert.equal(row.ingredients_text,body.ingredients_text);assert.equal(row.steps_text,body.steps_text);
  assert.equal(row.name,body.name);assert.equal(row.story.split('Editorial context').length,2);assert.ok(row.story.includes('Photo permission: yes'));
  assert.ok(!r.body.includes('example.invalid'));assert.deepEqual(f.logs,[]);assert.equal(f.timers.size,0);assert.equal(options.signal.aborted,true);
});
for(const [label,edit,code] of [
  ['blank name',b=>b.name='  ',400], ['missing ingredients',b=>delete b.ingredients_text,400],
  ['unknown country',b=>b.country_code='XX',400], ['country object',b=>b.country_code={},400],
  ['email invalid',b=>b.email='invalid',400], ['name too long',b=>b.name='a'.repeat(161),400],
  ['name object',b=>b.name={},400], ['NUL',b=>b.story='a\0b',400],
  ['no consent',b=>b.consent=false,400], ['string consent',b=>b.consent='true',400],
  ['no photo rights',b=>b.photo_links='https://example.invalid/a',400], ['string photo rights',b=>b.photo_permission='yes',400],
  ['honeypot',b=>b.website='spam',400], ['protected status',b=>b.status='approved',400],
  ['table override',b=>b.table='recipes',400], ['oversize UTF8',b=>b.story='🍠'.repeat(20000),413]
])test('rejects '+label+' before all persistence',async()=>{const f=fixture();const b=payload();edit(b);const r=await f.send(b);assert.equal(r.statusCode,code);assert.equal(f.calls.length,0);assert.ok(!r.body.includes(KEY));});
for(const [label,extra,code] of [
 ['foreign origin',{headers:{origin:'https://evil.netlify.app','content-type':'application/json'}},403],
 ['prefix origin',{headers:{origin:'http://localhost.attacker.invalid','content-type':'application/json'}},403],
 ['missing origin',{headers:{'content-type':'application/json'}},403],
 ['wrong content type',{headers:{origin:'https://afrotools.com','content-type':'text/plain'}},415],
 ['base64',{isBase64Encoded:true},413], ['malformed JSON',{body:'{'},400], ['array',{body:'[]'},400], ['null',{body:'null'},400]
])test('rejects '+label,async()=>{const f=fixture();assert.equal((await f.send(payload(),extra)).statusCode,code);assert.equal(f.calls.length,0);});
for(const origin of ['https://www.afrotools.com','https://branch--afrotools.netlify.app','http://127.0.0.1:4173','http://localhost:4173'])test('accepts fixed first-party/local origin '+origin,async()=>{const f=fixture();assert.equal((await f.send(payload(),{headers:{origin,'content-type':'application/json'}})).statusCode,201);});
for(const [label,env] of [['missing key',{SUPABASE_AUTH_SERVICE_KEY:''}],['wrong project',{SUPABASE_AUTH_URL:'https://other.supabase.co'}]])test(label+' fails closed',async()=>{const f=fixture({env});assert.equal((await f.send()).statusCode,503);assert.equal(f.calls.length,0);});
for(const status of [200,204,400,401,429,500])test('upstream '+status+' never claims persistence or retries',async()=>{const f=fixture({status});const r=await f.send();assert.equal(r.statusCode,503);assert.equal(f.calls.length,1);assert.ok(!r.body.includes(KEY));assert.deepEqual(f.logs,[]);assert.equal(f.timers.size,0);});
test('transport failure is generic, with no PII/provider error logging',async()=>{const f=fixture({transport:()=>{throw Error(KEY+' cook@example.invalid');}});assert.equal((await f.send()).statusCode,503);assert.deepEqual(f.logs,[]);assert.equal(f.calls.length,1);});
test('hung upstream is bounded and aborted without retry or successful ack',async()=>{const f=fixture({transport:()=>new Promise(()=>{})});const pending=f.send();f.timeout();const r=await pending;assert.equal(r.statusCode,503);assert.equal(f.calls.length,1);assert.equal(f.calls[0].options.signal.aborted,true);assert.equal(f.timers.size,0);});
test('rate limit uses platform IP before spoofed forwarded IP and blocks sixth write',async()=>{const f=fixture();for(let i=0;i<6;i++){const r=await f.send(payload(),{headers:{origin:'https://afrotools.com','content-type':'application/json','x-nf-client-connection-ip':'192.0.2.1','x-forwarded-for':'198.51.100.'+i}});assert.equal(r.statusCode,i<5?201:429);}assert.equal(f.calls.length,5);});
function browserFixture(file,transport) {
 const calls=[],timers=new Map();let next=0;
 const sandbox={window:{},AbortController,setTimeout:(fn,ms)=>{timers.set(++next,{fn,ms});return next;},clearTimeout:id=>timers.delete(id),fetch:async(url,opts)=>{calls.push({url,opts});return transport(url,opts);}};
 sandbox.window.AfroAuth={getSupabase(){throw Error('Browser database forbidden');}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),sandbox);
 return {engine:sandbox.AfroKitchenEngine,calls,timers};
}
for(const file of ['engines/src/afrokitchen-engine.js','engines/afrokitchen-engine.js']){
 test(file+' uses one same-origin POST and requires exact persistence ack',async()=>{const f=browserFixture(file,async()=>({status:201,ok:true,json:async()=>({success:true,status:'pending'})}));const r=await f.engine.submitRecipe(payload());assert.deepEqual(plain(r),{success:true,status:'pending'});assert.equal(f.calls.length,1);assert.equal(f.calls[0].url,'/.netlify/functions/afrokitchen-community');assert.equal(f.calls[0].opts.credentials,'omit');assert.deepEqual(Object.keys(f.calls[0].opts.headers),['Content-Type']);assert.equal(JSON.parse(f.calls[0].opts.body).action,'submit-recipe');assert.equal(f.timers.size,0);});
 for(const ack of [{success:true},{success:false,status:'pending'},{success:true,status:'published'}])test(file+' refuses incomplete/wrong ack '+JSON.stringify(ack),async()=>{const f=browserFixture(file,async()=>({status:201,ok:true,json:async()=>ack}));assert.ok(!(await f.engine.submitRecipe(payload())).success);assert.equal(f.calls.length,1);});
 test(file+' bounds body parsing too and leaves errors generic',async()=>{const f=browserFixture(file,async()=>({status:201,ok:true,json:()=>new Promise(()=>{})}));const pending=f.engine.submitRecipe(payload());await Promise.resolve();assert.equal(f.timers.size,1);const timer=[...f.timers.values()][0];assert.equal(timer.ms,12000);timer.fn();assert.ok(!(await pending).success);assert.equal(f.timers.size,0);});
}

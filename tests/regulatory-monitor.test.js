'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {createLoader} = require('../assets/js/pages/regulatory-monitor.js');
const {MAX_BYTES} = require('../assets/js/lib/regulatory-public-feed.js');
const root=path.join(__dirname,'..'), seed=JSON.parse(fs.readFileSync(path.join(root,'data/regulatory/public-feed.json')));
const sandbox={};vm.runInNewContext(fs.readFileSync(path.join(root,'engines/src/regulatory-alerts-engine.js'),'utf8'),sandbox);
const engine=sandbox.RAEngine, now=()=>Date.parse('2026-10-16T11:00:00Z');
const copy=()=>JSON.parse(JSON.stringify(seed));
function response(data=copy(), extra={}) {
  return {ok:true,headers:{get:name=>name==='content-type'?'application/json; charset=utf-8':null},text:async()=>JSON.stringify(data),...extra};
}
function loader(reply, overrides={}) {
  const states=[],calls=[];
  return {...createLoader({engine,now,onState:s=>states.push(s),isOnline:()=>true,
    fetch:(...args)=>{calls.push(args);return typeof reply==='function'?reply():reply;},...overrides}),states,calls};
}
test('actual reviewed event uses only fixed credential-free same-origin JSON and preserves dated evidence',async()=>{
  const l=loader(response()),r=await l.load();assert.equal(r.kind,'ready');assert.equal(r.records.length,1);
  assert.equal(l.calls[0][0],'/data/regulatory/public-feed.json');
  const options=l.calls[0][1];assert.equal(options.method,'GET');assert.equal(options.credentials,'omit');
  assert.equal(options.redirect,'error');assert.equal(options.cache,'no-cache');assert.equal(options.signal.aborted,true);
  assert.equal(r.records[0].effective_date,'2026-03-01');assert.equal(r.records[0].reviewed_at,'2026-10-16T10:05:05.416Z');
  assert.match(r.message,/1 selected historical event in 1 country/);assert.match(r.message,/not comprehensive or current-law/);
});
test('offline and missing transport cannot become mock rows or query a database',async()=>{
  const l=loader(null,{isOnline:()=>false});assert.equal((await l.load()).kind,'offline');assert.equal(l.calls.length,0);
  const source=fs.readFileSync(path.join(root,'assets/js/pages/regulatory-monitor.js'),'utf8');
  assert.doesNotMatch(source,/getSupabase|\.from\(|MOCK|\.insert\(|\.rpc\(/);
});
test('valid empty feed is distinct from corrupt schema, private rows, failed HTTP and HTML rewrite',async()=>{
  const empty=copy();empty.records=[];empty.coverage.countries=[];empty.coverage.change_types=[];
  const r=await loader(response(empty)).load();assert.equal(r.kind,'empty');assert.match(r.message,/does not mean no regulations/);
  const bad=copy();bad.records[0].receipt_id='synthetic-private';
  for(const reply of [response({},{}),response(bad),response(copy(),{ok:false}),
    response(copy(),{headers:{get:()=> 'text/html'}}),response(copy(),{text:async()=>'<html>wrong body</html>'}),
    ()=>Promise.reject(Error('synthetic transport'))]){
    const l=loader(reply),result=await l.load();assert.equal(result.kind,'unavailable');assert.equal(result.records.length,0);
  }
});
test('eight-second budget covers hung headers and decoded body, aborts and permits explicit retry',async()=>{
  for(const phase of ['headers','body']){
    let fire,calls=0,signal,reply=phase==='headers'?new Promise(()=>{}):response(copy(),{text:()=>new Promise(()=>{})});
    const l=loader(null,{fetch:(_url,options)=>{calls++;signal=options.signal;return reply;},setTimeout:(fn,ms)=>{assert.equal(ms,8000);fire=fn;return 17;},clearTimeout:id=>assert.equal(id,17)});
    const p=l.load();assert.equal(l.load(),p);await Promise.resolve();fire();assert.equal((await p).kind,'unavailable');
    assert.equal(calls,1);assert.equal(signal.aborted,true);reply=response();assert.equal((await l.load()).kind,'ready');assert.equal(calls,2);
  }
});
test('declared and actual oversized bodies fail closed',async()=>{
  for(const reply of [
    response(copy(),{headers:{get:name=>name==='content-type'?'application/json':String(MAX_BYTES+1)}}),
    response(copy(),{text:async()=> ' '.repeat(MAX_BYTES+1)})]){
    assert.equal((await loader(reply).load()).kind,'unavailable');
  }
});
function pageHarness(reply) {
  const page=fs.readFileSync(path.join(root,'tools/regulatory-alerts/index.html'),'utf8');
  const script=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function loadChanges()'));
  const elements={};
  for(const id of ['monitorStatus','monitorRetry','changeList','statChanges','statCountries','raTicker','changeCount']){
    let text='',html='';elements[id]={disabled:false,attributes:{},setAttribute(k,v){this.attributes[k]=v;},get textContent(){return text;},set textContent(v){text=v;html='';},get innerHTML(){return html;},set innerHTML(v){html=v;text='';}};
  }
  let current=reply;
  const window={RegulatoryMonitor:{createLoader:options=>createLoader({...options,now})},navigator:{onLine:true},fetch:()=>typeof current==='function'?current():current};
  const document={addEventListener(){},getElementById:id=>elements[id],querySelectorAll:()=>[]};
  const instrumented=script.replace(/\}\)\(\);\s*$/,"window.__monitorTest={load:loadChanges,setCountry:setCountryFilter,setEngine:function(value){E=value;}};})();");
  vm.runInNewContext(instrumented,{window,document,console});window.__monitorTest.setEngine(engine);
  return {page,window,elements,setResponse:r=>{current=r;},load:()=>window.__monitorTest.load()};
}
test('actual page renders real event, sources, historical/review status and safely recovers from error',async()=>{
  const h=pageHarness(response()),p=h.load();assert.equal(h.elements.monitorRetry.disabled,true);await p;
  assert.equal(h.elements.statChanges.textContent,'1');assert.equal(h.elements.statCountries.textContent,'1');
  assert.match(h.elements.changeList.innerHTML,/South Africa: 2026/);assert.match(h.elements.changeList.innerHTML,/30\.23 per ordinary hour/);
  assert.match(h.elements.changeList.innerHTML,/historical/);assert.match(h.elements.changeList.innerHTML,/2026-02-03/);
  assert.match(h.elements.changeList.innerHTML,/labour\.gov\.za/);assert.match(h.elements.changeList.innerHTML,/2027-01-14T10:05:05.416Z/);
  h.setResponse(response(copy(),{ok:false}));await h.load();assert.equal(h.elements.statChanges.textContent,'—');
  assert.equal(h.elements.changeList.innerHTML,'');assert.equal(h.elements.raTicker.innerHTML,'');assert.equal(h.elements.monitorRetry.disabled,false);
  const safe=copy();safe.records[0].title='<img src=x onerror=alert(1)>';h.setResponse(response(safe));await h.load();
  assert.match(h.elements.changeList.innerHTML,/&lt;img/);assert.doesNotMatch(h.elements.changeList.innerHTML,/<img src=x/);
});
test('actual page has honest empty/filter-miss states and visible overdue/withdrawn correction',async()=>{
  const h=pageHarness(response());await h.load();h.window.__monitorTest.setCountry('NG');
  assert.match(h.elements.changeList.innerHTML,/No changes found for this filter/);assert.equal(h.elements.statChanges.textContent,'1');
  h.window.__monitorTest.setCountry('ALL');
  const d=copy();d.records[0].reviewed_at='2026-02-04T10:00:00.000Z';d.records[0].status='withdrawn';d.records[0].correction_note='Synthetic correction for test.';
  h.setResponse(response(d));await h.load();assert.match(h.elements.monitorStatus.textContent,/due for source review/);
  assert.match(h.elements.changeList.innerHTML,/Source review due/);assert.match(h.elements.changeList.innerHTML,/withdrawn/);assert.match(h.elements.changeList.innerHTML,/Synthetic correction/);
  d.records=[];d.coverage.countries=[];d.coverage.change_types=[];h.setResponse(response(d));await h.load();
  assert.equal(h.elements.statChanges.textContent,'0');assert.equal(h.elements.statCountries.textContent,'0');assert.match(h.elements.monitorStatus.textContent,/No published records/);
});
test('page wiring preserves accessible recovery, report scope and truthful feed/related-tool copy',()=>{
  const h=pageHarness(response());assert.match(h.page,/id="monitorStatus" role="status" aria-live="polite"/);
  assert.match(h.page,/id="monitorRetry"/);assert.match(h.page,/lib\/regulatory-public-feed.js/);
  assert.doesNotMatch(h.page,/E\.MOCK_CHANGES|Live — Recent Changes|Gazette Verified|Countries monitored|Changes tracked in 2026/);
  assert.match(h.page,/one historical South African minimum-wage event/);assert.match(h.page,/does not update or certify a calculator/);
  const stat=h.page.match(/ra-stat-num">(\d+)<\/span>\s*<span class="ra-stat-label">Report country options/);
  assert.equal(Number(stat[1]),engine.COUNTRIES.length);assert.match(h.page,/private review decision does not publish a report here/);
});

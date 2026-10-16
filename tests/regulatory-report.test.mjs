import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHandler } from '../netlify/functions/regulatory-report.mjs';
import { validateReport, quotaKey, COUNTRIES, TYPES } from '../netlify/functions/_shared/regulatory-report.mjs';

const id='9b77e55d-4378-484b-90bb-cd4f753d7957', receipt='a212b0d4-514f-4bd0-9c9e-26802f558fde';
const input = () => ({request_id:id,consent:true,country_code:'NG',change_type:'minimum-wage',title:'Synthetic gazette update',details:'Synthetic public regulatory details for testing.',source_url:'https://example.org/gazette',effective_date:'2026-10-16'});
const record = () => ({status:'pending_review',receipt_id:receipt,received_at:'2026-10-16T09:00:00+00:00'});
const env = name => name==='REGULATORY_REPORT_HMAC_SECRET'?'s'.repeat(32):'synthetic-service-key';
const req = (body=input(),headers={},url='https://example.net/.netlify/functions/regulatory-report') => new Request(url,{method:'POST',headers:{origin:new URL(url).origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
const context={ip:'192.0.2.3'};
test('validator shares all current country/type choices, rejects malformed consent/fields/date/source/limits',()=>{
  const sandbox={}; vm.runInNewContext(fs.readFileSync(new URL('../engines/src/regulatory-alerts-engine.js',import.meta.url),'utf8'),sandbox);
  const engine=sandbox.RegulatoryAlertsEngine || Object.values(sandbox).find(x=>x?.COUNTRIES);
  assert.ok(engine); assert.deepEqual(COUNTRIES.slice().sort(),Array.from(engine.COUNTRIES,x=>x.code).sort()); assert.deepEqual(TYPES.slice().sort(),Object.keys(engine.CHANGE_TYPES).sort());
  assert.equal(validateReport(input()).payload.source_url,'https://example.org/gazette');
  for(const change of [{consent:false},{email:'not collected'},{country_code:'XX'},{change_type:'invented'},{title:'abc'},{details:'x'.repeat(2001)},{effective_date:'2026-02-30'},{effective_date:'1899-01-01'},{effective_date:false},{effective_date:0},{source_url:'javascript:alert(1)'},{source_url:'https://user:pass@example.org/'},{source_url:'https://example.org/"bad'},{details:'x'.repeat(20)+'\u0001'}]) assert.throws(()=>validateReport({...input(),...change}));
});
test('platform IP only, HMAC stable for canonical IPv6, daily rotation and no raw IP',()=>{
  const a=quotaKey('2001:db8::1','2026-10-16','s'.repeat(32));
  assert.equal(a,quotaKey('2001:0db8:0:0:0:0:0:1','2026-10-16','s'.repeat(32))); assert.match(a,/^[a-f0-9]{64}$/); assert.notEqual(a,quotaKey('2001:db8::1','2026-10-17','s'.repeat(32)));
  assert.throws(()=>quotaKey('', '2026-10-16','s'.repeat(32)));
});
test('acknowledges exact durable receipt only, fixed project, no identity/body leak',async()=>{
  let captured;
  const h=createHandler({env,fetchImpl:async(url,options)=>{captured={url,options};return Response.json(record());}});
  const response=await h(req(input(),{'x-forwarded-for':'198.51.100.8'}),context),data=await response.json();
  assert.equal(response.status,201);assert.deepEqual(data,record());assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('access-control-allow-origin'),null);
  assert.equal(captured.url,'https://zpclagtgczsygrgztlts.supabase.co/rest/v1/rpc/submit_regulatory_report');
  const sent=JSON.parse(captured.options.body);assert.equal(sent.p_request_id,id);assert.equal(sent.p_quota_key,quotaKey(context.ip,sent.p_day,'s'.repeat(32)));assert.equal(Object.hasOwn(sent,'ip'),false);assert.equal(JSON.stringify(data).includes('Synthetic'),false);assert.equal(captured.options.signal.aborted,true);
});
test('same-origin, method, JSON, body bounds and consent reject before any backend dispatch',async()=>{
  let calls=0;const h=createHandler({env,fetchImpl:async()=>{calls++;throw Error('unexpected');}});
  for(const [request,status] of [[new Request('https://example.net/x'),405],[req(input(),{origin:'https://evil.example'}),403],[req(input(),{'sec-fetch-site':'cross-site'}),403],[req(input(),{'content-type':'text/plain'}),415],[req(input(),{'content-length':'999999'}),413],[req({...input(),consent:false}),400],[req({...input(),details:'x'.repeat(20000)}),400]]) assert.equal((await h(request,context)).status,status);
  assert.equal(calls,0);
  const response=await h(req(input(),{'x-forwarded-for':'192.0.2.5'}),{});assert.equal(response.status,503);assert.equal(calls,0);
});
test('quota/conflict/unavailable/malformed response never becomes success or raw upstream disclosure',async()=>{
  for(const [upstream,expected] of [[Response.json({code:'PT429',details:'private'},{status:400}),429],[Response.json({code:'PT409'},{status:400}),409],[Response.json({error:'private service details'},{status:500}),503],[Response.json({ok:true}),503],[new Response('x'.repeat(5000)),503]]) {
    const h=createHandler({env,fetchImpl:async()=>upstream}),response=await h(req(),context),text=await response.text();assert.equal(response.status,expected);assert.equal(text.includes('private'),false);
  }
});
test('hung upstream headers and hung body are bounded, both abort, no extra dispatch',async()=>{
  for(const mode of ['headers','body','request-body']){
    let signal,calls=0,cancelled=false;
    const h=createHandler({env,budgetMs:25,fetchImpl:async(url,options)=>{calls++;signal=options.signal;if(mode==='headers') return new Promise(()=>{});return new Response(new ReadableStream({cancel(){cancelled=true;}}));}});
    const request=mode==='request-body'?new Request('https://example.net/x',{method:'POST',duplex:'half',headers:{origin:'https://example.net','content-type':'application/json'},body:new ReadableStream({cancel(){cancelled=true;}})}):req();
    const start=Date.now(),response=await h(request,context);assert.equal(response.status,503);assert.ok(Date.now()-start<1000);if(mode==='request-body')assert.equal(calls,0);else assert.equal(signal.aborted,true);if(mode!=='headers')assert.equal(cancelled,true);
  }
});

const require=createRequire(import.meta.url),install=require('../assets/js/pages/regulatory-report.js');
function browser(fetchImpl,online=true,budgetMs=100){
  const elements={},classes=()=>{const set=new Set();return{add:x=>set.add(x),remove:x=>set.delete(x),contains:x=>set.has(x)}};
  for(const name of ['reportForm','repBtn','reportSuccessMsg','reportErrorMsg','repNewRequest','repCountry','repType','repTitle','repDetails','repSource','repEffDate','repConsent'])elements[name]={value:'',checked:true,hidden:true,textContent:'',classList:classes(),addEventListener(){},setAttribute(){},focus(options){this.focusOptions=options;},scrollIntoView(options){this.scrollOptions=options;}};
  Object.assign(elements.repCountry,{value:'NG'});elements.repType.value='minimum-wage';elements.repTitle.value='Synthetic gazette update';elements.repDetails.value='Synthetic public regulatory details for testing.';elements.repSource.value='https://example.org/gazette';elements.repEffDate.value='2026-10-16';
  let resets=0;elements.reportForm.reportValidity=()=>true;elements.reportForm.reset=()=>{resets++;};
  const client=install({document:{getElementById:id=>elements[id]},fetch:fetchImpl,online:()=>online,crypto:{randomUUID:()=>id},budgetMs});
  return{elements,client,resets:()=>resets,submit:()=>client.submit({preventDefault(){}})};
}
test('browser waits for valid201 receipt; timeout preserves draft and same request ID on retry',async()=>{
  let calls=[],release;
  const b=browser(async(url,options)=>{calls.push(JSON.parse(options.body));if(calls.length===1)return new Promise(resolve=>{release=resolve;});return Response.json(record(),{status:201});},true,20);
  const first=b.submit();assert.equal(b.resets(),0);assert.equal(b.elements.repBtn.disabled,true);await first;assert.equal(b.resets(),0);assert.match(b.elements.reportErrorMsg.textContent,/unconfirmed/);
  await b.submit();assert.equal(b.resets(),1);assert.equal(calls[0].request_id,calls[1].request_id);assert.match(b.elements.reportSuccessMsg.textContent,/Report received for review/);
  release(Response.json(record(),{status:201}));await new Promise(resolve=>setTimeout(resolve,5));assert.equal(b.resets(),1);
});
test('browser offline/consent/errors/invalid receipt preserve fields and never reset',async()=>{
  let calls=0;const off=browser(async()=>{calls++;},false);await off.submit();assert.equal(calls,0);assert.equal(off.resets(),0);assert.match(off.elements.reportErrorMsg.textContent,/Nothing was sent/);
  const no=browser(async()=>{calls++;});no.elements.repConsent.checked=false;await no.submit();assert.equal(calls,0);
  for(const response of [Response.json(record()),Response.json({status:'pending_review',receipt_id:'bad',received_at:'bad'},{status:201}),Response.json({error:'raw private'},{status:429}),new Response('x'.repeat(3000),{status:201})]){
    const b=browser(async()=>response);await b.submit();assert.equal(b.resets(),0);assert.equal(b.elements.reportSuccessMsg.classList.contains('visible'),false);assert.equal(b.elements.repTitle.value,'Synthetic gazette update');assert.equal(b.elements.reportErrorMsg.textContent.includes('raw private'),false);
  }
});
test('changed uncertain report requires explicit new request, no silent second POST',async()=>{
  let calls=0;const b=browser(async()=>{calls++;throw Error('offline');});await b.submit();b.elements.repTitle.value='Different report title';await b.submit();assert.equal(calls,1);assert.match(b.elements.reportErrorMsg.textContent,/Restore its fields/);
});
test('browser bounds a hung response body and keeps an uncertain report',async()=>{
  let cancelled=false;
  const b=browser(async()=>new Response(new ReadableStream({cancel(){cancelled=true;}}),{status:201}),true,20);
  await b.submit();assert.equal(cancelled,true);assert.equal(b.resets(),0);assert.match(b.elements.reportErrorMsg.textContent,/unconfirmed/);assert.equal(b.elements.repBtn.disabled,false);
});
test('feedback receives focus and instant viewport movement only after a user action',async()=>{
  const accepted=browser(async()=>Response.json(record(),{status:201}));
  assert.equal(accepted.elements.reportSuccessMsg.focusOptions,undefined);assert.equal(accepted.elements.reportErrorMsg.focusOptions,undefined);
  await accepted.submit();assert.deepEqual(accepted.elements.reportSuccessMsg.focusOptions,{preventScroll:true});assert.deepEqual(accepted.elements.reportSuccessMsg.scrollOptions,{block:'center',behavior:'instant'});
  const offline=browser(async()=>{throw Error('must not dispatch');},false);await offline.submit();assert.deepEqual(offline.elements.reportErrorMsg.focusOptions,{preventScroll:true});assert.deepEqual(offline.elements.reportErrorMsg.scrollOptions,{block:'center',behavior:'instant'});
});
test('page removes unsupported reward/SLA and timer; admin escapes text and restricts URL schemes',()=>{
  const page=fs.readFileSync(new URL('../tools/regulatory-alerts/index.html',import.meta.url),'utf8');
  assert.equal(/function submitReport|within 48 hours|up to 225|\+50 pts|\+25 pts|AfroPoints automatically|⚡ AfroPoints|report for AfroPoints/.test(page),false);assert.match(page,/repConsent/);assert.match(page,/pages\/regulatory-report.js/);assert.match(page,/#repNewRequest\[hidden\]\{display:none\}/);assert.match(page,/id="reportSuccessMsg" role="status" aria-live="polite" tabindex="-1"/);assert.match(page,/id="reportErrorMsg" role="alert" tabindex="-1"/);
  const admin=fs.readFileSync(new URL('../admin/review.html',import.meta.url),'utf8'),sandbox={URL};
  for(const name of ['escapeHtml','safeSourceURL']){const start=admin.indexOf('function '+name+'('),end=admin.indexOf('\n}',start)+2;vm.runInNewContext(admin.slice(start,end),sandbox);}
  assert.equal(sandbox.safeSourceURL('javascript:alert(1)'),'');assert.equal(sandbox.safeSourceURL('https://u:p@example.org'),'');assert.equal(sandbox.safeSourceURL('https://example.org/'),'https://example.org/');assert.equal(sandbox.escapeHtml('<script>"\''),'&lt;script&gt;&quot;&#39;');
});

test('actual admin renderer escapes report fields and does not make executable untrusted links',()=>{
  const source=fs.readFileSync(new URL('../admin/review.html',import.meta.url),'utf8');
  const table={innerHTML:''},sandbox={URL,document:{getElementById:()=>table},confidenceClass:()=>'',formatDateTime:()=>'',humanizeLabel:x=>x};
  for(const name of ['escapeHtml','safeSourceURL','renderGazetteTable']){const start=source.indexOf('function '+name+'('),end=source.indexOf('\n}',start)+2;vm.runInNewContext(source.slice(start,end),sandbox);}
  sandbox.renderGazetteTable([{id,description:'<img src=x onerror=alert(1)>',country_name:'<script>x</script>',change_type:'<b>type</b>',source_url:'javascript:alert(1)',source_name:'<svg onload=alert(1)>',confidence:0}]);
  assert.equal(table.innerHTML.includes('href="javascript:'),false);assert.equal(table.innerHTML.includes('<img'),false);assert.equal(table.innerHTML.includes('<script>'),false);assert.match(table.innerHTML,/&lt;img/);assert.match(table.innerHTML,/&lt;svg/);
});

function adminHandler(community=true,fail=''){
  const calls=[],sandbox={exports:{},require:()=>({getAllowedOrigin:()=> 'https://example.net'}),process:{env:{ADMIN_KEY:'synthetic-admin',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service'}},fetch:async(url,options={})=>{
    calls.push({url,options});
    if(url.includes('/gazette_changes?')&&options.method!=='PATCH')return Response.json([{id,country_code:'NG',change_type:'minimum-wage',source_name:community?'Community report (unverified)':'Gazette'}]);
    if(url.includes('/rpc/review_regulatory_report'))return fail==='receipt'?Response.json({ok:true}):fail==='patch'?new Response('',{status:503}):Response.json({ok:true,decision:JSON.parse(options.body).p_action,gazette_id:id});
    return new Response('',{status:fail==='patch'?503:200});
  }};
  vm.runInNewContext(fs.readFileSync(new URL('../netlify/functions/api-gazette-review.js',import.meta.url),'utf8'),sandbox);
  return{handler:sandbox.exports.handler,calls};
}
test('admin approval/rejection resolves only matching receipt queue; legacy filter unchanged; no points',async()=>{
  for(const action of ['approve','reject']){
    const instance=adminHandler(); const response=await instance.handler({httpMethod:'POST',headers:{'x-admin-key':'synthetic-admin'},body:JSON.stringify({id,action})});
    assert.equal(response.statusCode,200);assert.equal(instance.calls.length,2);
    const queue=instance.calls.at(-1);assert.ok(queue.url.endsWith('/rpc/review_regulatory_report'));assert.deepEqual(JSON.parse(queue.options.body),{p_gazette_id:id,p_action:action,p_notes:''});
    assert.equal(instance.calls.some(x=>/points|contributions/.test(x.url)),false);
  }
  const legacy=adminHandler(false);assert.equal((await legacy.handler({httpMethod:'POST',headers:{'x-admin-key':'synthetic-admin'},body:JSON.stringify({id,action:'approve'})})).statusCode,200);assert.match(legacy.calls.at(-1).url,/reason=eq.gazette_detected/);assert.equal(legacy.calls.length,3);
  for(const failure of ['receipt','patch']){const bad=adminHandler(true,failure);assert.equal((await bad.handler({httpMethod:'POST',headers:{'x-admin-key':'synthetic-admin'},body:JSON.stringify({id,action:'approve'})})).statusCode,503);assert.equal(bad.calls.some(x=>x.url.includes('/review_queue?')&&x.options.method==='PATCH'),false);}
});
test('admin GET legacy-rejection reconciliation preserves community signals and nullable legacy sources',async()=>{
  const calls=[],sandbox={exports:{},require:()=>({getAllowedOrigin:()=> 'https://example.net'}),process:{env:{ADMIN_KEY:'synthetic-admin',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service'}},fetch:async(url,options={})=>{
    calls.push({url,options});
    if(url.includes('reason=eq.gazette_detected&status=eq.rejected'))return Response.json([{country_code:'NG',metric:'minimum-wage',reviewed_at:'2026-10-16T00:00:00Z'}]);
    return options.method==='PATCH'?new Response('',{status:200}):Response.json([]);
  }};
  vm.runInNewContext(fs.readFileSync(new URL('../netlify/functions/api-gazette-review.js',import.meta.url),'utf8'),sandbox);
  assert.equal((await sandbox.exports.handler({httpMethod:'GET',headers:{'x-admin-key':'synthetic-admin'}})).statusCode,200);
  const patch=calls.find(x=>x.options.method==='PATCH');assert.ok(patch);
  assert.equal(new URL(patch.url).searchParams.get('or'),'(source_name.is.null,source_name.neq."Community report (unverified)")');
  assert.equal(JSON.parse(patch.options.body).applied_to_tools,true);
});
test('legacy scheduled cleanup excludes retained community review rows without changing other deletes',async()=>{
  const calls=[],sandbox={exports:{},require:()=>({withScheduledProof:(name,fn)=>fn}),process:{env:{SUPABASE_SERVICE_ROLE_KEY:'synthetic-service'}},console:{log(){},error(){}},fetch:async(url,options)=>{calls.push({url,options});return Response.json([]);}};
  vm.runInNewContext(fs.readFileSync(new URL('../netlify/functions/scheduled-cleanup-scraper-runs.js',import.meta.url),'utf8'),sandbox);
  assert.equal((await sandbox.exports.handler({})).statusCode,200);assert.equal(calls.length,3);
  assert.equal(new URL(calls[2].url).searchParams.get('reason'),'neq.community_regulatory_report');assert.equal(new URL(calls[2].url).searchParams.get('status'),'neq.pending');
  assert.ok(calls[0].url.includes('/scraper_runs?fetched_at=lt.'));assert.ok(calls[1].url.includes('/data_confidence?created_at=lt.'));
});

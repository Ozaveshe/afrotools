'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');
const root = path.resolve(__dirname, '..');
const sourceRoot = process.env.AFROTOOLS_CV_PRIVACY_SOURCE_ROOT || root;
const flush = async () => { for(let i=0;i<12;i++) await new Promise(resolve=>setImmediate(resolve)); };

function harness(options={}) {
  const requests=[],logs=[],elements={},store=new Map(),intervals=[],events={},documentEvents={};
  ['cv-cloud-consent','cv-cloud-status','cv-cloud-restore'].forEach(id=>elements[id]={checked:false,disabled:false,textContent:'',addEventListener(event,fn){this[event]=fn;}});
  const current={data:{fn:'Synthetic',ln:'Candidate',email:'synthetic@example.test',summary:'PRIVATE_CV_SENTINEL'},country:'NG',template:'ats-classic',savedCVs:[{id:'saved-local',data:{fn:'Synthetic',summary:'PRIVATE_CV_SENTINEL'},template:'ats-classic'}]};
  store.set('afro_cv_data',JSON.stringify(current)); store.set('afro_cv_list',JSON.stringify(current.savedCVs));
  let user={id:'synthetic-account-a'},confirm=true;
  const window={CVApp:{getState:()=>current,renderAll:()=>{}},AfroAuth:{getUser:()=>user,isLoggedIn:()=>Boolean(user),getSessionTokenAsync:options.token || (async()=> 'synthetic-token')},
    location:{search:''},setInterval:fn=>{intervals.push(fn);return intervals.length;},addEventListener:(name,fn)=>events[name]=fn,dispatchEvent:()=>{},confirm:()=>confirm};
  const cvApp=window.CVApp;
  if(options.lateBridge)delete window.CVApp;
  const context=vm.createContext({window,document:{readyState:options.lateBridge?'interactive':'complete',getElementById:id=>elements[id],addEventListener:(name,fn)=>documentEvents[name]=fn},localStorage:{getItem:key=>store.get(key)||null,setItem(key,value){if(options.storageFails)throw Error('PRIVATE_CV_SENTINEL');store.set(key,value);}},
    console:{warn:(...args)=>logs.push(args),error:(...args)=>logs.push(args)},URLSearchParams,CustomEvent:function(){},
    fetch:async(url,init)=>{requests.push({url,method:init.method,body:init.body});if(options.fetch)return options.fetch(url,init);return{ok:true,text:async()=>JSON.stringify({data:options.remote||[],item:{}})};}});
  ['assets/js/lib/workspace-sync.js','tools/cv-builder/js/cv-workspace-sync.js'].forEach(file=>vm.runInContext(fs.readFileSync(path.join(sourceRoot,file),'utf8'),context,{filename:file}));
  return {requests,logs,elements,current,store,window,intervals,context,setUser:value=>user=value,setConfirm:value=>confirm=value,
    exposeBridge(){window.CVApp=cvApp;documentEvents.DOMContentLoaded();},
    async enable(){elements['cv-cloud-consent'].checked=true;elements['cv-cloud-consent'].change();await flush();},
    disable(){elements['cv-cloud-consent'].checked=false;elements['cv-cloud-consent'].change();},
    async tick(){for(const fn of intervals)fn();if(events.focus)events.focus();await flush();},
    async restore(){elements['cv-cloud-restore'].click();await flush();}};
}

test('signed-in startup and focus never send CV data before an explicit choice',async()=>{
  const h=harness();await flush();await h.tick();assert.equal(h.requests.length,0);assert.equal(h.elements['cv-cloud-consent'].checked,false);
  assert.equal(h.current.data.summary,'PRIVATE_CV_SENTINEL');assert.equal(h.intervals.length,1);
});
test('deferred consent module waits for the existing DOMContentLoaded CV bridge and remains usable',async()=>{
  const h=harness({lateBridge:true});assert.equal(h.elements['cv-cloud-consent'].disabled,true);assert.equal(h.requests.length,0);
  h.exposeBridge();assert.equal(h.elements['cv-cloud-consent'].disabled,false);await h.enable();assert.deepEqual(h.requests.map(r=>r.method),['GET','POST','POST']);
});
test('explicit permission backs up draft and saved CVs; unchanged ticks do not rewrite; edits and deletion sync',async()=>{
  const h=harness();await h.enable();assert.deepEqual(h.requests.map(r=>r.method),['GET','POST','POST']);
  assert.equal(JSON.parse(h.requests[1].body).payload.data.summary,'PRIVATE_CV_SENTINEL');
  await h.tick();assert.equal(h.requests.length,3);
  h.current.data.title='Synthetic revised title';await h.tick();assert.equal(h.requests.length,4);
  h.current.savedCVs=[];await h.tick();assert.equal(h.requests[4].method,'DELETE');
  h.disable();h.current.data.title='Local only';await h.tick();assert.equal(h.requests.length,5);
  await h.enable();assert.equal(h.intervals.length,1);
});
test('cloud data never silently overwrites a draft or same-id local saved CV; restore needs a confirmed action',async()=>{
  const h=harness({remote:[{item_type:'cv-draft',payload:{data:{fn:'Cloud synthetic',summary:'CLOUD_SENTINEL'},template:'slate'}},
    {item_type:'cv',item_key:'saved-local',payload:{id:'saved-local',data:{summary:'Remote older'}}},
    {item_type:'cv',item_key:'saved-remote',payload:{id:'saved-remote',data:{summary:'Remote extra'}}}]});
  await h.enable();assert.equal(h.current.data.summary,'PRIVATE_CV_SENTINEL');assert.equal(h.current.savedCVs.length,2);assert.equal(h.current.savedCVs[0].data.summary,'PRIVATE_CV_SENTINEL');
  h.setConfirm(false);await h.restore();assert.equal(h.current.data.summary,'PRIVATE_CV_SENTINEL');
  h.setConfirm(true);await h.restore();assert.equal(h.current.data.summary,'CLOUD_SENTINEL');assert.equal(JSON.parse(h.store.get('afro_cv_data')).data.summary,'CLOUD_SENTINEL');
});
test('account change and logout withdraw permission; another account never inherits it',async()=>{
  const h=harness();await h.enable();const count=h.requests.length;h.setUser({id:'synthetic-account-b'});h.current.data.summary='Other account local';await h.tick();
  assert.equal(h.requests.length,count);assert.equal(h.elements['cv-cloud-consent'].checked,false);
  h.setUser(null);await h.tick();assert.equal(h.elements['cv-cloud-consent'].disabled,true);assert.equal(h.requests.length,count);
});
test('logout remains revoked even when legacy workspace profile caches still contain the same account',async()=>{
  const h=harness();await h.enable();const count=h.requests.length;
  h.store.set('afro_auth_v2',JSON.stringify({id:'synthetic-account-a'}));h.setUser(null);h.current.data.summary='Local after logout';await h.tick();
  assert.equal(h.window.AfroWorkspace.getUser().id,'synthetic-account-a');assert.equal(h.requests.length,count);assert.equal(h.elements['cv-cloud-consent'].checked,false);assert.equal(h.elements['cv-cloud-consent'].disabled,true);
});
test('revocation while authenticated transport awaits a token stops the request at the actual fetch boundary',async()=>{
  let release;const h=harness({token:()=>new Promise(resolve=>release=resolve)});
  h.elements['cv-cloud-consent'].checked=true;h.elements['cv-cloud-consent'].change();await flush();h.disable();release('synthetic-token');await flush();
  assert.equal(h.requests.length,0);assert.equal(h.logs.length,0);
});
test('revocation or account change while cloud list is pending prevents all payload writes and local restoration',async()=>{
  for(const change of ['off','account']){
    let release;const h=harness({fetch:()=>new Promise(resolve=>release=resolve)});
    h.elements['cv-cloud-consent'].checked=true;h.elements['cv-cloud-consent'].change();await flush();
    if(change==='off')h.disable();else h.setUser({id:'synthetic-account-b'});
    release({ok:true,text:async()=>JSON.stringify({data:[{item_type:'cv-draft',payload:{data:{summary:'CLOUD_SENTINEL'}}}]})});await flush();await h.tick();
    assert.equal(h.requests.length,1);assert.equal(h.current.data.summary,'PRIVATE_CV_SENTINEL');assert.equal(h.elements['cv-cloud-consent'].checked,false);
  }
});
test('storage and provider failures fail closed without logging raw private errors or automatic retry loops',async()=>{
  for(const options of [{storageFails:true},{fetch:async()=>{throw Error('PRIVATE_CV_SENTINEL token=synthetic');}}]){
    const h=harness(options);await h.enable();const count=h.requests.length;await h.tick();await h.tick();
    assert.equal(h.requests.length,count);assert.equal(h.elements['cv-cloud-consent'].checked,false);assert.equal(h.current.data.summary,'PRIVATE_CV_SENTINEL');
    assert.equal(h.logs.length,1);assert.equal(JSON.stringify(h.logs).includes('PRIVATE_CV_SENTINEL'),false);assert.match(h.elements['cv-cloud-status'].textContent,/failed/);
  }
});
test('every remaining CV export and shared workspace diagnostic passes only fixed metadata, never error details',()=>{
  const files=['assets/js/lib/workspace-sync.js','tools/cv-builder/js/cv-app.js','tools/cv-builder/js/cv-application-pack-export.js','tools/cv-builder/js/cv-export-pdf-quality.js','tools/cv-builder/js/cv-workspace-sync.js'];
  let count=0;
  function walk(node,visit){if(!node||typeof node!=='object')return;visit(node);for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(v=>walk(v,visit));else if(value&&typeof value.type==='string')walk(value,visit);}}
  const hostile=new Proxy({}, {get(){throw Error('Private error object was read');}});
  files.forEach(file=>{const source=fs.readFileSync(path.join(sourceRoot,file),'utf8');walk(acorn.parse(source,{ecmaVersion:'latest'}),node=>{
    if(node.type!=='CallExpression'||node.callee.type!=='MemberExpression'||node.callee.object.name!=='console'||!['warn','error'].includes(node.callee.property.name))return;
    const captured=[];vm.runInNewContext(source.slice(node.start,node.end),{console:{warn:(...args)=>captured.push(args),error:(...args)=>captured.push(args)},e:hostile,t:hostile,error:hostile});
    assert.equal(captured.length,1);assert.equal(captured[0].length,2);assert.equal(typeof captured[0][0],'string');assert.deepEqual(Object.keys(captured[0][1]).sort(),['code','tool_id']);
    assert.equal(JSON.stringify(captured).includes('PRIVATE_CV_SENTINEL'),false);count++;
  });});assert.equal(count,10);
});

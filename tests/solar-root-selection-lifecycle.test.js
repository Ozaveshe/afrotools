'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const file = process.env.SOLAR_ROOT_OWNER || path.join(__dirname, '../tools/solar-roi/index.html');
const html = fs.readFileSync(file, 'utf8');
const script = html.match(/<script data-locale-shell-controller>([\s\S]*?)<\/script>/)[1];
function deferred() { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); promise.catch(() => {}); return { promise, resolve, reject }; }
async function flush() { await new Promise(resolve => setImmediate(resolve)); }

// Entire actual inline owner, real URL/Blob/Intl; minimal DOM and controlled
// clipboard boundaries. These checks do not claim a real browser clipboard.
function harness({ search = '', stored = '', clipboard } = {}) {
  const nodes = new Map(), downloads = [], blobs = new Map(), writes = [], storage = new Map();
  if (stored) storage.set('afrotools.solarRoi.country', stored);
  let blobId=0;
  function node(tag='DIV') {
    const attrs=new Map();
    return { tagName:tag,value:'',textContent:'',hidden:false,disabled:false,children:[],listeners:{},href:'',
      setAttribute(k,v){attrs.set(k,String(v));},getAttribute(k){return attrs.get(k)??null;},removeAttribute(k){attrs.delete(k);if(k==='href')this.href='';},
      addEventListener(k,fn){this.listeners[k]=fn;}, querySelectorAll(){return [];}, appendChild(n){this.children.push(n);}, remove(){},
      focus(){}, click(){ downloads.push({ filename:this.download, blob:blobs.get(this.href) }); },
      fire(type,event={}){ return this.listeners[type]?.(event); }
    };
  }
  const ids=['solarRootCountrySearch','solarRootCountrySelect','solarRootCountryOpen','solarCountryGrid','solarCountrySearchStatus','solarRootCountryStatus','solarCountryEmpty','solarRootCopyBrief','solarRootDownloadBrief','solarRootExportStatus','solarAssumptionPreview','solarAssumptionStatus','solarAssumptionNote','solarAssumptionSourceText','solarAssumptionSourceLink'];
  for(const id of ids)nodes.set(id,node());
  const countryData=JSON.parse(script.match(/var COUNTRIES=(\[[^\n]+\]);/)[1]);
  const cards=countryData.map(c=>{const n=node('A');n.setAttribute('data-country',`${c.name} ${c.slug} ${c.code} ${c.currency}`.toLowerCase());n.setAttribute('data-country-slug',c.slug);return n;});
  nodes.get('solarCountryGrid').querySelectorAll=()=>cards;
  const location={href:'http://127.0.0.1/tools/solar-roi/'+search,search};
  const history={replaceState(_a,_b,url){location.href=url;location.search=new URL(url).search;}};
  class LocalURL extends URL {
    static createObjectURL(blob){const id='blob:synthetic-'+(++blobId);blobs.set(id,blob);return id;}
    static revokeObjectURL(id){blobs.delete(id);}
  }
  const navigator={};
  if(clipboard!==null)navigator.clipboard={writeText(text){writes.push(text);return clipboard?clipboard(text):Promise.resolve();}};
  const document={getElementById:id=>nodes.get(id)||null,readyState:'complete',body:node('BODY'),createElement:tag=>node(tag.toUpperCase()),addEventListener(){}};
  const window={location,AfroTools:{analytics:{track(){}}}};
  vm.runInNewContext(script,{window,document,location,history,navigator,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},URL:LocalURL,URLSearchParams,Blob,Intl,Promise,setTimeout(){},clearTimeout(){}},{filename:file});
  return {nodes,location,downloads,writes,cards,
    input(value){nodes.get('solarRootCountrySearch').value=value;nodes.get('solarRootCountrySearch').fire('input');},
    select(value){nodes.get('solarRootCountrySelect').value=value;nodes.get('solarRootCountrySelect').fire('change');},
    copy(){nodes.get('solarRootCopyBrief').fire('click');}, download(){nodes.get('solarRootDownloadBrief').fire('click');},
    status(){return nodes.get('solarRootExportStatus').textContent;},
    enter(){const event={key:'Enter',prevented:false,preventDefault(){this.prevented=true;}};nodes.get('solarRootCountrySearch').fire('keydown',event);return event;}
  };
}

test('ordinary sequential country typing retains every typed character and selects exact Kenya',()=>{
 const h=harness();for(const value of ['K','Ke','Ken','Keny','Kenya']){h.input(value);assert.equal(h.nodes.get('solarRootCountrySearch').value,value);}
 assert.equal(h.nodes.get('solarRootCountrySelect').value,'kenya');assert.equal(h.nodes.get('solarRootCountryOpen').href,'/tools/solar-roi/kenya/');
});
test('partial country is not silently replaced by the first match or old selection',()=>{
 const h=harness();h.input('South');assert.equal(h.nodes.get('solarRootCountrySearch').value,'South');assert.equal(h.nodes.get('solarRootCopyBrief').disabled,true);assert.equal(h.nodes.get('solarRootCountryOpen').getAttribute('aria-disabled'),'true');
 const before=h.location.href;const e=h.enter();assert.equal(e.prevented,true);assert.equal(h.location.href,before);
});
test('unknown and empty input cannot export the previous Nigeria selection',()=>{
 for(const query of ['Atlantis','']){const h=harness();h.input(query);h.copy();h.download();assert.equal(h.writes.length,0);assert.equal(h.downloads.length,0);assert.equal(h.nodes.get('solarRootDownloadBrief').disabled,true);}
});
test('exact country code resolves without replacing query text',()=>{
 const h=harness();h.input('KE');assert.equal(h.nodes.get('solarRootCountrySearch').value,'KE');assert.equal(h.nodes.get('solarRootCountryOpen').href,'/tools/solar-roi/kenya/');
});
test('shared currency is ambiguous until the visitor chooses a country',()=>{
 const h=harness();h.input('USD');assert.equal(h.nodes.get('solarRootCopyBrief').disabled,true);h.select('somalia');assert.equal(h.nodes.get('solarRootCountryOpen').href,'/tools/solar-roi/somalia/');assert.equal(h.nodes.get('solarRootCopyBrief').disabled,false);
});
test('accent-insensitive exact country names resolve while preserving typed spelling',()=>{
 const h=harness();h.input("Cote d'Ivoire");assert.equal(h.nodes.get('solarRootCountrySelect').value,'cote-divoire');assert.equal(h.nodes.get('solarRootCountrySearch').value,"Cote d'Ivoire");
});
test('clipboard denial and synchronous error announce download fallback',async()=>{
 for(const sync of [false,true]){const d=deferred();const h=harness({clipboard(){if(sync)throw new Error('denied');return d.promise;}});h.copy();if(!sync)d.reject(new Error('denied'));await flush();assert.match(h.status(),/Copy failed.*Download JSON/i);}
});
test('clipboard absence offers the existing local JSON alternative',()=>{
 const h=harness({clipboard:null});h.copy();assert.match(h.status(),/unavailable.*Download JSON/i);
});
test('late clipboard success cannot overwrite a new country status',async()=>{
 const d=deferred();const h=harness({clipboard:()=>d.promise});h.copy();h.select('kenya');const current=h.status();d.resolve();await flush();assert.equal(h.status(),current);assert.match(current,/Kenya/);
});
test('late clipboard failure cannot overwrite a new country status',async()=>{
 const d=deferred();const h=harness({clipboard:()=>d.promise});h.copy();h.select('kenya');const current=h.status();d.reject(new Error('denied'));await flush();assert.equal(h.status(),current);
});
test('a newer copy attempt owns status even for the same selected country',async()=>{
 const jobs=[deferred(),deferred()];let index=0;const h=harness({clipboard:()=>jobs[index++].promise});h.copy();h.copy();jobs[1].resolve();await flush();const current=h.status();jobs[0].reject(new Error('older'));await flush();assert.equal(h.status(),current);assert.match(current,/copied for Nigeria/);
});
test('actual generated JSON bytes and filename match the current selection',async()=>{
 const h=harness();h.download();h.select('kenya');h.download();assert.equal(h.downloads.length,2);
 const a=JSON.parse(await h.downloads[0].blob.text()),b=JSON.parse(await h.downloads[1].blob.text());
 assert.equal(a.country_code,'NG');assert.equal(b.country_code,'KE');assert.equal(b.currency,'KES');assert.equal(b.route,'/tools/solar-roi/kenya/');assert.equal(h.downloads[1].filename,'afrotools-solar-roi-kenya-brief.json');assert.match(b.brief,/Kenya \(KES\)/);
});
test('invalid explicit URL country does not silently export Nigeria',()=>{
 for (const value of ['Atlantis','','%20']) {
  const h=harness({search:'?country='+value});h.download();assert.equal(h.downloads.length,0);assert.equal(h.nodes.get('solarRootCountrySearch').value,decodeURIComponent(value));assert.equal(h.nodes.get('solarRootCountryOpen').getAttribute('aria-disabled'),'true');
 }
});

test('a JSON download owns status over an older pending clipboard attempt',async()=>{
 const d=deferred();const h=harness({clipboard:()=>d.promise});h.copy();h.download();const current=h.status();d.resolve();await flush();assert.equal(h.status(),current);assert.match(current,/JSON downloaded for Nigeria/);
});
test('valid stored/default selection and explicit dropdown remain usable',()=>{
 const h=harness({stored:'KE'});assert.equal(h.nodes.get('solarRootCountrySearch').value,'Kenya');h.select('ghana');assert.equal(h.nodes.get('solarRootCountrySearch').value,'Ghana');const e=h.enter();assert.equal(e.prevented,true);assert.equal(h.location.href,'/tools/solar-roi/ghana/');
});

test('real upstream bounded generator owns the two fragments and is idempotent without other writes',()=>{
 const generator=process.env.SOLAR_GENERATOR_OWNER||path.join(__dirname,'../scripts/generate-energy-x54.js');
 const requireOwner=createRequire(generator), realFs=requireOwner('node:fs');
 let current=html;let writes=0;const exited={};
 const target=path.resolve(path.dirname(generator),'../tools/solar-roi/index.html');
 const guardedFs={...realFs,
  readFileSync(p,...args){return path.resolve(String(p))===target?current:realFs.readFileSync(p,...args);},
  mkdirSync(){throw new Error('Unexpected directory mutation');},
  writeFileSync(p,data){assert.equal(path.resolve(String(p)),target);current=String(data);writes++;}
 };
 function execute(){
  const context={require:name=>name==='fs'?guardedFs:requireOwner(name),__dirname:path.dirname(generator),console:{log(){}},process:{argv:['node',generator,'--solar-root-selection-only'],exit(code){assert.equal(code,0);throw exited;}}};
  try{vm.runInNewContext(realFs.readFileSync(generator,'utf8'),context,{filename:generator});assert.fail('Bounded generator did not exit');}catch(e){if(e!==exited)throw e;}
 }
 execute();
 assert.equal(current.match(/<script data-locale-shell-controller>[\s\S]*?<\/script>/)[0],html.match(/<script data-locale-shell-controller>[\s\S]*?<\/script>/)[0]);
 assert.equal(current.match(/<select id="solarRootCountrySelect"[^>]*>[\s\S]*?<\/select>/)[0],html.match(/<select id="solarRootCountrySelect"[^>]*>[\s\S]*?<\/select>/)[0]);
 const once=current,count=writes;execute();assert.equal(current,once);assert.equal(writes,count);
});

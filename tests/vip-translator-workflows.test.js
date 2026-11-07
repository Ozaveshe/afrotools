'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=process.env.AFROTOOLS_VIP_TEST_ROOT||path.resolve(__dirname,'..');
const LANGUAGES=[{slug:'hausa',name:'Hausa',code:'ha',sample:'Na gode. Ƙofa, ɗaki, ɓera.'},{slug:'swahili',name:'Swahili',code:'sw',sample:'Asante. Niko vizuri.'},{slug:'yoruba',name:'Yoruba',code:'yo',sample:'Ẹ ṣé. Ilé àti ilẹ̀.'}];
// Provider strings below are synthetic Unicode fixtures, not linguistic accuracy evidence.
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
async function flush(){for(let n=0;n<8;n++)await Promise.resolve();}
function harness(language,options={}){
 const source=fs.readFileSync(path.join(ROOT,'tools',language.slug+'-translator','translator-vip.js'),'utf8');
 const nodes=new Map(),requests=[],downloads=[];let accepted=Boolean(options.accepted),resetCount=0;
 class Element{
  constructor(id){this.id=id||'';this.value='';this.textContent='';this.disabled=false;this.listeners={};this.attrs={};this.dataset={};if(id)nodes.set(id,this);}
  setAttribute(k,v){this.attrs[k]=String(v);}
  addEventListener(k,fn){(this.listeners[k]||=[]).push(fn);}
  fire(k,event={}){return Promise.all((this.listeners[k]||[]).map(fn=>fn(event)));}
  click(){if(this.download)downloads.push(this.download);return this.disabled?Promise.resolve():this.fire('click');}
  focus(){} scrollIntoView(){}
  insertBefore(node){if(node.id)nodes.set(node.id,node);} appendChild(node){this.insertBefore(node);}
  querySelector(){return new Element();}
  set innerHTML(value){this._html=value;for(const match of value.matchAll(/<([a-z0-9]+)\b([^>]*\bid="([^"]+)"[^>]*)>([^<]*)/gi)){const node=new Element(match[3]);node.textContent=match[4];node.disabled=/\bdisabled\b/.test(match[2]);}}
  get innerHTML(){return this._html||'';}
 }
 for(const id of ['vipExportStatus','downloadPhrasebookTxt','printPhrasebookPdf','search','usePhraseQuery','hausaUsageSelect','hausaUsageOutput','swahiliMeaningSelect','swahiliMeaningOutput','yorubaOrthographySelect','yorubaOrthographyOutput'])new Element(id);
 const container=new Element('container');
 const consent={render(){},hasConsent:()=>accepted,requireConsent:()=>accepted,headers:()=>({'X-AfroTools-External-Translation-Consent':'accepted'}),reset(){accepted=false;resetCount++;}};
 const window={TRANSLATOR_VIP:{name:language.name,slug:language.slug+'-translator',checked:'2026-07-26'},TRANSLATOR_CONFIG:{toolId:language.slug+'-translator',source:'en',target:language.code},AfroTools:{ExternalTranslationConsent:consent},print(){}};
 const document={readyState:'complete',getElementById:id=>nodes.get(id)||null,querySelector:()=>container,querySelectorAll:()=>[],createElement:()=>new Element()};
 const context={window,document,PHRASES:[{en:'Synthetic phrase',lang:language.sample,pron:'',cat:'greetings'}],Blob,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},setTimeout(fn){fn();},AbortController:options.noAbort?undefined:AbortController,
  fetch:(url,init)=>{const job=deferred();requests.push({url,init,...job});return job.promise;},console:{log(){throw Error('Must not log text');}}};
 vm.runInNewContext(source,context,{filename:language.slug+'-translator-vip.js'});
 const node=id=>{assert(nodes.has(id),'Runtime created '+id);return nodes.get(id);};
 return{node,requests,downloads,get resetCount(){return resetCount;},async consent(value){accepted=value;await node('liveTranslateCard').fire('afrotools:external-translation-consent-change',{detail:{accepted:value}});},
  async edit(text){node('translateInput').value=text;await node('translateInput').fire('input');},begin(){return node('translateBtn').click();},enter(){return node('translateInput').fire('keydown',{key:'Enter',shiftKey:false,preventDefault(){}});},
  async reply(index,text){requests[index].resolve({ok:true,json:()=>Promise.resolve({translatedText:text,provider:'Synthetic fixture'})});await flush();},
  async translate(text,result){await this.edit(text);const done=this.begin();await this.reply(requests.length-1,result);await done;}
 };
}
for(const language of LANGUAGES){
 const check=(name,fn)=>test(language.name+': '+name,fn);
 check('local phrasebook and Swap never send without explicit opt-in',async()=>{
  const h=harness(language);await h.edit('Private draft');await h.enter();await h.node('swapBtn').click();await h.node('downloadPhrasebookTxt').click();
  assert.equal(h.requests.length,0);assert.equal(h.downloads[0],language.slug+'-translator-phrasebook.txt');assert.equal(h.node('translateBtn').disabled,true);
 });
 check('successful Unicode result becomes reverse input and only Translate sends it back',async()=>{
  const h=harness(language,{accepted:true});const input='Good morning. I would like to buy some rice.';
  await h.translate(input,language.sample);await h.node('swapBtn').click();assert.equal(h.node('translateInput').value,language.sample);assert.equal(h.requests.length,1);
  assert.equal(h.node('translateInputLabel').textContent,language.name+' text');assert.equal(h.node('translateInput').attrs.lang,language.code);assert.equal(h.node('translateOutput').attrs.lang,'en');
  const done=h.begin();assert.deepEqual(JSON.parse(h.requests[1].init.body),{text:language.sample,source:language.code,target:'en',allowFallback:false});assert.equal(h.requests[1].init.headers['X-AfroTools-External-Translation-Consent'],'accepted');assert.equal(h.requests[1].init.cache,'no-store');
  await h.reply(1,input);await done;assert.equal(h.node('translateOutput').textContent,input);
 });
 check('edited unsent draft survives Swap instead of being replaced by old output',async()=>{
  const h=harness(language,{accepted:true});await h.translate('Old',language.sample);await h.edit('My revised draft');await h.node('swapBtn').click();assert.equal(h.node('translateInput').value,'My revised draft');assert.equal(h.requests.length,1);assert.match(h.node('translateStatus').textContent,/text has been kept/);
 });
 for(const noAbort of [false,true])for(const action of ['swap','clear','edit','revoke'])check(`late JSON cannot restore output after ${action}; abort API ${!noAbort}`,async()=>{
  const h=harness(language,{accepted:true,noAbort});await h.edit('Old text');const done=h.begin(),json=deferred();h.requests[0].resolve({ok:true,json:()=>json.promise});await flush();
  if(action==='swap')await h.node('swapBtn').click();if(action==='clear')await h.node('clearTranslateBtn').click();if(action==='edit')await h.edit('New text');if(action==='revoke')await h.consent(false);
  const state=()=>[h.node('translateInput').value,h.node('translateOutput').textContent,h.node('translateStatus').textContent,h.node('translateBtn').disabled];const expected=state();json.resolve({translatedText:'OBSOLETE'});await done;assert.deepEqual(state(),expected);
 });
 check('old response and finally cannot unlock a newer pending request',async()=>{
  const h=harness(language,{accepted:true,noAbort:true});await h.edit('First');const first=h.begin();await h.edit('Second');const second=h.begin();await h.reply(0,'Old');await first;
  assert.equal(h.node('translateBtn').disabled,true);assert.equal(h.node('translateOutput').textContent,'Translating…');await h.reply(1,'New');await second;assert.equal(h.node('translateOutput').textContent,'New');assert.equal(h.node('translateBtn').disabled,false);
 });
 check('older rejection cannot overwrite a newer successful result',async()=>{
  const h=harness(language,{accepted:true,noAbort:true});await h.edit('First');const first=h.begin();await h.edit('Second');const second=h.begin();await h.reply(1,'New');await second;const status=h.node('translateStatus').textContent;
  h.requests[0].reject(new Error('Old failure'));await first;assert.equal(h.node('translateOutput').textContent,'New');assert.equal(h.node('translateStatus').textContent,status);
 });
 check('older delayed JSON cannot replace a newer successful result',async()=>{
  const h=harness(language,{accepted:true,noAbort:true});await h.edit('First');const first=h.begin(),json=deferred();h.requests[0].resolve({ok:true,json:()=>json.promise});await flush();await h.edit('Second');const second=h.begin();await h.reply(1,'Newest');await second;json.resolve({translatedText:'Older'});await first;assert.equal(h.node('translateOutput').textContent,'Newest');
 });
 check('revocation then reacceptance does not revive a revoked same-text request',async()=>{
  const h=harness(language,{accepted:true,noAbort:true});await h.edit('Same');const first=h.begin();await h.consent(false);await h.consent(true);await h.reply(0,'Revoked');await first;assert.notEqual(h.node('translateOutput').textContent,'Revoked');assert.equal(h.requests.length,1);
 });
 check('programmatic draft changes without an input event cannot claim an outdated response',async()=>{
  const h=harness(language,{accepted:true,noAbort:true});await h.edit('First');const first=h.begin();h.node('translateInput').value='Second';await h.reply(0,'Old');await first;assert.notEqual(h.node('translateOutput').textContent,'Old');assert.equal(h.node('translateInput').value,'Second');
 });
 check('provider failure leaves local phrasebook available and is never used as Swap input',async()=>{
  const h=harness(language,{accepted:true});await h.edit('Draft');const done=h.begin();h.requests[0].resolve({ok:false,json:()=>Promise.resolve({message:'Try later'})});await done;assert.match(h.node('translateOutput').textContent,/local phrasebook/);await h.node('swapBtn').click();assert.equal(h.node('translateInput').value,'Draft');
 });
}
test('Hausa phrase-search fill invalidates pending output and preserves chosen direction without sending',async()=>{
 const h=harness(LANGUAGES[0],{accepted:true,noAbort:true});await h.node('swapBtn').click();await h.edit('Old');const done=h.begin();h.node('search').value='Ƙofa';await h.node('usePhraseQuery').click();await h.reply(0,'Old result');await done;assert.equal(h.node('translateInput').value,'Ƙofa');assert.equal(h.node('translateInputLabel').textContent,'Hausa text');assert.equal(h.requests.length,1);assert.notEqual(h.node('translateOutput').textContent,'Old result');
});
test('Yoruba codepoint limit and428 consent reset remain effective',async()=>{
 const h=harness(LANGUAGES[2],{accepted:true});await h.edit('a'.repeat(2001));await h.enter();assert.equal(h.requests.length,0);assert.match(h.node('translateStatus').textContent,/2,000/);
 await h.edit('Test');const done=h.begin();h.requests[0].resolve({ok:false,status:428,json:()=>Promise.resolve({error:'Consent required'})});await done;assert.equal(h.resetCount,1);assert.equal(h.node('translateBtn').disabled,true);assert.match(h.node('translateStatus').textContent,/opt in again/);assert.equal(h.node('translateBtn').dataset.busy,'false');
});

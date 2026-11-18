'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../tools/igbo-translator/translator-vip.js'),'utf8');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
async function flush(){for(let n=0;n<6;n++)await Promise.resolve();}
function harness(options={}){
  const nodes=new Map(),requests=[],copied=[],downloads=[];let accepted=Boolean(options.accepted),focused=null,selected=null;
  class Element{
    constructor(id){this.id=id||'';this.value='';this.textContent='';this.disabled=false;this.listeners={};this.attrs={};if(id)nodes.set(id,this);}
    setAttribute(name,value){this.attrs[name]=String(value);}
    addEventListener(name,fn){(this.listeners[name]||=[]).push(fn);}
    fire(name,event={}){return Promise.all((this.listeners[name]||[]).map(fn=>fn(event)));}
    click(){if(this.download)downloads.push(this.download);return this.disabled?Promise.resolve():this.fire('click');}
    focus(){focused=this.id;}
    scrollIntoView(){}
    insertBefore(node){if(node.id)nodes.set(node.id,node);}
    querySelector(){return new Element();}
    set innerHTML(value){this._html=value;for(const match of value.matchAll(/<([a-z0-9]+)\b([^>]*\bid="([^"]+)"[^>]*)>([^<]*)/gi)){const node=new Element(match[3]);node.textContent=match[4];node.disabled=/\bdisabled\b/.test(match[2]);}}
    get innerHTML(){return this._html||'';}
  }
  for(const id of ['vipExportStatus','downloadPhrasebookTxt','printPhrasebookPdf','translateSearch','search','wotd'])new Element(id);
  const container=new Element('container');
  const consent={render(){},hasConsent:()=>accepted,requireConsent:()=>accepted,headers:()=>({'X-AfroTools-External-Translation-Consent':'accepted'})};
  const window={TRANSLATOR_VIP:{name:'Igbo',slug:'igbo-translator',checked:'2026-07-26'},TRANSLATOR_CONFIG:{toolId:'igbo-translator',source:'en',target:'ig'},AfroTools:{ExternalTranslationConsent:consent},print(){},getSelection:()=>({removeAllRanges(){selected=null;},addRange(range){selected=range.node.id;}})};
  const document={readyState:'complete',getElementById:id=>nodes.get(id)||null,querySelector:()=>container,querySelectorAll:()=>[],createElement:()=>new Element(),createRange:()=>({selectNodeContents(node){this.node=node;}})};
  const navigator=options.noClipboard?{}:{clipboard:{writeText:options.writeText||((text)=>{copied.push(text);return Promise.resolve();})}};
  const context={window,document,navigator,PHRASES:[{en:'Thank you',lang:'Daalụ',pron:'',cat:'greetings'}],Blob,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},AbortController:options.noAbort?undefined:AbortController,
    fetch:(url,init)=>{const job=deferred();requests.push({url,init,...job});return job.promise;},console:{log(){throw Error('Translator must not log text');}}};
  vm.runInNewContext(source,context,{filename:'translator-vip.js'});
  const node=id=>{assert(nodes.has(id),'Runtime created '+id);return nodes.get(id);};
  return {node,requests,copied,downloads,get focused(){return focused;},get selected(){return selected;},
    async consent(value){accepted=value;await node('liveTranslateCard').fire('afrotools:external-translation-consent-change',{detail:{accepted:value}});},
    async edit(text){node('translateInput').value=text;await node('translateInput').fire('input');},
    begin(){return node('translateBtn').click();},
    enter(){return node('translateInput').fire('keydown',{key:'Enter',shiftKey:false,preventDefault(){}});},
    async reply(index,text,extra={}){requests[index].resolve({ok:true,json:()=>Promise.resolve({translatedText:text,provider:'Synthetic fixture',...extra})});await flush();},
    async translate(text,result){await this.edit(text);const done=this.begin();await this.reply(requests.length-1,result);await done;}
  };
}
test('free phrasebook and draft actions send nothing without explicit consent',async()=>{
  const h=harness();await h.edit('Good morning');await h.enter();
  h.node('search').value='thank you';await h.node('translateSearch').click();await h.node('swapBtn').click();
  await h.node('downloadPhrasebookTxt').click();
  assert.equal(h.requests.length,0);assert.equal(h.downloads[0],'igbo-translator-phrasebook.txt');assert.equal(h.node('translateBtn').disabled,true);
});
test('successful Igbo output becomes reverse input; swap does not automatically send',async()=>{
  const h=harness({accepted:true});const original='Good morning. I would like to buy some rice.',igbo='Ụtụtụ ọma. Ọ ga-amasị m ịzụta osikapa.';
  await h.translate(original,igbo);assert.equal(h.node('translateOutput').textContent,igbo);
  await h.node('swapBtn').click();assert.equal(h.node('translateInput').value,igbo);assert.equal(h.node('translateInputLabel').textContent,'Igbo text');assert.equal(h.requests.length,1);
  const done=h.begin();const body=JSON.parse(h.requests[1].init.body);assert.deepEqual(body,{text:igbo,source:'ig',target:'en',allowFallback:false});
  assert.equal(h.requests[1].init.headers['X-AfroTools-External-Translation-Consent'],'accepted');assert.equal(h.requests[1].init.cache,'no-store');
  await h.reply(1,original);await done;assert.equal(h.node('translateOutput').textContent,original);
});
test('edited unsent draft is preserved on swap and stale translation is not copyable',async()=>{
  const h=harness({accepted:true});await h.translate('Thank you','Daalụ');await h.edit('My changed draft');
  assert.equal(h.node('copyTranslateBtn').disabled,true);await h.node('swapBtn').click();assert.equal(h.node('translateInput').value,'My changed draft');assert.equal(h.requests.length,1);assert.match(h.node('translateStatus').textContent,/text has been kept/);
});
for(const noAbort of [false,true])for(const action of ['swap','clear','edit','revoke','search']){
  test(`late JSON cannot restore a result after ${action}; AbortController ${!noAbort}`,async()=>{
    const h=harness({accepted:true,noAbort});await h.edit('Old sentence');const done=h.begin();const json=deferred();h.requests[0].resolve({ok:true,json:()=>json.promise});await flush();
    if(action==='swap')await h.node('swapBtn').click();
    if(action==='clear')await h.node('clearTranslateBtn').click();
    if(action==='edit')await h.edit('New draft');
    if(action==='revoke')await h.consent(false);
    if(action==='search'){h.node('search').value='thank you';await h.node('translateSearch').click();}
    const state={input:h.node('translateInput').value,output:h.node('translateOutput').textContent,status:h.node('translateStatus').textContent,disabled:h.node('translateBtn').disabled};
    json.resolve({translatedText:'OBSOLETE RESULT'});await done;
    assert.deepEqual({input:h.node('translateInput').value,output:h.node('translateOutput').textContent,status:h.node('translateStatus').textContent,disabled:h.node('translateBtn').disabled},state);assert.equal(h.node('copyTranslateBtn').disabled,true);
  });
}
test('older response and finally cannot replace or unlock a newer pending request without abort support',async()=>{
  const h=harness({accepted:true,noAbort:true});await h.edit('First');const first=h.begin();await h.edit('Second');const second=h.begin();
  await h.reply(0,'Old');await first;assert.equal(h.node('translateBtn').disabled,true);assert.equal(h.node('translateOutput').textContent,'Translating…');
  await h.reply(1,'New');await second;assert.equal(h.node('translateOutput').textContent,'New');assert.equal(h.node('translateBtn').disabled,false);
});
test('late network rejection does not overwrite a newer successful translation',async()=>{
  const h=harness({accepted:true,noAbort:true});await h.edit('First');const first=h.begin();await h.edit('Second');const second=h.begin();await h.reply(1,'New');await second;
  const status=h.node('translateStatus').textContent;h.requests[0].reject(new Error('Old failure'));await first;assert.equal(h.node('translateOutput').textContent,'New');assert.equal(h.node('translateStatus').textContent,status);
});
test('an older delayed JSON body cannot replace the newer successful result',async()=>{
  const h=harness({accepted:true,noAbort:true});await h.edit('First');const first=h.begin(),json=deferred();h.requests[0].resolve({ok:true,json:()=>json.promise});await flush();
  await h.edit('Second');const second=h.begin();await h.reply(1,'Newest result');await second;json.resolve({translatedText:'Older result'});await first;
  assert.equal(h.node('translateOutput').textContent,'Newest result');await h.node('copyTranslateBtn').click();assert.deepEqual(h.copied,['Newest result']);
});
test('revoking then accepting again never revives an earlier request for the same text',async()=>{
  const h=harness({accepted:true,noAbort:true});await h.edit('Same text');const first=h.begin(),json=deferred();h.requests[0].resolve({ok:true,json:()=>json.promise});await flush();
  await h.consent(false);await h.consent(true);json.resolve({translatedText:'Revoked request'});await first;
  assert.notEqual(h.node('translateOutput').textContent,'Revoked request');assert.equal(h.requests.length,1);assert.equal(h.node('copyTranslateBtn').disabled,true);
});
test('copy writes the exact successful Unicode result only after clicking Copy translation',async()=>{
  const h=harness({accepted:true});await h.translate('Thank you','Daalụ');assert.deepEqual(h.copied,[]);await h.node('copyTranslateBtn').click();assert.deepEqual(h.copied,['Daalụ']);assert.equal(h.node('translateStatus').textContent,'Translation copied.');assert.equal(h.requests.length,1);
});
for(const noClipboard of [false,true])test(`clipboard failure gives honest manual-copy recovery; missing API ${noClipboard}`,async()=>{
  const h=harness({accepted:true,noClipboard,writeText:()=>Promise.reject(new Error('Denied'))});await h.translate('Thank you','Daalụ');await h.node('copyTranslateBtn').click();
  assert.match(h.node('translateStatus').textContent,/Automatic copy failed/);assert.equal(h.selected,'translateOutput');assert.equal(h.focused,'translateOutput');assert.equal(h.node('translateOutput').textContent,'Daalụ');assert.equal(h.node('copyTranslateBtn').disabled,false);
});
test('late copy completion cannot overwrite clear feedback or enable stale copying',async()=>{
  const clipboard=deferred(),h=harness({accepted:true,writeText:()=>clipboard.promise});await h.translate('Thank you','Daalụ');const copy=h.node('copyTranslateBtn').click();await h.node('clearTranslateBtn').click();const status=h.node('translateStatus').textContent;clipboard.resolve();await copy;assert.equal(h.node('translateStatus').textContent,status);assert.equal(h.node('copyTranslateBtn').disabled,true);
});
test('provider failure retains useful phrasebook recovery and cannot be copied as a translation',async()=>{
  const h=harness({accepted:true});await h.edit('Test');const done=h.begin();h.requests[0].resolve({ok:false,json:()=>Promise.resolve({message:'Try again later'})});await done;assert.match(h.node('translateOutput').textContent,/local phrasebook still works/);assert.equal(h.node('copyTranslateBtn').disabled,true);assert.equal(h.node('translateBtn').disabled,false);
});

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
const html=fs.readFileSync(process.env.PIDGIN_HTML||path.join(__dirname,'../tools/pidgin-translator/index.html'),'utf8');
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('var PHRASES='));
const ast=acorn.parse(script,{ecmaVersion:'latest'});
const names=new Set(['translationConsent','setTranslationBusy','clearTranslationOwnership','invalidateTranslation','updateTranslationLabels','swapLangs','doTranslate','clearCloudTranslation','initExternalTranslationConsent']);
const variables=new Set(['swapped','translationSequence','translationController','translationResult','translationBusy','translationInitialized']);
const selected=ast.body.filter(n=>n.type==='FunctionDeclaration'&&names.has(n.id.name)||n.type==='VariableDeclaration'&&n.declarations.some(d=>variables.has(d.id.name))||n.type==='ExpressionStatement'&&script.slice(n.start,n.end).startsWith("window.addEventListener('pagehide'"));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
function harness(abort=true){
 const elements={},events={},requests=[],headers=[];let accepted=false,resets=0;
 for(const id of ['srcText','tgtOutput','srcLabel','tgtLabel','translateBtn','translateStatus','pidginTranslationConsent'])elements[id]={id,value:'',textContent:'',disabled:true,attrs:{},events:{},focus(){},setAttribute(k,v){this.attrs[k]=String(v);},removeAttribute(k){delete this.attrs[k];},getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;},addEventListener(k,v){this.events[k]=v;}};
 const consent={render(){},hasConsent(){return accepted;},requireConsent(){return accepted;},headers(){assert(accepted);headers.push(true);return {'X-AfroTools-External-Translation-Consent':'accepted'};},reset(){accepted=false;resets++;elements.pidginTranslationConsent.events['afrotools:external-translation-consent-change']();}};
 const ctx=vm.createContext({document:{getElementById(id){assert(elements[id],id);return elements[id];}},window:{AfroTools:{ExternalTranslationConsent:consent},addEventListener(type,fn){events[type]=fn;}},fetch(url,options){const pending=deferred();requests.push({url,options,pending});return pending.promise;},AbortController:abort?AbortController:undefined,Promise,JSON,console});
 vm.runInContext(selected.map(n=>script.slice(n.start,n.end)).join('\n'),ctx);ctx.initExternalTranslationConsent();
 return {ctx,elements,requests,headers,get resets(){return resets;},consent(on){accepted=on;elements.pidginTranslationConsent.events['afrotools:external-translation-consent-change']();},edit(text){elements.srcText.value=text;elements.srcText.events.input();},start(text){if(text!==undefined)elements.srcText.value=text;return ctx.doTranslate();},reply(index,data={translatedText:'I dey thank you.'},status=200,jsonPromise){requests[index].pending.resolve({ok:status<400,status,json:()=>jsonPromise||Promise.resolve(data)});},leave(){events.pagehide();},ready(){return elements.tgtOutput.getAttribute('data-translation-state')==='ready';}};
}
test('explicit consent is required and shared brief generation cannot implicitly start translation',async()=>{
 const h=harness();await h.start('Thank you');assert.equal(h.requests.length,0);assert.equal(h.headers.length,0);assert.equal(h.elements.translateBtn.disabled,true);assert(!h.ready());
});
test('successful current Unicode result owns input/output/direction, swaps back without automatic send',async()=>{
 const h=harness();h.consent(true);const first=h.start(' Thank you ');h.reply(0,{translatedText:'I dey thank you — well well.',provider:'Synthetic fixture'});await first;
 const out=h.elements.tgtOutput;assert(h.ready());assert.equal(out.getAttribute('data-translation-input'),' Thank you ');assert.equal(out.getAttribute('data-translation-output'),out.textContent);assert.equal(out.getAttribute('data-translation-target-label'),'Nigerian Pidgin result');
 assert.deepEqual(JSON.parse(h.requests[0].options.body),{text:'Thank you',source:'en',target:'pcm',allowFallback:false});assert.equal(h.requests[0].options.cache,'no-store');
 h.ctx.swapLangs();assert.equal(h.elements.srcText.value,'I dey thank you — well well.');assert.equal(h.elements.srcText.getAttribute('lang'),'pcm');assert.equal(h.requests.length,1);assert(!h.ready());
 const back=h.start();h.reply(1,{translatedText:'Thank you'});await back;assert.equal(h.elements.tgtOutput.textContent,'Thank you');assert.equal(JSON.parse(h.requests[1].options.body).target,'en');assert(h.ready());
});
test('edited and unsent draft survives Swap without carrying an earlier result',async()=>{
 const h=harness();h.consent(true);const run=h.start('Old source');h.reply(0,{translatedText:'Old result'});await run;h.edit('My edited Unicode draft — Ọ');h.ctx.swapLangs();assert.equal(h.elements.srcText.value,'My edited Unicode draft — Ọ');assert(!h.ready());assert.equal(h.requests.length,1);
});
for(const abort of [true,false])for(const action of ['edit','clear','swap','revoke','leave'])test('late fetch ignored after '+action+' with AbortController '+abort,async()=>{
 const h=harness(abort);h.consent(true);const run=h.start('Old source');
 if(action==='edit')h.edit('New draft');if(action==='clear')h.ctx.clearCloudTranslation();if(action==='swap')h.ctx.swapLangs();if(action==='revoke')h.consent(false);if(action==='leave')h.leave();
 const text=h.elements.tgtOutput.textContent,status=h.elements.translateStatus.textContent;h.reply(0,{translatedText:'Unrelated late output'});await run;assert.equal(h.elements.tgtOutput.textContent,text);assert.equal(h.elements.translateStatus.textContent,status);assert(!h.ready());
 if(action==='clear'||action==='leave')assert.equal(h.elements.srcText.value,'');if(action==='edit')assert.equal(h.elements.srcText.value,'New draft');
});
test('response JSON arriving after edit cannot certify a stale translation',async()=>{
 const h=harness();h.consent(true);const json=deferred(),run=h.start('Old source');h.reply(0,{},200,json.promise);await tick();h.edit('New draft');json.resolve({translatedText:'Old response JSON'});await run;assert(!h.ready());assert(!h.elements.tgtOutput.textContent.includes('Old response JSON'));
});
for(const failure of [false,true])test('older '+(failure?'error':'success')+' and finally cannot overwrite or unlock a newer request',async()=>{
 const h=harness(false);h.consent(true);const first=h.start('First');h.edit('Second');const second=h.start();
 if(failure)h.requests[0].pending.reject(Error('Old network error'));else h.reply(0,{translatedText:'First output'});await first;
 assert.equal(h.elements.translateBtn.disabled,true);assert.equal(h.elements.translateBtn.textContent,'Translating...');assert(!h.ready());assert(!h.elements.tgtOutput.textContent.includes('First output'));
 h.reply(1,{translatedText:'Second output'});await second;assert(h.ready());assert.equal(h.elements.tgtOutput.getAttribute('data-translation-input'),'Second');assert.equal(h.elements.translateBtn.disabled,false);
});
test('revoke then reaccept does not revive an old response or grant implicit consent',async()=>{
 const h=harness(false);h.consent(true);const first=h.start('Old');h.consent(false);h.consent(true);h.reply(0,{translatedText:'Old result'});await first;assert(!h.ready());assert.equal(h.requests.length,1);const fresh=h.start('Fresh');h.reply(1,{translatedText:'Fresh result'});await fresh;assert(h.ready());
});
test('empty, HTTP failure, invalid success body and network error never retain a ready marker',async()=>{
 for(const kind of ['empty','http','invalid','network','consent428']){
  const h=harness();h.consent(true);const prior=h.start('Prior');h.reply(0,{translatedText:'Prior output'});await prior;assert(h.ready());
  const run=h.start(kind==='empty'?'':'New');
  if(kind==='http')h.reply(1,{error:'Synthetic failure'},503);if(kind==='invalid')h.reply(1,{translatedText:[]});if(kind==='network')h.requests[1].pending.reject(Error('Synthetic network failure'));if(kind==='consent428')h.reply(1,{},428);await run;
  assert(!h.ready());assert.equal(h.elements.tgtOutput.getAttribute('data-translation-input'),null);assert(!h.elements.tgtOutput.textContent.includes('Prior output'));if(kind==='consent428'){assert.equal(h.resets,1);assert.equal(h.elements.translateBtn.disabled,true);}
 }
});
test('duplicate consent initialization does not register another controller or unlock a pending request',async()=>{
 const h=harness();h.ctx.initExternalTranslationConsent();h.consent(true);const run=h.start('Pending');h.consent(true);assert.equal(h.elements.translateBtn.disabled,true);h.reply(0);await run;assert(h.ready());assert.equal(h.requests.length,1);
});

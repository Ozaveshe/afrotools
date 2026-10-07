'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('contact/index.html','utf8');
const script = html.match(/<script>\s*(document\.getElementById\('contactForm'\)[\s\S]*?)<\/script>/)[1];
async function run(fetchResult, expire = false) {
 let handler, resets=0, calls=0;
 const timers=new Map();
 const button={disabled:false,style:{}};
 const status={textContent:''}, success={style:{display:'none'}};
 const fields=[{style:{}},{style:{}}], sub={style:{}};
 const form={addEventListener:(_,fn)=>handler=fn,querySelector:()=>button,querySelectorAll:()=>fields,reset:()=>resets++,closest:()=>({querySelector:()=>sub})};
 const context={document:{getElementById:id=>({contactForm:form,contactStatus:status,successMsg:success})[id]}, URLSearchParams, AbortController,
  setTimeout:(callback,delay)=>{assert.equal(delay,30000);timers.set(callback,callback);return callback;},
  clearTimeout:id=>timers.delete(id),
 FormData:class {constructor(){return [['form-name','contact'],['message','Synthetic QA message']];}},
 fetch:async(url,options)=>{calls++;assert.equal(url,'/');assert.equal(options.method,'POST');assert.match(options.body,/form-name=contact/);return fetchResult(options.signal);}};
 vm.runInNewContext(script,context);
 let prevented=false;
 const submission=handler.call(form,{preventDefault:()=>prevented=true});
 if (expire) {
  assert.equal(button.disabled,true);assert.equal(status.textContent,'Sending your message…');
  assert.equal(timers.size,1);timers.values().next().value();
 }
 await submission;assert.equal(timers.size,0);
 assert.equal(prevented,true);assert.equal(calls,1);assert.equal(button.disabled,false);
 return {resets,status,success,fields,button};
}
(async()=>{
 for(const outcome of [()=>({ok:false}),()=>{throw Error('offline');}]) {
  const r=await run(outcome);assert.equal(r.resets,0);assert.equal(r.success.style.display,'none');assert.match(r.status.textContent,/could not be sent/);assert.equal(r.fields[0].style.display,undefined);
 }
 const r=await run(()=>({ok:true}));assert.equal(r.resets,1);assert.equal(r.success.style.display,'block');assert.equal(r.button.style.display,'none');
 const stalled=await run(signal=>new Promise((resolve,reject)=>{if(signal)signal.addEventListener('abort',()=>reject(new Error('Synthetic timeout')),{once:true});}),true);
 assert.equal(stalled.resets,0);assert.equal(stalled.success.style.display,'none');assert.match(stalled.status.textContent,/could not confirm/);assert.equal(stalled.fields[0].style.display,undefined);
 console.log('Contact form success, server rejection, offline and stalled-request checks passed; no network used');
})().catch(e=>{console.error(e);process.exitCode=1;});

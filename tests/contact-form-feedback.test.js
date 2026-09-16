'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('contact/index.html','utf8');
const script = html.match(/<script>\s*(document\.getElementById\('contactForm'\)[\s\S]*?)<\/script>/)[1];
async function run(fetchResult) {
 let handler, resets=0, calls=0;
 const button={disabled:false,style:{}};
 const status={textContent:''}, success={style:{display:'none'}};
 const fields=[{style:{}},{style:{}}], sub={style:{}};
 const form={addEventListener:(_,fn)=>handler=fn,querySelector:()=>button,querySelectorAll:()=>fields,reset:()=>resets++,closest:()=>({querySelector:()=>sub})};
 const context={document:{getElementById:id=>({contactForm:form,contactStatus:status,successMsg:success})[id]}, URLSearchParams,
 FormData:class {constructor(){return [['form-name','contact'],['message','Synthetic QA message']];}},
 fetch:async(url,options)=>{calls++;assert.equal(url,'/');assert.equal(options.method,'POST');assert.match(options.body,/form-name=contact/);return fetchResult();}};
 vm.runInNewContext(script,context);
 let prevented=false;
 await handler.call(form,{preventDefault:()=>prevented=true});
 assert.equal(prevented,true);assert.equal(calls,1);assert.equal(button.disabled,false);
 return {resets,status,success,fields,button};
}
(async()=>{
 for(const outcome of [()=>({ok:false}),()=>{throw Error('offline');}]) {
  const r=await run(outcome);assert.equal(r.resets,0);assert.equal(r.success.style.display,'none');assert.match(r.status.textContent,/could not be sent/);assert.equal(r.fields[0].style.display,undefined);
 }
 const r=await run(()=>({ok:true}));assert.equal(r.resets,1);assert.equal(r.success.style.display,'block');assert.equal(r.button.style.display,'none');
 console.log('Contact form success, server rejection and offline checks passed; no network used');
})().catch(e=>{console.error(e);process.exitCode=1;});

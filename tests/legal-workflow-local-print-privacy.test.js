const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/src/legal-workflow-copilot.js'),'utf8');
const marker='    e = function() {';assert(source.includes(marker));
function fixture(options={}) {
  const requests=[],status={textContent:'',style:{}},button={disabled:false,textContent:'',events:{},addEventListener(k,f){this.events[k]=f;}},print={events:{},addEventListener(k,f){this.events[k]=f;}},field={value:options.email===undefined?'synthetic@example.invalid':options.email,focus(){}},optin={checked:options.consent===undefined?true:options.consent,removeAttribute(){}};
  const nodes={'[data-workflow-email]':field,'[data-workflow-optin]':optin,'[data-workflow-gate-status]':status,'[data-workflow-pdf-gate]':button,'[data-workflow-print]':print};
  const root={querySelector:s=>nodes[s]||null,querySelectorAll:()=>[]};let writes=0,prints=0;
  const window={print(){prints++;},location:{search:'',pathname:'/tools/minimum-wage/'},AfroWorkspace:{upsert(){throw Error('Unexpected workspace send');}}};
  const context={window,document:{readyState:'loading',addEventListener(){}},localStorage:{getItem(){return null;},setItem(){writes++;}},fetch(url,request){requests.push({url,body:JSON.parse(request.body)});if(options.networkFailure)return Promise.reject(Error('synthetic failure'));if(options.pending)return options.pending;return Promise.resolve({ok:options.httpOk!==false,json:async()=>options.response||{ok:true,stored:true}});},Promise,Date,URLSearchParams,console};
  vm.runInNewContext(source.replace(marker,'    window.__test={subscribe:E,initialize:T};\n'+marker),context);
  return {api:window.__test,root,button,optin,status,requests,print,get writes(){return writes;},get prints(){return prints;}};
}
(async()=>{
  for(const options of [{consent:false},{email:'invalid'}]){const f=fixture(options);assert.strictEqual(await f.api.subscribe(f.root,{slug:'synthetic-tool'},f.button),false);assert.strictEqual(f.requests.length,0);}
  for(const options of [{httpOk:false},{response:{ok:true,stored:false}},{response:{ok:false,stored:true}},{networkFailure:true}]){const f=fixture(options);assert.strictEqual(await f.api.subscribe(f.root,{slug:'synthetic-tool'},f.button),false);assert(f.status.textContent.includes('could not be confirmed'));assert.strictEqual(f.button.disabled,false);assert.strictEqual(f.writes,0);}
  {const f=fixture();assert.strictEqual(await f.api.subscribe(f.root,{slug:'synthetic-tool'},f.button),true);assert.deepStrictEqual(Object.keys(f.requests[0].body).sort(),['email','optInDigest','source','toolSlug']);assert.strictEqual(f.requests[0].body.optInDigest,true);assert.strictEqual(f.writes,0);}
  {let resolve;const pending=new Promise(r=>resolve=r);const f=fixture({pending});const first=f.api.subscribe(f.root,{slug:'synthetic-tool'},f.button);assert.strictEqual(await f.api.subscribe(f.root,{slug:'synthetic-tool'},f.button),false);resolve({ok:true,json:async()=>({ok:true,stored:true})});assert.strictEqual(await first,true);assert.strictEqual(f.requests.length,1);}
  {const f=fixture({email:''});f.api.initialize(f.root);assert.strictEqual(f.optin.checked,false);f.print.events.click();assert.strictEqual(f.prints,1);assert.strictEqual(f.requests.length,0);assert.strictEqual(f.writes,0);}
  console.log('PASS: 9 legal workflow local-print and subscription privacy scenarios');
})().catch(error=>{console.error(error);process.exitCode=1;});

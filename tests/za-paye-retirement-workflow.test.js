'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../south-africa/za-paye.html'),'utf8');
const scripts=Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g),m=>m[1]);
const owner=scripts.find(s=>s.includes('const SARS_BANDS ='));
const adapter=scripts.find(s=>s.includes('window.PAYE_CALC_SYNC_ADAPTER='));
const clone=x=>JSON.parse(JSON.stringify(x));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function node(id=''){
  const item={id,value:'',textContent:'',innerHTML:'',disabled:false,checked:false,style:{},dataset:{},listeners:{},attrs:{},className:'',addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},focus(){this.focused=true;},scrollIntoView(){},click(){this.clicked=true;},getContext(){return{};}};
  const classes=new Set();item.classList={add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,force){const on=force===undefined?!classes.has(c):force;if(on)classes.add(c);else classes.delete(c);return on;}};return item;
}
function fixture(){
  const nodes=new Map(Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>[m[1],node(m[1])])),timers=new Map(),effects={fetch:[],clipboard:[],print:0,downloads:[],chart:[],opened:[]};let timer=0;
  const toggles=['uif','medical'].map(name=>{const n=node(name);n.dataset.tog=name;if(name==='uif')n.classList.add('on');return n;});
  const periods=[node(),node()],modes=[nodes.get('modeGross'),nodes.get('modeNet')],actions=[node(),node()];
  nodes.get('ageGroup').value='under65';nodes.get('medMembers').value='1';nodes.get('salarySlider').min='10000';nodes.get('salarySlider').max='5000000';nodes.get('salarySlider').value='300000';
  const document={body:node('body'),getElementById:id=>nodes.get(id)||null,addEventListener(){},createElement:()=>{const n=node();n.click=()=>effects.downloads.push(n);return n;},head:{appendChild(){}},querySelector(selector){const m=selector.match(/data-tog="([^"]+)"/);return m?toggles.find(n=>n.dataset.tog===m[1]):null;},querySelectorAll(selector){if(selector==='.tog')return toggles;if(selector==='.per-btn')return periods;if(selector==='.mode-btn')return modes;if(selector.includes('[data-current-result]'))return [...actions,nodes.get('aiBtn'),nodes.get('calcSaveBtn')].filter(Boolean);return[];}};
  const sandbox={document,Math,Number,Intl,Date,Infinity,isFinite,console,URL,Blob,AbortController,location:{origin:'https://example.test',pathname:'/south-africa/za-paye/'},
    setTimeout(fn){const id=++timer;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),addEventListener(){},print:()=>effects.print++,open:(...args)=>effects.opened.push(args),
    navigator:{clipboard:{writeText:async text=>{effects.clipboard.push(text);}}},fetch:async(url,options)=>{effects.fetch.push({url,options});return{ok:true,json:async()=>({text:'Synthetic analysis'})};},
    AfroTools:{pdf:{generate:async()=>({})}},AfroChartColors:{doughnut:['a','b','c','d']},Chart:function(canvas,config){effects.chart.push(config);this.destroy=()=>{};},
  };sandbox.window=sandbox;
  const context=vm.createContext(sandbox);vm.runInContext(owner+'\n'+adapter,context,{timeout:1000});
  return{context,nodes,effects,timers,run:code=>vm.runInContext(code,context,{timeout:1000}),input(gross=600000,raw=100000,funding='employee_cash'){nodes.get('salaryInput').value=String(gross);nodes.get('retirementAmt').value=String(raw);nodes.get('retirementFunding').value=funding;},toggle(name,on){toggles.find(n=>n.dataset.tog===name).classList.toggle('on',on);}};
}
test('actual inline requires explicit funding and rejects malformed, negative and impossible cash without stale exports',()=>{
  const f=fixture();f.input();assert.ok(f.run('calculate()'));f.nodes.get('retirementFunding').value='';assert.equal(f.run('calculate()'),null);assert.equal(f.context.RESULT,null);assert.match(f.nodes.get('calculationStatus').textContent,/funded/);assert.equal(f.nodes.get('retirementFunding').focused,true);
  for(const value of ['-1','NaN','Infinity','12oops','12.345']){f.input();f.nodes.get('retirementAmt').value=value;assert.equal(f.run('calculate()'),null);assert.equal(f.context.RESULT,null);}
  f.input(100000,200000);assert.equal(f.run('calculate()'),null);assert.match(f.nodes.get('calculationStatus').textContent,/negative cash/);
});
test('full cash bridge, annual/monthly view and chart partitions use raw above-cap contribution exactly once',async()=>{
  const f=fixture();f.input(2000000,500000);const r=f.run('calculate()');await Promise.resolve();
  assert.equal(r.retirementTaxDeductionAnnual,430000);assert.equal(r.retirementUndeductedAnnual,70000);assert.ok(Math.abs(r.cashRemainingAnnual-975881.56)<.01);
  const split=f.run('chartParts(RESULT)');assert.equal(split.values.reduce((a,b)=>a+b,0),2000000);assert.equal(split.values.at(-1),500000);
  f.run("setPeriod('annual')");assert.match(f.nodes.get('resAmount').textContent,/975/);assert.match(f.nodes.get('resContent').innerHTML,/Full retirement contribution entered/);
  f.input(600000,100000,'tax_effect_only');f.run('calculate()');const tax=f.run('chartParts(RESULT)');assert.equal(tax.values.length,3);assert.equal(tax.values.reduce((a,b)=>a+b,0),600000);assert.match(f.nodes.get('resLabel').textContent,/before retirement payments/);
  f.input(600000,100000);f.run("PERIOD='monthly';calculate()");assert.match(f.nodes.get('resAmount').textContent,/33[\s,\u00a0]288[.,]13/);
  f.nodes.get('salaryInput').value='399457.56';f.nodes.get('salaryInput').listeners.blur.call(f.nodes.get('salaryInput'));assert.match(f.nodes.get('salaryInput').value,/[.,]56$/);assert.equal(f.run("strictMoney(salaryInput.value,'Salary')"),399457.56);
  f.nodes.get('salaryInput').value='600000oops';f.nodes.get('salaryInput').listeners.focus.call(f.nodes.get('salaryInput'));f.nodes.get('salaryInput').listeners.blur.call(f.nodes.get('salaryInput'));assert.equal(f.nodes.get('salaryInput').value,'600000oops');assert.equal(f.run('calculate()'),null);
});
test('actual selected-balance inverse keeps original target and finds cash gross while legacy target remains before-payment',()=>{
  const f=fixture();f.input(399457.56,100000);f.run("MODE='net';calculate()");assert.ok(Math.abs(f.context.RESULT.gross-600000)<.02);assert.equal(f.nodes.get('salaryInput').value,'399457.56');
  f.input(499457.56,100000,'tax_effect_only');f.run("MODE='net';calculate()");assert.ok(Math.abs(f.context.RESULT.netAnnual-499457.56)<1);
});
test('edit invalidation is synchronous; late chart and PDF cannot use a changed scenario',async()=>{
  const f=fixture();f.input();f.run('calculate()');const pdf=deferred();let guard;
  f.context.AfroTools.pdf.generate=async(config,runtime)=>{guard=runtime.isCurrent;return pdf.promise;};
  const pending=f.run('downloadPdf()');assert.equal(guard(),true);f.run('scheduleCalc()');assert.equal(f.context.RESULT,null);assert.equal(guard(),false);pdf.reject(Error('old job'));await pending;assert.equal(f.effects.print,0);assert.doesNotMatch(f.nodes.get('calculationStatus').textContent,/PDF downloaded/);
});
test('sharing is route-only; stale clipboard rejection has no late fallback or stale status',async()=>{
  const f=fixture();f.input();f.run('calculate()');await f.run('shareResult()');assert.deepEqual(f.effects.clipboard,['https://example.test/south-africa/za-paye/']);f.run('whatsappShare()');assert.doesNotMatch(f.effects.opened[0][0],/600000|100000|salary|retirement/);
  const wait=deferred();f.context.navigator.clipboard.writeText=()=>wait.promise;const pending=f.run('shareResult()');f.run('scheduleCalc()');wait.reject(Error('denied'));await pending;assert.match(f.nodes.get('calculationStatus').textContent,/Inputs changed/);assert.equal(f.effects.downloads.length,0);
});
test('local v2 backup retains raw input, target and explicit funding; legacy records restore as unknown drafts without rewriting',async()=>{
  const f=fixture();f.input(399457.56,100000);f.run("MODE='net';calculate()");const backup=clone(f.context.PAYE_CALC_SYNC_ADAPTER.buildPayload());assert.equal(backup.version,2);assert.equal(backup.inputs.salaryValue,399457.56);assert.equal(backup.inputs.retirementAmount,100000);assert.equal(backup.retirementContract.funding,'employee_cash');assert.equal(f.context.PAYE_CALC_SYNC_ADAPTER.restorePayload(backup,''),true);assert.ok(f.context.RESULT);
  const legacy=clone(backup);delete legacy.retirementContract;const bytes=JSON.stringify(legacy);assert.equal(f.context.PAYE_CALC_SYNC_ADAPTER.restorePayload(legacy,''),true);assert.equal(f.context.RESULT,null);assert.equal(f.nodes.get('retirementFunding').value,'');assert.equal(JSON.stringify(legacy),bytes);
  assert.equal(f.context.PAYE_CALC_SYNC_ADAPTER.restorePayload({version:1,fields:{salaryInput:'600000',retirementAmt:'100000'}},''),true);assert.equal(f.context.RESULT,null);
  const shared=fs.readFileSync(path.join(__dirname,'../assets/js/lib/paye-calculation-sync.js'),'utf8');
  const call=shared.match(/\.restorePayload\((1===([\w$]+)\.version\?\2\.fields:\2),([\w$]+)\)/);
  assert.ok(call,'actual immutable served shared-sync legacy unwrap owner');
  const actualCaller=vm.runInNewContext('(function('+call[2]+','+call[3]+',adapter){return adapter.restorePayload('+call[1]+','+call[3]+');})');
  const record={version:1,fields:{salaryInput:'399,457.56',retirementAmt:'100,000',_mode:'net'}};
  assert.equal(actualCaller(record,'Legacy cash target',f.context.PAYE_CALC_SYNC_ADAPTER),true);assert.equal(f.context.RESULT,null);assert.equal(f.run('MODE'),'net');assert.equal(f.nodes.get('salaryInput').value,'399457.56');assert.equal(f.nodes.get('retirementFunding').value,'');
  const inconsistent=clone(backup);inconsistent.inputs.toggles.medical=true;inconsistent.inputs.medMembers=0;
  assert.equal(f.context.PAYE_CALC_SYNC_ADAPTER.restorePayload(inconsistent,''),false);assert.equal(f.nodes.get('salaryInput').value,'399457.56');
  const old=f.nodes.get('salaryInput').value;backup.retirementContract.funding='employer';assert.equal(f.context.PAYE_CALC_SYNC_ADAPTER.restorePayload(backup,''),false);assert.equal(f.nodes.get('salaryInput').value,old);
  backup.retirementContract.funding='employee_cash';const newer=clone(backup);newer.inputs.mode='gross';newer.inputs.salaryValue=700000;
  const first=deferred(),second=deferred();
  const oldRead=f.context.restoreScenarioFile({size:100,text:()=>first.promise});
  const newRead=f.context.restoreScenarioFile({size:100,text:()=>second.promise});
  first.resolve(JSON.stringify(backup));await oldRead;assert.equal(f.context.RESULT,null,'old read must not claim a result while a newer file is pending');
  second.resolve(JSON.stringify(newer));await newRead;assert.equal(f.context.RESULT.gross,700000);assert.equal(f.nodes.get('salaryInput').value,'700000');
});
test('AI requires explicit current-snapshot consent and ignores late body completion after edits',async()=>{
  const f=fixture();f.input();f.run('calculate()');await f.run('getAI()');assert.equal(f.effects.fetch.length,0);
  f.nodes.get('aiConsent').checked=true;const body=deferred();f.context.fetch=async(url,options)=>{f.effects.fetch.push({url,options});return{ok:true,json:()=>body.promise};};const pending=f.run('getAI()');await Promise.resolve();const sent=JSON.parse(f.effects.fetch[0].options.body);assert.match(sent.messages[0].content,/100,000|100\s000/);assert.match(sent.messages[0].content,/employee_cash/);f.run('scheduleCalc()');body.resolve({text:'OLD ANALYSIS'});await pending;assert.doesNotMatch(f.nodes.get('aiResp').textContent,/OLD ANALYSIS/);assert.equal(f.nodes.get('aiConsent').checked,false);
});
test('early legacy query capture strips financial fields before analytics and leaves an uncertain local draft',()=>{
  const first=scripts.find(s=>s.includes('__ZA_LEGACY_INPUT'));const url=new URL('https://example.test/south-africa/za-paye/?g=600000&r=100000&mode=net&campaign=ok');let replaced='';const win={};vm.runInNewContext(first,{window:win,location:url,URL,history:{state:null,replaceState:(s,t,u)=>{replaced=u;}}});assert.equal(replaced,'/south-africa/za-paye/?campaign=ok');assert.equal(win.__ZA_LEGACY_INPUT.r,'100000');
  const f=fixture();f.context.__ZA_LEGACY_INPUT=win.__ZA_LEGACY_INPUT;f.run('restoreFromURL()');assert.equal(f.context.RESULT,null);assert.equal(f.run('MODE'),'gross');assert.equal(f.nodes.get('retirementFunding').value,'');assert.match(f.nodes.get('calculationStatus').textContent,/original desired-net target is unknown/);
});
test('actual tax endpoint GET/POST/reverse preserves legacy net numerics and passes explicit basis metadata',async()=>{
  const engine=require('../netlify/functions/_engines/za-paye');
  const salary=require('../netlify/functions/_shared/tax-request');
  const exports={};const source=fs.readFileSync(path.join(__dirname,'../netlify/functions/api-tax.js'),'utf8');
  const dependencies={
    './_engines/index':{get:country=>country==='ZA'?engine:null,listCountries:()=>[{code:'ZA',name:'South Africa'}]},
    '@netlify/blobs':{getStore:()=>{throw Error('No real storage permitted');}},
    './utils/cors':{getAllowedOrigin:()=> 'https://example.test'},
    './_shared/tax-request':salary,
    './_shared/rate-limit':{},'./_shared/api-plans':{},
    './_shared/salarypadi-service-auth':{authenticateSalaryPadiServiceKey:async()=>({valid:true,tier:'service',limit:10,remaining:9})},
    './_shared/with-api':{withApi:handler=>handler}
  };
  vm.runInNewContext(source,{exports,require:name=>{assert.ok(name in dependencies,name);return dependencies[name];},Date,console},{timeout:1000});
  const request=async(method,body,query={})=>{const response=await exports.handler({httpMethod:method,headers:{'x-api-key':'synthetic-local-only'},path:'/api/v1/tax/south-africa/paye',body:JSON.stringify(body),queryStringParameters:query});assert.equal(response.statusCode,200);return JSON.parse(response.body);};
  const get=await request('GET',null,{grossAnnual:'600000'});assert.equal(get.result.netAnnual,engine.calculate({grossAnnual:600000}).result.netAnnual);assert.equal(get.meta.netBasis,'after_paye_and_uif_before_retirement');
  for(const retirement of [0,100000,500000]){
    const body={country:'ZA',grossAnnual:2000000,retirement};const post=await request('POST',body);
    assert.deepEqual(post.result,engine.calculate(body).result);assert.equal(post.meta.retirementContributionAnnual,retirement);assert.equal(post.meta.retirementCashModelled,false);
    const opt=await request('POST',{...body,retirementFunding:'employee_cash'});assert.deepEqual(opt.result,post.result);
  }
  const reverse=await request('POST',{country:'ZA',netAnnual:499458,retirement:100000});assert.ok(Math.abs(reverse.result.netAnnual-499458)<2);assert.equal(reverse.meta.retirementCashModelled,false);
});
test('actual computed-answer adapter never relabels unknown or tax-only ZA balances as cash take-home',()=>{
  const window={AfroTools:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/engines/src/za-paye.js'),'utf8'),{window,Math,Number,Intl,Date,console},{timeout:1000});
  const module={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/ai/afro-answer.js'),'utf8'),{module,exports:module.exports,window,console},{timeout:1000});
  const answer=module.exports;
  const unknown=answer.answerPaye('salary','ZA',{amount:600000,period:'annual',window,engineOptions:{retirement:100000}});assert.equal(unknown.answered,false);assert.equal(unknown.reason,'retirement_funding_required');
  const cash=answer.answerPaye('salary','ZA',{amount:600000,period:'annual',window,engineOptions:{retirement:100000,retirementFunding:'employee_cash'}});assert.ok(Math.abs(cash.netMonthly-399457.56/12)<.01);assert.match(cash.summary,/cash remaining after employee retirement/);
  const tax=answer.answerPaye('salary','ZA',{amount:600000,period:'annual',window,engineOptions:{retirement:100000,retirementFunding:'tax_effect_only'}});assert.match(tax.summary,/before retirement payments/);assert.ok(tax.lines.some(row=>row.label==='Full annual retirement contribution'&&row.amount===100000));
});

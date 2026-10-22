'use strict';
// Full current HTML controllers + their actual loaded data, runtime engine and
// validator. The DOM below records local synthetic inputs/results only; it is
// not native-browser, current-law, source-freshness or accessibility proof.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
function scriptBlocks(html){return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m,ordinal)=>({ordinal,attrs:m[1],src:(/\bsrc=["']([^"']+)/.exec(m[1])||[])[1],body:m[2]}));}
function source(file){return fs.readFileSync(path.join(ROOT,file),'utf8');}
const catalog={window:{}};vm.runInNewContext(source('data/agriculture/country-index.js'),catalog);const countries=catalog.window.AfroTools.countryIndex.filter(c=>c.code!=='NG');
function page(country,missingBenchmarks){
 const file='agriculture/farm-payroll/'+country.slug+'.html',html=source(file),blocks=scriptBlocks(html),controllers=blocks.filter(s=>s.body.includes('var COUNTRY_CODE')&&s.body.includes('window.runCalculation'));
 assert.equal(controllers.length,1);assert(html.includes('onclick="runCalculation()"'));
 const controller=controllers[0];assert.equal(/var COUNTRY_CODE = ['"]([^'"]+)['"]/.exec(controller.body)[1],country.code);
 const required=['data/agriculture/farm-payroll-data.js','engines/farm-payroll-engine.js','assets/js/lib/farm-payroll-input-validation.js'];
 if(country.code==='NG')required.push('assets/js/lib/ng-farm-payroll-contributions.js','assets/js/lib/ng-farm-payroll-labour-assumptions.js');
 const loaded=required.map(file=>{const matches=blocks.filter(s=>s.src&&s.src.split('?')[0]==='/'+file);assert.equal(matches.length,1);assert(matches[0].ordinal<controller.ordinal);assert(!/\b(?:async|defer)\b/.test(matches[0].attrs));return {...matches[0],file};}).sort((a,b)=>a.ordinal-b.ordinal);assert.deepEqual(loaded.map(s=>s.file),required);
 const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),nodes=new Map(),listeners=new Map(),calls=[],focus=[];
 for(const m of markup.matchAll(/<([a-z][\w-]*)\b[^>]*\bid="([^"]+)"[^>]*>/gi)){
  const attributes=new Map(),classes=new Set(((/\bclass="([^"]*)"/.exec(m[0])||[])[1]||'').split(/\s+/).filter(Boolean));
  nodes.set(m[2],{id:m[2],value:(/\bvalue="([^"]*)"/.exec(m[0])||[])[1]||'',textContent:'',innerHTML:'',style:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x){if(classes.has(x)){classes.delete(x);return false;}classes.add(x);return true;}},setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k),getAttribute:k=>attributes.get(k),focus:()=>focus.push(m[2]),scrollIntoView(){}});
 }
 for(const m of markup.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/gi)){const options=[...m[2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)],selected=options.find(o=>/\bselected\b/.test(o[1]))||options[0];if(selected)nodes.get(m[1]).value=(/\bvalue="([^"]*)"/.exec(selected[1])||[])[1]||'';}
 const context={document:{getElementById:id=>nodes.get(id)||null,querySelectorAll(selector){assert.equal(selector,'[id^="lblCurrency"]');return [...nodes.values()].filter(n=>n.id.startsWith('lblCurrency'));},addEventListener(name,callback){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(callback);}},console:{log(){},error(message){throw Error(message);}}};context.window=context;vm.createContext(context);
 for(const s of loaded)vm.runInContext(source(s.file),context,{filename:s.file});
 const data=context.AfroTools.FarmPayrollData[country.code];assert(data);
 if(missingBenchmarks){data.nationalMinWage_monthly=null;data.agriMinWage_monthly=null;data.agriMinWage_daily=null;}
 const calculate=context.AfroTools.FarmPayrollEngine.calculate;context.AfroTools.FarmPayrollEngine.calculate=function(input,countryData){const result=calculate(input,countryData);calls.push({input:JSON.parse(JSON.stringify(input)),result});return result;};
 vm.runInContext(controller.body,context,{filename:file+':complete-inline-controller'});
 function set(values){for(const [id,value]of Object.entries(values)){assert(nodes.has(id),'real input '+id);nodes.get(id).value=String(value);}}
 function fire(kind,id){for(const callback of listeners.get(kind)||[])callback({target:nodes.get(id)});}
 function run(){context.runCalculation();return calls.at(-1)?.result;}
 function visible(){return nodes.get('resultsWrap').classList.contains('on');}
 set(values('permanent',data));for(const callback of listeners.get('DOMContentLoaded')||[])callback();
 return {country,data,nodes,context,calls,focus,set,fire,run,visible};
}
function values(type,data,factor){
 const monthly=data.agriMinWage_monthly||data.nationalMinWage_monthly,daily=data.agriMinWage_daily,scale=factor==null?2:factor;
 return {selWorkerType:type,inpNumWorkers:'2',inpMonthlySalary:monthly?monthly*scale:100,inpDailyRate:daily?daily*scale:100,inpDaysWorked:'20',inpRatePerUnit:'100',inpUnitsCompleted:'100',inpOvertimeHours:'0',inpHousingValue:'0',inpFoodValue:'0'};
}
function assertCalculated(p,result){assert(result&&!result.error);assert(p.visible());assert.equal(p.nodes.get('payrollValidationStatus').textContent,'');assert.equal(p.nodes.get('resNetPay').textContent,result.fNet);assert(p.nodes.get('payslipTable').innerHTML.includes(result.fGross));}
function assertUnknown(p,result,type){assertCalculated(p,result);assert.equal(result.mwCheck,null);const html=p.nodes.get('mwCheckBox').innerHTML,classes=(/class="([^"]+)"/.exec(html)||[])[1].split(/\s+/);assert(classes.includes('mw-check'));assert(!classes.includes('ok')&&!classes.includes('warn'),'unknown comparison must not imply compliance/noncompliance');assert(!/does not have|no legislated|wages are set|above agricultural|below agricultural/i.test(html));assert(/comparison.*(?:unavailable|not assessed)/i.test(html));const basis=type==='piece_rate'?'piece-rate':type==='permanent'?'monthly':'daily';assert(html.includes(basis+' pay calculation'));}
function assertCompared(p,result){assertCalculated(p,result);assert(result.mwCheck);const html=p.nodes.get('mwCheckBox').innerHTML,classes=(/class="([^"]+)"/.exec(html)||[])[1].split(/\s+/);assert(classes.includes(result.mwCheck.compliant?'ok':'warn'));assert(html.includes(result.sym+result.mwCheck.minWage.toLocaleString()));assert(html.includes(result.mwCheck.compliant?'above agricultural minimum wage':'BELOW agricultural minimum wage'));}
for(const country of countries){
 test(country.code+' complete handler keeps four pay bases and neutral missing comparisons',()=>{const p=page(country);for(const type of ['permanent','casual','seasonal','piece_rate']){p.set(values(type,p.data));p.context.onWorkerTypeChange();p.fire('change','selWorkerType');const r=p.run();if(r.mwCheck)assertCompared(p,r);else assertUnknown(p,r,type);}});
 test(country.code+' positive and negative assigned benchmark comparisons preserve results',()=>{const p=page(country);let assessed=0;for(const type of ['permanent','casual','seasonal']){const benchmark=type==='permanent'?(p.data.agriMinWage_monthly||p.data.nationalMinWage_monthly):p.data.agriMinWage_daily;if(!benchmark)continue;for(const factor of [0.5,2]){p.set(values(type,p.data,factor));p.context.onWorkerTypeChange();p.fire('change','selWorkerType');const r=p.run();assertCompared(p,r);assert.equal(r.mwCheck.compliant,factor===2);assert.equal(r.mwCheck.minWage,benchmark);assessed++;}}assert(assessed>0);});
 test(country.code+' input-change reset hides stale state and invalid input can retry',()=>{const p=page(country);p.run();assert(p.visible());p.set(values('piece_rate',p.data));p.context.onWorkerTypeChange();p.fire('change','selWorkerType');assert(!p.visible());assert.equal(p.nodes.get('payrollValidationStatus').textContent,'');assertUnknown(p,p.run(),'piece_rate');p.set({inpUnitsCompleted:'0'});p.fire('input','inpUnitsCompleted');assert(!p.visible());const before=p.calls.length;p.run();assert.equal(p.calls.length,before,'invalid value never reaches engine');assert(!p.visible());assert(p.nodes.get('payrollValidationStatus').textContent);assert.equal(p.nodes.get('inpUnitsCompleted').getAttribute('aria-invalid'),'true');assert.equal(p.focus.at(-1),'inpUnitsCompleted');p.set({inpUnitsCompleted:'100'});p.fire('input','inpUnitsCompleted');assert.equal(p.nodes.get('inpUnitsCompleted').getAttribute('aria-invalid'),undefined);assertUnknown(p,p.run(),'piece_rate');p.set(values('permanent',p.data));p.context.onWorkerTypeChange();p.fire('change','selWorkerType');assert(!p.visible());const r=p.run();if(r.mwCheck)assertCompared(p,r);else assertUnknown(p,r,'permanent');});
}
const dataContext={window:{}};vm.runInNewContext(source('data/agriculture/farm-payroll-data.js'),dataContext);
for(const country of countries.filter(c=>{const d=dataContext.window.AfroTools.FarmPayrollData[c.code];return !(d.agriMinWage_monthly||d.nationalMinWage_monthly)&&d.agriMinWage_daily;}))test(country.code+' real daily-only benchmark is not described as absence of law',()=>{const p=page(country),hint=p.nodes.get('hintMinWage').textContent;assert(!/no legislated|does not have/i.test(hint));assert(/monthly/i.test(hint));assert(/daily benchmark.*available/i.test(hint));assertUnknown(p,p.run(),'permanent');for(const type of ['casual','seasonal']){p.set(values(type,p.data));p.fire('change','selWorkerType');const r=p.run();assertCompared(p,r);assert.equal(r.mwCheck.isDaily,true);}});
test('explicit synthetic missing benchmark copy preserves all four calculations without a legal/compliance claim',()=>{const p=page(countries.find(c=>c.code==='DZ'),true),hint=p.nodes.get('hintMinWage').textContent;assert(!/no legislated|does not have|daily benchmark.*available/i.test(hint));assert(/benchmark|comparison/i.test(hint));for(const type of ['permanent','casual','seasonal','piece_rate']){p.set(values(type,p.data));p.fire('change','selWorkerType');assertUnknown(p,p.run(),type);}});
test('unsupported pay-basis alias is rejected by the real validator before engine/render',()=>{const p=page(countries.find(c=>c.code==='DZ'));p.set({selWorkerType:'daily'});p.fire('change','selWorkerType');p.run();assert.equal(p.calls.length,0);assert(!p.visible());assert(p.nodes.get('payrollValidationStatus').textContent);assert.equal(p.focus.at(-1),'selWorkerType');});

// Source print-display contract only, parsed by the existing declared css-tree.
// This does not emulate native print layout, pagination, ancestors or typography.
const cssTree=require('css-tree');
function arrayOf(list){const a=[];list.forEach(item=>a.push(item));return a;}
function displayRules(css){
 const rules=[];let order=0;
 function inspect(children,media){children.forEach(node=>{
  if(node.type==='Atrule'&&node.block){const next=node.name.toLowerCase()==='media'?cssTree.generate(node.prelude).toLowerCase():media;inspect(node.block.children,next);return;}
  if(node.type!=='Rule'||!node.prelude||node.prelude.type!=='SelectorList')return;
  const declarations=arrayOf(node.block.children).filter(d=>d.type==='Declaration'&&d.property.toLowerCase()==='display');if(!declarations.length)return;
  node.prelude.children.forEach(selector=>{const parts=arrayOf(selector.children);if(!parts.some(n=>n.type==='ClassSelector'&&n.name==='results-wrap'))return;
   assert(parts.every(n=>n.type==='ClassSelector'),'print contract requires native review for complex results-wrap selectors');assert(['all','print'].includes(media),'conditional results-wrap display needs explicit native review');
   for(const d of declarations)rules.push({classes:parts.map(n=>n.name),specificity:parts.length,important:!!d.important,order:order++,value:cssTree.generate(d.value),media});
  });
 });}
 inspect(cssTree.parse(css).children,'all');return rules;
}
function sourcePrintRules(country,readSource=source){
 const html=readSource('agriculture/farm-payroll/'+country.slug+'.html'),opening=/<div\b[^>]*\bid="resultsWrap"[^>]*>/.exec(html);assert(opening);assert(!/\bstyle=/.test(opening[0]),'inline result styles need native review');
 const owners=[];for(const m of html.matchAll(/<link\b[^>]*>/gi)){const href=(/\bhref=["']([^"']+)/.exec(m[0])||[])[1];if(href&&href.startsWith('/')&&/\brel=["']stylesheet["']/.test(m[0]))owners.push({offset:m.index,css:readSource(href.split('?')[0].slice(1))});}
 for(const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi))owners.push({offset:m.index,css:m[1]});
 owners.sort((a,b)=>a.offset-b.offset);
 return displayRules(owners.map(owner=>owner.css).join('\n'));
}
function printDisplay(rules,node){let winner=null;for(const rule of rules){if(!rule.classes.every(c=>node.classList.contains(c)))continue;if(!winner||Number(rule.important)>Number(winner.important)||(rule.important===winner.important&&(rule.specificity>winner.specificity||(rule.specificity===winner.specificity&&rule.order>winner.order))))winner=rule;}assert(winner,'owned result display rule missing');assert(['none','block'].includes(winner.value),'unexpected result display requires native review');return winner.value;}
for(const country of countries)test(country.code+' only latest valid result is printable across input reset, invalid, calculation-entry and retry',()=>{
 const p=page(country),rules=sourcePrintRules(country),panel=p.nodes.get('resultsWrap'),fields=['selWorkerType','inpNumWorkers','inpMonthlySalary','inpDailyRate','inpDaysWorked','inpRatePerUnit','inpUnitsCompleted','inpOvertimeHours','inpHousingValue','inpFoodValue'];
 for(const field of fields){const type=['inpDailyRate','inpDaysWorked'].includes(field)?'casual':['inpRatePerUnit','inpUnitsCompleted'].includes(field)?'piece_rate':'permanent';p.set(values(type,p.data));p.context.onWorkerTypeChange();const r=p.run();assertCalculated(p,r);assert.equal(printDisplay(rules,panel),'block');const stale=p.nodes.get('payslipTable').innerHTML;assert(stale.length>0);p.set({[field]:field==='selWorkerType'?'seasonal':Number(p.nodes.get(field).value)+1});if(field==='selWorkerType')p.context.onWorkerTypeChange();p.fire(field==='selWorkerType'?'change':'input',field);assert(!p.visible());assert.equal(p.nodes.get('payslipTable').innerHTML,stale,'old DOM really remains, so print visibility must protect it');assert.equal(printDisplay(rules,panel),'none','changed input cannot print stale payroll');}
 p.set(values('permanent',p.data));p.run();p.set({inpMonthlySalary:'-1'});p.fire('input','inpMonthlySalary');const before=p.calls.length;p.run();assert.equal(p.calls.length,before);assert(!p.visible());assert(p.nodes.get('payrollValidationStatus').textContent);assert.equal(printDisplay(rules,panel),'none');
 p.set({inpMonthlySalary:'100'});p.fire('input','inpMonthlySalary');assert.equal(printDisplay(rules,panel),'none');const calculate=p.context.AfroTools.FarmPayrollEngine.calculate;let atCalculationEntry=null;p.context.AfroTools.FarmPayrollEngine.calculate=function(input,data){atCalculationEntry=printDisplay(rules,panel);return calculate(input,data);};const retried=p.run();assertCalculated(p,retried);assert.equal(atCalculationEntry,'none','actual handler invalidates before synchronous engine call');assert.equal(printDisplay(rules,panel),'block');
 p.set(values('piece_rate',p.data));p.fire('change','selWorkerType');assert.equal(printDisplay(rules,panel),'none');assertUnknown(p,p.run(),'piece_rate');assert.equal(printDisplay(rules,panel),'block','valid latest neutral result remains printable');const fresh=page(country);assert.equal(printDisplay(sourcePrintRules(country),fresh.nodes.get('resultsWrap')),'none');
});
test('genuine CSS AST cascade controls respect importance, specificity, order and refuse unsupported selectors',()=>{
 const node={classList:{contains:name=>['results-wrap','on'].includes(name)}},css='.results-wrap{display:none!important}.results-wrap.on{display:block!important}';
 assert.equal(printDisplay(displayRules(css),node),'block');
 assert.equal(printDisplay(displayRules(css+'.results-wrap.on.on{display:none}'),node),'block','nonimportant higher specificity cannot beat important');
 assert.equal(printDisplay(displayRules(css+'.results-wrap{display:none!important}'),node),'block','important lower specificity cannot override current valid state');
 assert.equal(printDisplay(displayRules(css+'.results-wrap.on{display:none!important}'),node),'none','late equally-specific important regression is observable');
 assert.equal(printDisplay(displayRules(css+'.results-wrap.on.on{display:none!important}'),node),'none','higher-specificity important regression is observable');
 assert.throws(()=>displayRules('#unexpected .results-wrap{display:block!important}'),/complex results-wrap selectors/);
 assert.throws(()=>displayRules('@media (max-width:600px){.results-wrap{display:block}}'),/conditional results-wrap display/);
});

// A real late stylesheet can override earlier inline print CSS at equal specificity.
// Keep each actual HTML owner order; do not regroup linked and inline sheets.
for(const country of countries)test(country.code+' actual linked/inline document order exposes late equally-specific important display',()=>{
 const owner='agriculture/farm-payroll/'+country.slug+'.html',html=source(owner),lateOwner='assets/css/top-level-page-ui-refresh.css';
 const link=[...html.matchAll(/<link\b[^>]*>/gi)].find(m=>m[0].includes('/'+lateOwner));
 const printStyle=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].find(m=>m[1].includes('@media print'));
 assert(link&&printStyle,'actual stylesheet and owned print block must exist');
 const injected=source(lateOwner)+'\n@media print{.results-wrap{display:block!important}}';
 const readSource=file=>file===lateOwner?injected:source(file),rules=sourcePrintRules(country,readSource),p=page(country);
 p.set(values('permanent',p.data));assertCalculated(p,p.run());const stale=p.nodes.get('payslipTable').innerHTML;assert(stale.length>0);
 p.set({inpMonthlySalary:Number(p.nodes.get('inpMonthlySalary').value)+1});p.fire('input','inpMonthlySalary');assert(!p.visible());assert.equal(p.nodes.get('payslipTable').innerHTML,stale);
 assert.equal(printDisplay(rules,p.nodes.get('resultsWrap')),link.index>printStyle.index?'block':'none','actual late equal-specificity important rule must be visible to the source guard');
});

test('NG complete confirmed-choice handler prints only latest valid state through changes, invalid, reset and retry',()=>{
 const country=catalog.window.AfroTools.countryIndex.find(c=>c.code==='NG');assert(country);const p=page(country),rules=sourcePrintRules(country),panel=p.nodes.get('resultsWrap'),states=[];
 function observe(name,expectedVisible,expectedPrint){assert.equal(p.visible(),expectedVisible);states.push({name,visible:p.visible(),actualPrint:printDisplay(rules,panel),expectedPrint});}
 observe('fresh',false,'none');
 p.set({ng_pension:'not-applicable',ng_health:'not-applicable',ng_housing:'not-participating',ng_wageCoverage:'unknown',ng_leaveBudget:'exclude'});
 assertCalculated(p,p.run());const initial=p.nodes.get('payslipTable').innerHTML;assert(initial.length>0);observe('valid',true,'block');
 p.set({inpMonthlySalary:Number(p.nodes.get('inpMonthlySalary').value)+1});p.fire('input','inpMonthlySalary');assert.equal(p.nodes.get('payslipTable').innerHTML,initial);observe('changed',false,'none');
 p.set({inpMonthlySalary:'-1'});p.fire('input','inpMonthlySalary');const before=p.calls.length;p.context.runCalculation();assert.equal(p.calls.length,before);assert(p.nodes.get('payrollValidationStatus').textContent);assert.equal(p.nodes.get('payslipTable').innerHTML,initial);observe('invalid',false,'none');
 p.set({inpMonthlySalary:'100000'});p.fire('input','inpMonthlySalary');assert.equal(p.nodes.get('payslipTable').innerHTML,initial);observe('input-reset-without-calculation',false,'none');
 assertCalculated(p,p.run());const retry=p.nodes.get('payslipTable').innerHTML;assert.notEqual(retry,initial);observe('valid-retry',true,'block');
 p.set({ng_pension:'standard'});p.fire('change','ng_pension');assert.equal(p.nodes.get('payslipTable').innerHTML,retry);observe('contribution-choice-changed',false,'none');
 p.set({ng_pension:'not-applicable'});p.fire('change','ng_pension');observe('contribution-choice-restored',false,'none');assertCalculated(p,p.run());observe('final-valid',true,'block');
 console.log('# NG-owned-print-source-state '+JSON.stringify({country:'NG',actualScripts:5,states}));
 assert.deepEqual(states.map(s=>s.actualPrint),states.map(s=>s.expectedPrint),'offscreen staleNGpayroll muststayexcluded fromsourceprintcascade');
});

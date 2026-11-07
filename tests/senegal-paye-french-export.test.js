const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const ROOT=process.env.AFROTOOLS_SN_TEST_ROOT||path.join(__dirname,'..');
const DEP=process.env.AFROTOOLS_SN_ENGINE_ROOT||ROOT;
function run(lang='fr'){
 const engine=require(path.join(DEP,'assets/js/engines/sn-paye.js'));
 const html=fs.readFileSync(path.join(ROOT,lang==='en'?'senegal/sn-paye.html':'fr/senegal/calculateur-salaire-net.html'),'utf8');
 const script=Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),m=>m[1]).find(s=>s.includes('function renderRows(R)'));
 const nodes=new Map(),state={downloads:[],status:{textContent:''}},config={englishId:'sn-paye',englishRoute:'/senegal/sn-paye',formats:['pdf']};
 function get(id){if(!nodes.has(id)){const values={familyStatus:'single',dependentChildren:'0',soleTaxableEarner:'',spousesWithoutIncome:'',confirmedParts:'',confirmedTrimfPersons:''},classes=new Set(id==='ipres'?['on']:[]);nodes.set(id,{value:values[id]??'7500000',style:{},textContent:'',innerHTML:'',min:'500000',max:'100000000',classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k){classes.has(k)?classes.delete(k):classes.add(k);}},setAttribute(k,v){this[k]=v;},removeAttribute(){},addEventListener(){},scrollIntoView(){},focus(){}});}return nodes.get(id);}
 const document={readyState:'loading',documentElement:{},body:{appendChild(){},querySelectorAll:()=>[]},head:{appendChild(n){state.script=n;}},getElementById:id=>id==='afrotools-fr-finance-export-contract'?{textContent:JSON.stringify(config)}:get(id),querySelectorAll:()=>[],querySelector:s=>s.startsWith('[data-tog=')?get('ipres'):s.includes('[role="status"]')?state.status:null,addEventListener(){},createElement:tag=>({dataset:{},addEventListener(name,fn){this[name]=fn;},click(){},remove(){}})};
 const window={SenegalPayeEngine:engine,location:{pathname:'/fr/senegal/calculateur-salaire-net'},open(){return null;},addEventListener(){},setTimeout(){},dispatchEvent(){}};
 const ctx=vm.createContext({window,document,navigator:{},Blob,URL:{createObjectURL(b){state.downloads.push(b);return'blob:synthetic';},revokeObjectURL(){}},CustomEvent:class{},getComputedStyle:()=>({getPropertyValue:()=>''}),setTimeout(){},Chart:function(){this.destroy=()=>{};},AfroChartColors:{doughnut:['a','b','c','d']},alert(m){throw Error(m);}});
 vm.runInContext(script,ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/js/pages/french-finance-export-contract.js'),'utf8'),ctx);
 function input(id,value){get(id).value=String(value);if(id==='grossSalary')ctx.onInput(get(id));else if(id.startsWith('confirmed'))ctx.overrideChanged();else ctx.familyChanged();}
 function family(){for(const[id,value]of Object.entries({familyStatus:'married',dependentChildren:2,soleTaxableEarner:'yes',spousesWithoutIncome:1}))input(id,value);}
 return{ctx,get,input,family,state,config,api:window.AfroTools.frenchFinanceExport,report:window.AfroTools.senegalSalaryReport};
}
function find(items,label){const row=items.find(x=>x.label===label);assert.ok(row,label);return row.value;}
function number(value){return Number(value.replace(/[^\d.-]/g,''));}
test('French structured export retains actual household choices, dates and useful separate result rows',()=>{
 const h=run();h.family();h.ctx.calculate();const report=h.api.snapshot();
 assert.equal(report.locale,'fr-SN');assert.equal(report.inputs.length,9);assert.equal(report.results.length,20);
 assert.equal(find(report.inputs,'Seul conjoint ayant des revenus imposables'),'Oui');assert.equal(find(report.inputs,'Conjoints sans aucun revenu'),'1');
 assert.equal(find(report.inputs,'IPRES général sélectionné'),'Oui');assert.equal(find(report.results,'Parts fiscales'),'3');
 assert.equal(number(find(report.results,'Salaire net annuel')),5798196);assert.equal(number(find(report.results,'Net mensuel moyen sur 12 mois')),483183);
 assert.match(find(report.results,'DGID, CGI de janvier 2025'),/https:\/\/www.dgid.sn/);assert.match(find(report.results,'CLEISS, paramètres au 1er janvier 2026'),/432 000/);
 assert.doesNotMatch(JSON.stringify(report.results),/Télécharger|Partager/);
});
test('reverse input handlers synchronize fields and export the exact target and monthly gross',()=>{
 const h=run();h.family();h.ctx.calculate();h.ctx.setCalcMode('net');h.input('grossSalary',7500000);h.ctx.calculate();const r=h.report();
 assert.equal(Number(h.get('salarySlider').value),7500000);assert.equal(number(find(r.inputs,'Net annuel demandé')),7500000);
 assert.equal(number(find(r.results,'Brut mensuel requis estimé')),818856);assert.equal(number(find(r.results,'Salaire brut annuel')),9826269);
 assert.equal(number(find(r.results,'Salaire net annuel')),7500000);
});
test('IPRES off, spouse income and confirmed overrides remain explicit in the report',()=>{
 const h=run();h.family();h.input('soleTaxableEarner','no');h.input('spousesWithoutIncome',0);h.ctx.togItem(h.get('ipres'));h.ctx.calculate();let r=h.report();
 assert.equal(find(r.inputs,'IPRES général sélectionné'),'Non');assert.equal(find(r.inputs,'Seul conjoint ayant des revenus imposables'),'Non');assert.equal(find(r.inputs,'Conjoints sans aucun revenu'),'0');assert.equal(number(find(r.results,'IPRES salarié général')),0);
 h.input('confirmedParts',4);h.input('confirmedTrimfPersons',0);h.ctx.calculate();r=h.report();assert.equal(find(r.inputs,'Parts confirmées manuellement'),'4');assert.equal(find(r.inputs,'Personnes TRIMF confirmées manuellement'),'0');assert.equal(find(r.results,'Parts fiscales'),'4');
});
test('salary, household, override and IPRES edits clear successful export availability',()=>{
 for(const action of ['salary','family','override','ipres']){const h=run();h.ctx.calculate();h.report();if(action==='salary')h.input('grossSalary',8000000);if(action==='family')h.input('dependentChildren',1);if(action==='override')h.input('confirmedParts',3);if(action==='ipres')h.ctx.togItem(h.get('ipres'));assert.throws(h.report,/actualisez/);}
});
test('mode transition exports its fresh result, and programmatic unsynchronized changes are rejected',()=>{
 const h=run();h.ctx.calculate();h.ctx.setCalcMode('net');assert.match(find(h.report().inputs,'Sens du calcul'),/Net annuel/);h.get('grossSalary').value='8000000';assert.throws(h.report,/actualisez/);
});
test('missing provider fails clearly only for Senegal; generic other-page snapshot remains the default',()=>{
 const h=run();h.ctx.window.AfroTools.senegalSalaryReport=null;assert.throws(()=>h.api.snapshot(),/indisponible/);
 h.config.englishId='other';assert.throws(()=>h.api.snapshot(),/Renseignez/);
});
test('an edit during local PDF renderer loading aborts before any download',async()=>{
 const h=run();h.ctx.calculate();const promise=h.api.run('pdf');assert.ok(h.state.script);h.input('grossSalary',8000000);
 h.ctx.window.jspdf={jsPDF:function(){throw Error('Renderer must not be reached');}};h.state.script.load();await assert.rejects(promise,/actualisez/);assert.equal(h.state.downloads.length,0);
});
test('a different recalculation while the renderer loads cannot export the previous scenario',async()=>{
 const h=run();h.ctx.calculate();const promise=h.api.run('pdf');h.input('grossSalary',8000000);h.ctx.calculate();h.ctx.window.jspdf={jsPDF:function(){throw Error('Renderer must not be reached');}};h.state.script.load();await assert.rejects(promise,/scénario a changé/);assert.equal(h.state.downloads.length,0);
});

test('English PDF payload and native print HTML retain captured scenario choices and reverse target',async()=>{
 const h=run('en');h.family();h.ctx.togItem(h.get('ipres'));h.ctx.calculate();
 let payload=h.ctx.exportPayload(h.ctx.RESULT),rows=payload.sections[0].rows;
 assert.equal(find(rows,'General IPRES selected'),'No');assert.equal(find(rows,'Family status'),'Married');assert.equal(find(rows,'Qualifying dependent children'),'2');assert.equal(find(rows,'Only spouse with taxable income'),'Yes');assert.equal(find(rows,'Spouses with no income of any kind'),'1');
 h.ctx.generatePdf();let html=await h.state.downloads.at(-1).text();assert.match(html,/Scenario used for this estimate/);assert.match(html,/<dt>General IPRES selected<\/dt><dd>No<\/dd>/);
 h.ctx.togItem(h.get('ipres'));h.ctx.calculate();h.ctx.setCalcMode('net');h.input('grossSalary',7500000);h.ctx.calculate();payload=h.ctx.exportPayload(h.ctx.RESULT);rows=payload.sections[0].rows;
 assert.equal(number(find(rows,'Requested annual net')),7500000);assert.equal(payload.heroStats[0].label,'Monthly gross required');assert.equal(number(payload.heroStats[0].value),818856);
 h.ctx.generatePdf();html=await h.state.downloads.at(-1).text();assert.match(html,/<dt>Requested annual net<\/dt><dd>XOF[\s\S]*?7,500,000<\/dd>/);
});
test('English report uses successful captured choices rather than later unsent DOM values',()=>{
 const h=run('en');h.family();h.input('confirmedParts',4);h.input('confirmedTrimfPersons',0);h.ctx.calculate();const result=h.ctx.RESULT;
 h.input('dependentChildren',3);assert.equal(h.ctx.RESULT,null);const rows=h.ctx.salaryScenarioRows(result);
 assert.equal(find(rows,'Qualifying dependent children'),'2');assert.equal(find(rows,'Confirmed tax shares override'),'4');assert.equal(find(rows,'Confirmed TRIMF persons override'),'0');
 const count=h.state.downloads.length;h.ctx.generatePdf();assert.equal(h.state.downloads.length,count);
});

"use strict";
// Native served files only. Delayed PDF tests continue the original library request.

async function malaria(page, baseURL, outputPath) {
 const pages=[{"id": "malaria-risk", "lang": "fr", "route": "/fr/tools/risque-paludisme/"}],output=outputPath,rows=[];
 for(const spec of pages)for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',timezoneId:'UTC',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));p.on('pageerror',e=>errors.push(e.message));

  await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+spec.route,{waitUntil:'load'});if(spec.id==='malaria-risk')await p.locator('[name=symptomTiming]').selectOption('today');if(spec.id==='cholera-risk')await p.locator('[name=timing]').selectOption('today');await p.locator('#form button[type=submit]').click();if(await p.locator('#txt').isDisabled())throw Error('Initial calculation failed '+spec.id);
  const dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp,file=output+'/'+spec.id+'-'+spec.lang+'-'+mode+'.txt';await d.saveAs(file);
  const controls=await p.locator('#form input[type=checkbox], #form select').evaluateAll(nodes=>nodes.map(n=>({name:n.name,type:n.tagName==='SELECT'?'select':'checkbox',value:n.tagName==='SELECT'?[...n.options].reverse().find(o=>o.value!==n.value).value:true})).sort((a,b)=>a.type==='checkbox'&&b.type!=='checkbox'?-1:b.type==='checkbox'&&a.type!=='checkbox'?1:0));
  const edits=[];
  for(const control of controls){
   const cached=await p.locator('#result').innerText(),target=p.locator('#form [name="'+control.name+'"]');if(control.type==='checkbox')await target.check();else await target.selectOption(control.value);
   const disabled=await p.locator('#txt').isDisabled(),printDisabled=await p.locator('#print').isDisabled(),after=await p.locator('#result').innerText();
   if(mode==='patched'&&(!disabled||!printDisabled||cached===after))throw Error('Stale '+spec.id+spec.lang+control.name);
   const edit={name:control.name,type:control.type,disabled,printDisabled,oldResultRetained:cached===after};
   if(mode==='baseline'&&edits.length===0){const dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp;edit.staleFile=output+'/'+spec.id+'-'+spec.lang+'-stale.txt';await d.saveAs(edit.staleFile);}
   edits.push(edit);await p.locator('#form button[type=submit]').click();if(await p.locator('#txt').isDisabled())throw Error('Recalculation failed '+spec.id+control.name);
  }
  await p.locator('#clear').click();if(!await p.locator('#txt').isDisabled())throw Error('Clear retained export');
  rows.push({id:spec.id,lang:spec.lang,mode,file,edits,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors});await ctx.close();
 }
 return{rows,production:false};
}

async function standard_bmi_tb(page, baseURL, outputPath) {
 const pages=[{"id": "bmi-calculator", "lang": "en", "route": "/tools/bmi-calculator/"}, {"id": "bmi-calculator", "lang": "fr", "route": "/fr/tools/calculateur-imc/"}, {"id": "bmi-calculator", "lang": "sw", "route": "/sw/zana/kikokotoo-bmi-ya-mwili/"}, {"id": "tb-tracker", "lang": "en", "route": "/tools/tb-tracker/"}, {"id": "tb-tracker", "lang": "fr", "route": "/fr/tools/suivi-traitement-tuberculose/"}, {"id": "tb-tracker", "lang": "sw", "route": "/sw/zana/ratiba-ya-huduma-ya-kifua-kikuu/"}],output=outputPath,rows=[];
 for(const spec of pages)for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',timezoneId:'UTC',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));p.on('pageerror',e=>errors.push(e.message));

  await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+spec.route,{waitUntil:'load'});const bmi=spec.id==='bmi-calculator';
  if(bmi){await p.locator('#audience').selectOption('adult');await p.locator('#heightCm').fill('170');await p.locator('#weightKg').fill('70');}
  else for(const[id,value]of Object.entries({today:'2026-10-10',appointment:'2026-10-20',sample:'2026-10-21',resultDate:'2026-10-22'}))await p.locator('#'+id).fill(value);
  await p.locator('#form button[type=submit]').click();
  const dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp,file=output+'/'+spec.id+'-'+spec.lang+'-'+mode+'.txt';await d.saveAs(file);
  const mutations=bmi?[['heightCm','175'],['weightKg','80'],['units','imperial']]:[['today','2026-10-11'],['appointment','2026-11-01'],['sample','2026-11-03'],['resultDate','2026-11-05'],['appointmentStatus','completed'],['sampleStatus','completed'],['resultStatus','changed'],['sameEpisode',true]];const edits=[];
  for(const [id,value]of mutations){const target=p.locator('#'+id);if(typeof value==='boolean')await target.check();else if(id==='units'||id.endsWith('Status'))await target.selectOption(value);else await target.fill(value);
   const disabled=await p.locator('#txt').isDisabled(),printDisabled=await p.locator('#print').isDisabled(),oldResultVisible=await p.locator(bmi?'#result .value':'#result .level').count()>0;
   if(mode==='patched'&&(!disabled||!printDisabled||oldResultVisible))throw Error('Stale '+spec.id+spec.lang+id);const edit={id,disabled,printDisabled,oldResultVisible};
   if(mode==='baseline'&&edits.length===0){const dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp;edit.staleFile=output+'/'+spec.id+'-'+spec.lang+'-stale.txt';await d.saveAs(edit.staleFile);}edits.push(edit);
   if(id==='units'){for(const [field,v]of Object.entries({feet:'5',inches:'8',pounds:'180'}))await p.locator('#'+field).fill(v);}
   await p.locator('#form button[type=submit]').click();if(await p.locator('#txt').isDisabled())throw Error('Recalculate failed');
  }
  let invalidResultVisible=null;if(bmi){await p.locator('#audience').selectOption('under20');await p.locator('#form button[type=submit]').click();invalidResultVisible=await p.locator('#result .value').count()>0;if(mode==='patched'&&invalidResultVisible)throw Error('Unsupported audience retains result');}
  await p.locator('#clear').click();if(!await p.locator('#txt').isDisabled())throw Error('Clear retained export');
  rows.push({id:spec.id,lang:spec.lang,mode,file,edits,invalidResultVisible,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors});await ctx.close();
 }
 return{rows,production:false};
}

async function water(page, baseURL, outputPath) {
 const pages=[{"lang": "en", "route": "/tools/water-quality/"}, {"lang": "fr", "route": "/fr/tools/qualite-eau/"}, {"lang": "sw", "route": "/sw/zana/usalama-wa-maji/"}],output=outputPath,rows=[];
 const cases=[{id:'none',labStatus:'none'}, {id:'other',labStatus:'competent',sampleScope:'other',ecoliStatus:'not-detected'}, {id:'ecoli',labStatus:'competent',ecoliStatus:'detected'}, {id:'chemical',labStatus:'competent',ecoliStatus:'not-detected',arsenic:'11',fluoride:'2',turbidity:'6'}, {id:'partial',labStatus:'partial',ecoliStatus:'not-detected',arsenic:'0',fluoride:'0',turbidity:'0'}, {id:'caution',labStatus:'competent',ecoliStatus:'not-detected',arsenic:'10',fluoride:'1.5',turbidity:'3'}, {id:'pass',labStatus:'competent',ecoliStatus:'not-detected',arsenic:'10',fluoride:'1.5',turbidity:'1'}, {id:'boil',labStatus:'competent',advisory:'boil'}, {id:'do-not-drink',labStatus:'competent',advisory:'do-not-drink'}];
 for(const spec of pages)for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',timezoneId:'UTC',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));p.on('pageerror',e=>errors.push(e.message));await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+spec.route,{waitUntil:'load'});
  for(const example of cases){
   await p.locator('#clear').click();const input={labStatus:'none',sampleScope:'drinking',advisory:'none',ecoliStatus:'not-entered',sampleDate:'2026-10-09',arsenic:'',fluoride:'',turbidity:'',...example};
   for(const id of ['labStatus','sampleScope','advisory','ecoliStatus'])await p.locator('#'+id).selectOption(input[id]);for(const id of ['sampleDate','arsenic','fluoride','turbidity'])await p.locator('#'+id).fill(input[id]);await p.locator('#form button[type=submit]').click();
   const result=await p.evaluate(()=>WaterResultEngine.review(Object.fromEntries(new FormData(document.getElementById('form')).entries())));
   const dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp,file=output+'/'+spec.lang+'-'+mode+'-'+example.id+'.txt';await d.saveAs(file);
   await p.locator('#advisory').selectOption(input.advisory==='do-not-drink'?'boil':'do-not-drink');const invalidated=await p.locator('#txt').isDisabled()&&await p.locator('#print').isDisabled()&&await p.locator('#result h3').count()===0;if(mode==='patched'&&!invalidated)throw Error('Advisory stale export');
   rows.push({lang:spec.lang,mode,case:example.id,input,result,file,invalidated,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors:[...errors]});
  }
  await ctx.close();
 }
 return{rows,production:false};
}

async function vaccine(page, baseURL, outputPath) {
 const source=null,output=outputPath,rows=[];
 const countries=['NG','KE','GH','ZA','ET','OTHER'],ages=['newborn','infant','early-childhood','school-age','adolescent','adult'],reasons=['routine','missed','unclear','no-record','reaction'];
 const routes={en:'/tools/vaccine-schedule/',fr:'/fr/tools/calendrier-vaccinal/',sw:'/sw/zana/ratiba-ya-chanjo/'};
 for(const lang of ['en','fr','sw'])for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',timezoneId:'UTC',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));p.on('pageerror',e=>errors.push(e.message));
  await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+routes[lang],{waitUntil:'load'});
  for(let n=0;n<(lang==='fr'?30:6);n++){
   const input={country:countries[n%6],ageBand:ages[n%6],recordStatus:reasons[n%5],recordProduct:n%2?'':'Download PDF — café <>&'};
   await p.locator('#country').selectOption(input.country);await p.locator('#age-band').selectOption(input.ageBand);await p.locator('#record-status').selectOption(input.recordStatus);await p.locator('#record-product').fill(input.recordProduct);await p.locator('#programme-form button[type=submit]').click();await p.locator('#handoff').waitFor({state:'visible'});
   const result=await p.evaluate(x=>AfroToolsVaccineHandoff.prepare(x),input),dp=p.waitForEvent('download');await p.locator('#download-button').click();const download=await dp,file=output+'/'+lang+'-'+mode+'-'+n+'.txt';await download.saveAs(file);
   rows.push({lang,mode,n,input,result,file,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors:[...errors]});
  }
  await ctx.close();
 }
 return{rows,production:false};
}

async function antenatal(page, baseURL, outputPath) {
 const source=null,output=outputPath,rows=[],snapshots=[];
 const routes={en:'/health/pregnancy-due-date/',fr:'/fr/health/pregnancy-due-date/',sw:'/sw/zana/tarehe-ya-kujifungua/'};
 const cases=[{id:'lmp21',basis:'lmp',date:'2026-07-12',cycle:'21'},{id:'lmp28',basis:'lmp',date:'2026-07-12',cycle:'28'},{id:'lmp35',basis:'lmp',date:'2026-07-12',cycle:'35'},{id:'confirmed',basis:'confirmed-edd',date:'2026-12-31',cycle:'28'},{id:'42weeks',basis:'confirmed-edd',date:'2026-09-26',cycle:'28'},{id:'outside',basis:'lmp',date:'2025-09-01',cycle:'28'}];
 for(const lang of ['en','fr','sw'])for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',viewport:{width:390,height:844},timezoneId:'UTC'}),p=await ctx.newPage(),errors=[];
  await ctx.addInitScript(()=>{localStorage.setItem('afrotools_cookie_consent','declined');const RealDate=Date;class FixtureDate extends RealDate{constructor(...args){super(...(args.length?args:['2026-10-10T12:00:00Z']));}static now(){return new RealDate('2026-10-10T12:00:00Z').getTime();}}window.Date=FixtureDate;});p.on('pageerror',e=>errors.push(e.message));
  await p.goto(baseURL+routes[lang],{waitUntil:'load'});
  async function save(id,suffix){const dp=p.waitForEvent('download');await p.locator('#'+id).click();const download=await dp,file=output+'/'+lang+'-'+mode+'-'+suffix;await download.saveAs(file);return file;}
  for(const fixture of cases){await p.locator('input[name=basis][value="'+fixture.basis+'"]').check();await p.locator('#planning-date').fill(fixture.date);if(fixture.basis==='lmp')await p.locator('#cycle-length').fill(fixture.cycle);await p.locator('#appointment-form button[type=submit]').click();await p.locator('#appointment-results').waitFor({state:'visible'});
   const plan=await p.evaluate(()=>AfroPregnancyAppointmentPlanner.getPlan()),txt=await save('txt-export',fixture.id+'.txt'),pdf=await save('pdf-export',fixture.id+'.pdf'),ics=await save('ics-export',fixture.id+'.ics');rows.push({lang,mode,fixture,plan,txt,pdf,ics,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors:[...errors]});}
  if(lang==='fr'&&mode==='patched'){const snapshot={toolId:'due-date',headline:'Synthetic résumé — café',fields:[{label:'Download PDF',value:'Texte privé <>& 123'},{label:'',value:'Opaque test'}]};await p.evaluate(x=>AfroHealthWorkflow.recordSnapshot(x),snapshot);snapshots.push({snapshot,txt:await save('txt-export','snapshot.txt'),pdf:await save('pdf-export','snapshot.pdf')});}
  await ctx.close();
 }
 return{rows,snapshots,fixtureClock:'2026-10-10T12:00:00Z',production:false};
}

async function dose(page, baseURL, outputPath) {const source=null,output=outputPath,routes={"en": "/tools/drug-dosage/", "fr": "/fr/tools/dosage-medicament/", "sw": "/sw/zana/kikokotoo-dozi-ya-dawa/"},rows=[],cases=[];for(const basis of ['fixed','weight'])for(const mode of ['mass','liquid','solid'])for(const unit of ['mcg','mg','g']){const n=cases.length;cases.push({id:n,basis,mode,unit,dose:basis==='fixed'?({mcg:'500000',mg:'500',g:'0.5'}[unit]):'2',weight:n%2?'44.092452':'20',weightUnit:n%2?'lb':'kg',strength:n%2?'300':'250',name:n%2?'':'Download PDF — café <>&'});}
for(const lang of ['en','fr','sw'])for(const mode of ['patched']){const ctx=await page.context().browser().newContext({serviceWorkers:'block',timezoneId:'UTC',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));p.on('pageerror',e=>errors.push(e.message));await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+routes[lang],{waitUntil:'load'});
for(const fixture of cases.filter(x=>lang==='fr'||x.id%3===0)){await p.locator('#instruction-confirmed').check();await p.locator('#medication-name').fill(fixture.name);await p.locator('#dose-basis').selectOption(fixture.basis);await p.locator('#output-mode').selectOption(fixture.mode);await p.locator('#prescribed-dose').fill(fixture.dose);await p.locator('#dose-unit').selectOption(fixture.unit);if(fixture.basis==='weight'){await p.locator('#body-weight').fill(fixture.weight);await p.locator('#weight-unit').selectOption(fixture.weightUnit);}if(fixture.mode==='liquid'){await p.locator('#concentration-mass').fill('250');await p.locator('#concentration-unit').selectOption('mg');await p.locator('#concentration-volume').fill('5');}if(fixture.mode==='solid'){await p.locator('#unit-strength').fill(fixture.strength);await p.locator('#strength-unit').selectOption('mg');}await p.locator('#dose-form button[type=submit]').click();await p.locator('#result-panel').waitFor({state:'visible'});
const result=await p.evaluate(()=>{const val=id=>document.getElementById(id).value;return AfroToolsDrugDose.calculate({instructionConfirmed:document.getElementById('instruction-confirmed').checked,medicationName:val('medication-name'),basis:val('dose-basis'),mode:val('output-mode'),prescribedDose:val('prescribed-dose'),doseUnit:val('dose-unit'),weight:val('body-weight'),weightUnit:val('weight-unit'),concentrationMass:val('concentration-mass'),concentrationUnit:val('concentration-unit'),concentrationVolume:val('concentration-volume'),unitStrength:val('unit-strength'),strengthUnit:val('strength-unit')});});const dp=p.waitForEvent('download');await p.locator('#download-button').click();const d=await dp,file=output+'/'+lang+'-'+mode+'-'+fixture.id+'.txt';await d.saveAs(file);rows.push({lang,mode,fixture,result,file,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors:[...errors]});}await ctx.close();}return{rows,production:false};
}

async function measurement(page, baseURL, outputPath) {const pages=[{"lang": "en", "route": "/health/bmi-calculator/"}, {"lang": "fr", "route": "/fr/health/bmi-calculator/"}, {"lang": "sw", "route": "/sw/zana/kikokotoo-bmi/"}],output=outputPath,rows=[],cases=[{id:'single',height:'180',height2:'',weight1:'80',weight2:'',conditions:'unknown'},{id:'spread',height:'180',height2:'181',weight1:'80',weight2:'82',conditions:'yes'},{id:'same',height:'180',height2:'180',weight1:'80',weight2:'80',conditions:'yes'},{id:'height-only',height:'180',height2:'180.1',weight1:'80',weight2:'',conditions:'no'},{id:'weight-only',height:'180',height2:'',weight1:'80',weight2:'80.1',conditions:'unknown'},{id:'bounds',height:'100',height2:'250',weight1:'25',weight2:'400',conditions:'no'}];
for(const spec of pages)for(const mode of ['patched']){const ctx=await page.context().browser().newContext({serviceWorkers:'block',timezoneId:'UTC',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));p.on('pageerror',e=>errors.push(e.message));await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+spec.route,{waitUntil:'load'});
for(const fixture of cases){await p.locator('#clear').click();for(const id of ['height','height2','weight1','weight2'])await p.locator('#'+id).fill(fixture[id]);await p.locator('#conditions').selectOption(fixture.conditions);await p.locator('#form button[type=submit]').click();const result=await p.evaluate(()=>{const f=document.getElementById('form');return BmiMeasurementEngine.assess({heightCm:f.height.value,repeatHeightCm:f.height2.value,weightKg:f.weight1.value,repeatWeightKg:f.weight2.value,sameConditions:f.conditions.value});});const dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp,file=output+'/'+spec.lang+'-'+mode+'-'+fixture.id+'.txt';await d.saveAs(file);await p.locator('#height').fill(fixture.height==='180'?'181':'180');const clears=await p.locator('#txt').isDisabled()&&await p.locator('#print').isDisabled()&&await p.locator('#result .value').count()===0;if(mode==='patched'&&!clears)throw Error('Prior input invalidation lost');rows.push({lang:spec.lang,mode,fixture,result,file,clears,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors:[...errors]});}
await ctx.close();}return{rows,production:false};
}

async function blood_pressure(page, baseURL, outputPath) {const source=null,output=outputPath,rows=[],asyncRows=[],routes={en:'/tools/blood-pressure/',fr:'/fr/tools/tension-arterielle/',sw:'/sw/zana/shinikizo-la-damu/'},cases=[{id:'symptoms',urgent:true},{id:'pregnant-severe',context:'pregnant',s1:160},{id:'postpartum-review',context:'postpartum',s1:140,d1:90},{id:'adult-repeat',s1:190,d1:125,s2:190,d2:125},{id:'adult-first',s1:190,d1:125},{id:'adult-review',s1:140,d1:90},{id:'technique',technique:2},{id:'pregnant-below',context:'pregnant'},{id:'adult-below'},{id:'postpartum-severe',context:'postpartum',s1:150,d1:110},{id:'pregnant-diastolic',context:'pregnant',s1:135,d1:90},{id:'adult-boundary',s1:180,d1:120,s2:180,d2:120}];
async function setup(p,f){f={context:'adult',s1:122,d1:78,s2:128,d2:82,technique:4,urgent:false,...f};await p.locator('#health-context').selectOption(f.context);for(const [id,value]of Object.entries({'systolic-1':f.s1,'diastolic-1':f.d1,'systolic-2':f.s2,'diastolic-2':f.d2}))await p.locator('#'+id).fill(String(value));for(const [i,id]of ['rested','positioned','cuff','quiet'].entries())await p.locator('#'+id).setChecked(i<f.technique);await p.locator('#urgent-symptoms').setChecked(f.urgent);await p.locator('#blood-pressure-form button[type=submit]').click();}
for(const lang of ['en','fr','sw'])for(const mode of ['patched']){const ctx=await page.context().browser().newContext({serviceWorkers:'block',timezoneId:'UTC',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));p.on('pageerror',e=>errors.push(e.message));await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+routes[lang],{waitUntil:'load'});
for(const fixture of cases.filter((x,i)=>lang==='fr'||i%3===0)){await setup(p,fixture);const result=await p.evaluate(()=>AfroBloodPressureCheck.getResult()),exports={};for(const ext of ['txt','pdf']){const dp=p.waitForEvent('download');await p.locator('#download-'+ext).click();const d=await dp,file=output+'/'+lang+'-'+mode+'-'+fixture.id+'.'+ext;await d.saveAs(file);exports[ext]=file;}await p.locator('#urgent-symptoms').setChecked(!fixture.urgent);const afterEdit=await p.evaluate(()=>AfroBloodPressureCheck.getResult()),hidden=await p.locator('#blood-pressure-results').isHidden();if(mode==='patched'&&(afterEdit!==null||!hidden))throw Error('Stale result retained');rows.push({lang,mode,fixture,result,exports,afterEdit,hidden,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors:[...errors]});}await ctx.close();
const ac=await page.context().browser().newContext({serviceWorkers:'block',timezoneId:'UTC'}),ap=await ac.newPage();await ac.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));let release,requestResolve,complete;const gate=new Promise(r=>release=r),requested=new Promise(r=>requestResolve=r),finished=new Promise(r=>complete=r);await ap.route('**/assets/vendor/jspdf/jspdf.umd.min.js',async r=>{requestResolve();await gate;await r.continue();complete();});let downloads=0;ap.on('download',()=>downloads++);await ap.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await ap.goto(baseURL+routes[lang],{waitUntil:'load'});await setup(ap,{});await ap.locator('#download-pdf').click();await requested;await ap.locator('#urgent-symptoms').check();release();await finished;await ap.waitForFunction(()=>!!(window.jspdf&&window.jspdf.jsPDF));await ap.waitForFunction(()=>document.getElementById('export-status').textContent!=='Preparing local PDF...');await ap.waitForTimeout(300);if(downloads!==(mode==='patched'?0:1))throw Error('Delayed PDF count '+mode+downloads);asyncRows.push({lang,mode,downloads,afterEdit:await ap.evaluate(()=>AfroBloodPressureCheck.getResult())});await ac.close();}
return{rows,asyncRows,production:false};
}

module.exports = { malaria, standard_bmi_tb, water, vaccine, antenatal, dose, measurement, blood_pressure };

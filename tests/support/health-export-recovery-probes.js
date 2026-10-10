"use strict";
// Native browser regressions use served source/artifact bytes; no response overrides.
const assert = require("node:assert/strict");

async function childbirth(page, baseURL, outputPath, expected) {
  const source=null,output=outputPath,rows=[];
  for(const mode of ['patched']){
    const ctx=await page.context().browser().newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),p=await ctx.newPage();
    await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));

    await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+'/fr/tools/cout-accouchement/',{waitUntil:'load'});
    for(const age of [0,1,30,31,90,91,101]){
      const quoteDate=await p.evaluate(days=>{const d=new Date();d.setDate(d.getDate()-days);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);},age);
      await p.locator('#quote-date').fill(quoteDate);await p.locator('#currency-code').fill('NGN');await p.locator('#source-type').selectOption('written-provider');
      for(const [id,value]of Object.entries({'planned-care':'200000.50','professional-fees':'50000','medicines-supplies':'25000.25','tests-care':'10000','transport-stay':'15000','contingency':'20000','confirmed-contribution':'100000'}))await p.locator('#'+id).fill(value);
      await p.locator('#childbirth-budget-form button[type=submit]').click();
      await p.locator('#childbirth-budget-results').waitFor({state:'visible'});
      const downloadPromise=p.waitForEvent('download');await p.locator('#download-txt').click();const download=await downloadPromise;
      await download.saveAs(output+'/'+mode+'-'+age+'.txt');
      let pdf=null;
      if(age===1||age===101){const dp=p.waitForEvent('download');await p.locator('#download-pdf').click();const d=await dp;pdf=output+'/'+mode+'-'+age+'.pdf';await d.saveAs(pdf);}
      const badge=await p.locator('#freshness-badge').innerText(),state=await p.locator('#freshness-badge').getAttribute('data-freshness');
      const expected=age<=30?'recent':age<=90?'review-soon':'refresh-required';
      if(state!==expected)throw Error('Freshness category drift');
      if(mode==='patched'&&!/Daté d’il y a|À reconfirmer|Actualisation nécessaire/.test(badge))throw Error('French badge missing: '+badge);
      if(await p.locator('#quote-date').inputValue()!==quoteDate||await p.locator('#planned-care').inputValue()!=='200000.50')throw Error('Input changed');
      rows.push({mode,age,badge,state,household:await p.locator('#household-total').innerText(),pdf,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)});
    }
    await ctx.close();
  }
  return{rows,production:false};
}

async function calorie(page, baseURL, outputPath, expected) {
 const source=null,output=outputPath,rows=[];
 const routes={fr:'/fr/health/calorie-counter/',en:'/health/calorie-counter/',sw:'/sw/zana/kalori-za-vyakula-vya-afrika/'};
 for(const lang of ['fr','en','sw'])for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),p=await ctx.newPage();
  await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));

  await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+routes[lang],{waitUntil:'load'});
  for(const [food,note,amount]of [['Download PDF — café','Clear — étiquette','250'],['Soupe','','1000']]){
   await p.locator('#food-name').fill(food);await p.locator('#source-note').fill(note);await p.locator('#amount').fill(amount);await p.locator('#reference-amount').fill('100');await p.locator('#reference-calories').fill('180');await p.locator('#unit').selectOption('serving');await p.locator('#diary-form button[type=submit]').click();
  }
  const exportFiles=[];
  for(const ext of ['txt','pdf']){const dp=p.waitForEvent('download');await p.locator('#download-'+ext).click();const d=await dp;const file=output+'/'+lang+'-'+mode+'.'+ext;await d.saveAs(file);exportFiles.push(file);}
  const food=await p.locator('#entries-body tr').first().locator('td').nth(0).innerText(),note=await p.locator('#entries-body tr').first().locator('td').nth(2).innerText();
  const stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('afrotools.health.calorieDiary.v2')));
  if(stored[0].foodName!=='Download PDF — café'||stored[0].sourceNote!=='Clear — étiquette')throw Error('Stored input changed');
  if(mode==='patched'&&(food!=='Download PDF — café'||note!=='Clear — étiquette'))throw Error('Visible user text changed');
  await p.reload({waitUntil:'load'});
  if(mode==='patched'&&await p.locator('#entries-body tr').first().locator('td').nth(0).innerText()!=='Download PDF — café')throw Error('Restored food text changed');
  rows.push({lang,mode,food,note,total:await p.locator('#total-calories').innerText(),entries:stored.length,exportFiles,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)});
  await ctx.close();
 }
 return{rows,production:false};
}

async function cycle(page, baseURL, outputPath, expected) {
 const source=null,output=outputPath,rows=[],baseline={};
 const routes={fr:'/fr/tools/calculateur-ovulation/',en:'/tools/ovulation-calc/',sw:'/sw/zana/kikokotoo-ovulation/'};
 for(const lang of ['fr','en','sw'])for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),p=await ctx.newPage();
  await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));

  await p.goto(baseURL+routes[lang],{waitUntil:'load'});
  for(const [shortest,longest]of (lang==='fr'?[[28,30],[24,30],[21,35],[36,40]]:[[28,30]])){
   await p.locator('#last-period-date').fill('2026-10-03');await p.locator('#shortest-cycle').fill(String(shortest));await p.locator('#longest-cycle').fill(String(longest));await p.locator('#cycle-window-form button[type=submit]').click();
   await p.locator('#cycle-window-results').waitFor({state:'visible'});
   const result=await p.evaluate(()=>window.AfroCycleWindow.getResult()),key=lang+'-'+shortest+'-'+longest;
   assert.deepEqual(result, expected.engines[key]);
   const exports=[];for(const ext of ['txt','pdf']){const dp=p.waitForEvent('download');await p.locator('#download-'+ext).click();const d=await dp;const file=output+'/'+key+'-'+mode+'.'+ext;await d.saveAs(file);exports.push(file);}
   rows.push({lang,mode,shortest,longest,result,uncertaintyText:await p.locator('#uncertainty-copy').innerText(),nextPeriod:await p.locator('#next-period-window').innerText(),exports,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)});
  }
  await ctx.close();
 }
 return{rows,engineParity:true,production:false};
}

async function fluid(page, baseURL, outputPath, expected) {
 const pages={},output=outputPath,rows=[];
 const routes={fr:'/fr/tools/apport-eau/',en:'/tools/water-intake/',sw:'/sw/zana/kikokotoo-maji-ya-kunywa/'};
 for(const lang of ['fr','en','sw'])for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];
  await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));
  p.on('pageerror',e=>errors.push(e.message));

  await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+routes[lang],{waitUntil:'load'});
  await p.locator('.drink-volume').nth(0).fill('250');await p.locator('.drink-time').nth(0).fill('08:15');
  await p.locator('.drink-volume').nth(1).fill('350');await p.locator('.drink-type').nth(1).selectOption('tea-coffee');
  await p.locator('#addDrink').click();await p.locator('.drink-volume').nth(2).fill('450');await p.locator('.drink-type').nth(2).selectOption('water');
  for(const target of ['', '1050','1500','500']){
   await p.locator('#clinicalTarget').fill(target);await p.locator('#targetConfirmed').setChecked(!!target);await p.locator('#form button[type=submit]').click();
   if(await p.locator('#txt').isDisabled())throw Error('TXT disabled '+lang+target);
   const key=lang+'-'+mode+'-'+(target||'none'),dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp;const file=output+'/'+key+'.txt';await d.saveAs(file);
   const result=await p.evaluate(()=>FluidLogEngine.total({entries:[...document.querySelectorAll('.entry')].map(row=>({time:row.querySelector('.drink-time').value,type:row.querySelector('.drink-type').value,volumeMl:row.querySelector('.drink-volume').value})),clinicalTargetMl:document.getElementById('clinicalTarget').value,targetConfirmed:document.getElementById('targetConfirmed').checked}));
   rows.push({lang,mode,target,file,result,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors:[...errors]});
  }
  await p.locator('#targetConfirmed').uncheck();await p.locator('#form button[type=submit]').click();if(!await p.locator('#txt').isDisabled())throw Error('Unconfirmed target allowed');
  await p.locator('#clear').click();if(!await p.locator('#txt').isDisabled())throw Error('Clear retained export');
  await ctx.close();
 }
 return {rows,invalidTargetAndClearChecked:true,production:false};
}

async function waist(page, baseURL, outputPath, expected) {
 const pages={},output=outputPath,rows=[],stale=[];
 const routes={fr:'/fr/tools/ratio-taille-hanches/',en:'/tools/waist-hip-ratio/',sw:'/sw/zana/uwiano-wa-kiuno-na-nyonga/'};
 const cases=[{id:'none',applicability:'adult',reference:'none',units:'cm',waist:'80',hip:'100',waist2:'',hip2:''},
 {id:'cross',applicability:'adult',reference:'women',units:'cm',waist:'84',hip:'100',waist2:'86',hip2:'100'},
 {id:'near',applicability:'adult',reference:'women',units:'cm',waist:'85.1',hip:'100',waist2:'',hip2:''},
 {id:'men-below',applicability:'adult',reference:'men',units:'in',waist:'32',hip:'40',waist2:'',hip2:''},
 {id:'men-above',applicability:'adult',reference:'men',units:'cm',waist:'95',hip:'100',waist2:'',hip2:''},
 ...['limited','under18','unsure'].map(applicability=>({id:applicability,applicability,reference:'women',units:'cm',waist:'95',hip:'100',waist2:'',hip2:''}))];
 for(const lang of ['fr','en'])for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];
  await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));p.on('pageerror',e=>errors.push(e.message));

  await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+routes[lang],{waitUntil:'load'});
  for(const input of cases){
   for(const field of ['applicability','reference','units'])await p.locator('#'+field).selectOption(input[field]);
   for(const field of ['waist','hip','waist2','hip2'])await p.locator('#'+field).fill(input[field]);
   await p.locator('#form button[type=submit]').click();if(await p.locator('#txt').isDisabled())throw Error('TXT disabled '+input.id);
   const result=await p.evaluate(input=>WaistHipEngine.calculate({...input,repeatWaist:input.waist2,repeatHip:input.hip2}),input);
   const dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp,file=output+'/'+lang+'-'+mode+'-'+input.id+'.txt';await d.saveAs(file);
   rows.push({lang,mode,input,result,file,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors:[...errors]});
  }
  await p.locator('#waist').fill('80');const disabled=await p.locator('#txt').isDisabled(),printDisabled=await p.locator('#print').isDisabled();
  if(mode==='patched'&&(!disabled||!printDisabled))throw Error('Stale export enabled');
  const proof={lang,mode,disabled,printDisabled};if(mode==='baseline'){const dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp;proof.file=output+'/'+lang+'-stale-baseline.txt';await d.saveAs(proof.file);}stale.push(proof);
  await p.locator('#form button[type=submit]').click();if(await p.locator('#txt').isDisabled())throw Error('Recalculation did not restore export');
  for(const field of ['applicability','reference','units']){await p.locator('#'+field).selectOption(field==='applicability'?'adult':field==='reference'?'men':'in');if(mode==='patched'&&!await p.locator('#txt').isDisabled())throw Error('Select stale '+field);await p.locator('#form button[type=submit]').click();}
  await ctx.close();
 }
 return{rows,stale,production:false};
}

async function blood_pressure(page, baseURL, outputPath, expected) {
 const source=null,output=outputPath,rows=[],asyncRows=[];
 const routes={en:'/tools/blood-pressure/',fr:'/fr/tools/tension-arterielle/',sw:'/sw/zana/shinikizo-la-damu/'};
 const setup=async p=>{for(const [id,value]of Object.entries({'systolic-1':'122','diastolic-1':'78','systolic-2':'128','diastolic-2':'82'}))await p.locator('#'+id).fill(value);for(const id of ['rested','positioned','cuff','quiet'])await p.locator('#'+id).check();await p.locator('#blood-pressure-form button[type=submit]').click();};
 for(const lang of ['en','fr','sw'])for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),p=await ctx.newPage();await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));

  await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+routes[lang],{waitUntil:'load'});await setup(p);const result=await p.evaluate(()=>AfroBloodPressureCheck.getResult()),exports=[];
  for(const ext of ['txt','pdf']){const dp=p.waitForEvent('download');await p.locator('#download-'+ext).click();const d=await dp,file=output+'/'+lang+'-'+mode+'.'+ext;await d.saveAs(file);exports.push(file);}
  await p.locator('#urgent-symptoms').check();const afterEdit=await p.evaluate(()=>AfroBloodPressureCheck.getResult()),editHidden=await p.locator('#blood-pressure-results').isHidden();
  if(mode==='patched'&&(afterEdit!==null||!editHidden))throw Error('Edit retained result');
  await p.locator('#urgent-symptoms').uncheck();await p.locator('#blood-pressure-form button[type=submit]').click();
  await p.evaluate(()=>{document.getElementById('systolic-1').value='1';document.getElementById('blood-pressure-form').requestSubmit();});
  const afterInvalid=await p.evaluate(()=>AfroBloodPressureCheck.getResult()),invalidHidden=await p.locator('#blood-pressure-results').isHidden();if(mode==='patched'&&(afterInvalid!==null||!invalidHidden))throw Error('Invalid submit retained result');
  rows.push({lang,mode,result,exports,afterEdit,editHidden,afterInvalid,invalidHidden,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)});await ctx.close();
  const ac=await page.context().browser().newContext({serviceWorkers:'block'}),ap=await ac.newPage();await ac.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));
  let release,requestedResolve;const gate=new Promise(r=>release=r),requested=new Promise(r=>requestedResolve=r);let completed;
  const finished=new Promise(r=>completed=r);await ap.route('**/assets/vendor/jspdf/jspdf.umd.min.js',async r=>{requestedResolve();await gate;await r.continue();completed();});
  let downloads=0;ap.on('download',()=>downloads++);await ap.goto(baseURL+routes[lang],{waitUntil:'load'});await setup(ap);await ap.locator('#download-pdf').click();await requested;await ap.locator('#urgent-symptoms').check();release();await finished;
  await ap.waitForFunction(()=>!!(window.jspdf&&window.jspdf.jsPDF));await ap.waitForFunction(()=>document.getElementById('export-status').textContent!== 'Preparing local PDF...');
  await ap.waitForTimeout(300);if(downloads!==(mode==='patched'?0:1))throw Error('Delayed PDF count '+mode+downloads);
  asyncRows.push({lang,mode,downloads,afterEdit:await ap.evaluate(()=>AfroBloodPressureCheck.getResult())});await ac.close();
 }
 return{rows,asyncRows,production:false};
}

async function measurement(page, baseURL, outputPath, expected) {
 const pages=[{"id": "bmi", "lang": "en", "route": "/health/bmi-calculator/"}, {"id": "bmi", "lang": "fr", "route": "/fr/health/bmi-calculator/"}, {"id": "bmi", "lang": "sw", "route": "/sw/zana/kikokotoo-bmi/"}, {"id": "diabetes", "lang": "en", "route": "/tools/diabetes-risk/"}, {"id": "diabetes", "lang": "fr", "route": "/fr/tools/risque-diabete/"}, {"id": "diabetes", "lang": "sw", "route": "/sw/zana/hatari-ya-kisukari/"}],output=outputPath,rows=[];
 for(const spec of pages)for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));p.on('pageerror',e=>errors.push(e.message));

  await p.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await p.goto(baseURL+spec.route,{waitUntil:'load'});
  const bmi=spec.id==='bmi',form=bmi?'#form':'#screenForm';
  const inputs=bmi?{height:'170',height2:'171',weight1:'70',weight2:'71'}:{age:'35',height:'170',weight:'70'};
  for(const[id,value]of Object.entries(inputs))await p.locator('#'+id).fill(value);
  if(bmi)await p.locator('#conditions').selectOption('yes');else await p.locator('#sex').selectOption('female');
  await p.locator(form+' button[type=submit]').click();const beforeHtml=await p.locator('#result').innerHTML();
  const dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp,file=output+'/'+spec.id+'-'+spec.lang+'-'+mode+'.txt';await d.saveAs(file);
  const mutations=bmi?[['height','175'],['height2','176'],['weight1','80'],['weight2','81'],['conditions','no']]:[['age','60'],['height','175'],['weight','95'],...['asianAmericanThreshold','gestational','family','pressure','inactive','symptoms','pregnant','previousAbnormal'].map(x=>[x,true]),['sex','male']];
  const edits=[];
  for(const [id,value]of mutations){
   if(typeof value==='boolean')await p.locator('#'+id).check();else if(['conditions','sex'].includes(id))await p.locator('#'+id).selectOption(value);else await p.locator('#'+id).fill(value);
   const disabled=await p.locator('#txt').isDisabled(),printDisabled=await p.locator('#print').isDisabled(),oldResultVisible=await p.locator(bmi?'#result .value':'#result .score').count()>0;
   if(mode==='patched'&&(!disabled||!printDisabled||oldResultVisible))throw Error('Stale result '+spec.id+spec.lang+id);
   if(mode==='baseline'&&edits.length===0){const dp=p.waitForEvent('download');await p.locator('#txt').click();const d=await dp;const file=output+'/'+spec.id+'-'+spec.lang+'-stale.txt';await d.saveAs(file);edits.push({id,disabled,printDisabled,oldResultVisible,staleDownload:file});}else edits.push({id,disabled,printDisabled,oldResultVisible});
   await p.locator(form+' button[type=submit]').click();if(await p.locator('#txt').isDisabled())throw Error('Recalculation failed');
  }
  await p.evaluate(form=>{document.getElementById('height').value='0';document.querySelector(form).requestSubmit();},form);
  const invalidResultVisible=await p.locator(bmi?'#result .value':'#result .score').count()>0;
  if(mode==='patched'&&invalidResultVisible)throw Error('Invalid submit retains visible result');
  rows.push({id:spec.id,lang:spec.lang,mode,file,beforeHtml,edits,invalidResultVisible,invalidExportDisabled:await p.locator('#txt').isDisabled(),overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errors});await ctx.close();
 }
 return{rows,production:false};
}

async function checklist(page, baseURL, outputPath, expected) {
 const pages=[{"id": "malaria-risk", "lang": "en", "route": "/tools/malaria-risk/"}, {"id": "malaria-risk", "lang": "sw", "route": "/sw/zana/hatari-ya-malaria/"}, {"id": "cholera-risk", "lang": "en", "route": "/tools/cholera-risk/"}, {"id": "cholera-risk", "lang": "fr", "route": "/fr/tools/risque-cholera/"}, {"id": "cholera-risk", "lang": "sw", "route": "/sw/zana/hatari-ya-kipindupindu/"}, {"id": "ebola-checklist", "lang": "en", "route": "/tools/ebola-checklist/"}, {"id": "ebola-checklist", "lang": "fr", "route": "/fr/tools/checklist-ebola/"}, {"id": "ebola-checklist", "lang": "sw", "route": "/sw/zana/orodha-ya-ukaguzi-wa-ebola/"}, {"id": "hep-b-screening", "lang": "en", "route": "/tools/hep-b-screening/"}, {"id": "hep-b-screening", "lang": "fr", "route": "/fr/tools/cout-depistage-hepatite-b/"}, {"id": "hep-b-screening", "lang": "sw", "route": "/sw/zana/uchunguzi-wa-hepatitis-b/"}],output=outputPath,rows=[];
 for(const spec of pages)for(const mode of ['patched']){
  const ctx=await page.context().browser().newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];await ctx.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));p.on('pageerror',e=>errors.push(e.message));

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

module.exports = { childbirth, calorie, cycle, fluid, waist, blood_pressure, measurement, checklist };

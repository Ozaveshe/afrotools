const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
test.use({trace:'off',video:'off',screenshot:'off'});
const root=path.resolve(__dirname,'../..'),bundleSource=fs.readFileSync(path.join(root,'scripts/bundle.js'),'utf8');
const declaration=acorn.parse(bundleSource,{ecmaVersion:'latest'}).body.find(node=>node.type==='VariableDeclaration'&&node.declarations.some(d=>d.id.name==='BUNDLE_DEFS')).declarations.find(d=>d.id.name==='BUNDLE_DEFS');
const files=vm.runInNewContext('('+bundleSource.slice(declaration.init.start,declaration.init.end)+')')['tool-page'];
// Source-bundle preview only. Final hashed artifact and production checks remain
// release gates; use the actual bundle owner's ordered inputs and export removal.
const bundle=files.map(file=>fs.readFileSync(path.join(root,file),'utf8').replace(/;\s*export\s*\{[^}]*\}\s*;?/g,';').replace(/export\s*\{[^}]*\}\s*;?/g,'')).join(';\n');


for(const country of ['uganda','tanzania'])for(const fault of ['missing-label','after-result'])test(`PAYE restore recovery ${country}: ${fault}`,async({page,baseURL})=>{
 test.setTimeout(40000);const tz=country==='tanzania',errors=[],writes=[];page.on('pageerror',e=>errors.push(e.name+': '+e.message.slice(0,100)));
 await page.route('**/*',r=>{if(!['GET','HEAD'].includes(r.request().method())){writes.push('write');return r.abort()}return new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort()});
 await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>process.env.AFROTOOLS_TEST_CHART_JS?r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.AFROTOOLS_TEST_CHART_JS)}):r.continue());
 await page.goto(tz?'/tanzania/tz-paye.html':'/uganda/ug-paye.html');const salary=page.locator('#grossSalary');if(tz)await page.locator('#btnPublic').click();await salary.fill('123456');await page.locator('.calc-btn').first().click();await page.locator('.per-btn').nth(1).click();
 const original=await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.buildPayload());expect(original.inputs.period).toBe('annual');if(tz)expect(original.inputs.sector).toBe('public');
 await page.locator('#calcSaveName').fill('Synthetic original');await page.waitForTimeout(350);expect(errors).toEqual([]);expect(await page.evaluate(()=>({hasResult:window.PAYE_CALC_SYNC_ADAPTER.hasResult(),saveEnabled:!document.getElementById('calcSaveBtn').disabled}))).toEqual({hasResult:true,saveEnabled:true});await page.locator('#calcSaveBtn').click();await expect(page.locator('[data-action=load]')).toHaveCount(1);
 if(tz)await page.locator('#btnPrivate').click();await salary.fill('234567');await page.locator('[data-tog=nssf]').click();await page.locator('.calc-btn').first().click();await page.locator('.per-btn').first().click();await page.locator('#calcSaveName').fill('Synthetic unsaved');await page.locator('#calcSaveName').blur();await page.waitForTimeout(350);
 const snapshot=()=>({fields:['grossSalary','salarySlider','calcSaveName'].map(id=>document.getElementById(id).value),period:PERIOD,sector:typeof SECTOR==='undefined'?null:SECTOR,toggle:document.querySelector('[data-tog=nssf]').className,pressed:document.querySelector('[data-tog=nssf]').getAttribute('aria-pressed'),rate:document.querySelector('[data-tog=nssf] .tog-rate')?.textContent,rows:localStorage.getItem('afrotools-saved-'+window.PAYE_CALC_SYNC_CONFIG.storageSlug)});
 const before=await page.evaluate(snapshot);
 await page.evaluate(fault=>{window.__exports=0;window.AfroTools.pdf={generate:()=>window.__exports++};if(fault==='missing-label'){const node=document.getElementById('sliderVal'),marker=document.createComment('test');node.replaceWith(marker);window.__undoFault=()=>marker.replaceWith(node)}else{const node=document.getElementById('resAmount');Object.defineProperty(node,'textContent',{configurable:true,set(){throw Error('Synthetic rendering interruption')}});window.__undoFault=()=>{delete node.textContent}}},fault);
 await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','warning');await page.evaluate(()=>window.__undoFault());expect(await page.evaluate(snapshot)).toEqual(before);
 expect(await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.hasResult())).toBe(false);expect(await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.buildPayload())).toBeNull();await expect(page.locator('#calcSaveBtn')).toBeDisabled();await expect(page.locator('#aiBtn')).toBeDisabled();await expect(page.locator('#resultsCard')).toBeHidden();
 await page.evaluate(()=>window.downloadPdfSummary());expect(await page.evaluate(()=>window.__exports)).toBe(0);
 await page.locator('.calc-btn').first().click();await expect(page.locator('#calcSaveBtn')).toBeEnabled();const draft=await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.buildPayload());expect(draft.inputs.salaryValue).toBe(234567);expect(draft.inputs.period).toBe('monthly');expect(draft.inputs.toggles.nssf).toBe(false);if(tz)expect(draft.inputs.sector).toBe('private');
 await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','info');const reopened=await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.buildPayload());expect(reopened.inputs.salaryValue).toBe(123456);expect(reopened.inputs.period).toBe('annual');if(tz)expect(reopened.inputs.sector).toBe('public');else await expect(page.locator('[data-tog=nssf]')).toHaveAttribute('aria-pressed','true');expect(writes).toEqual([]);expect(errors).toEqual([]);
});

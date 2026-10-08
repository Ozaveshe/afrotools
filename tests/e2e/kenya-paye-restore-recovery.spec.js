const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
test.use({trace:'off',video:'off',screenshot:'off'});
const root=path.resolve(__dirname,'../..'),bundleSource=fs.readFileSync(path.join(root,'scripts/bundle.js'),'utf8');
const declaration=acorn.parse(bundleSource,{ecmaVersion:'latest'}).body.find(node=>node.type==='VariableDeclaration'&&node.declarations.some(d=>d.id.name==='BUNDLE_DEFS')).declarations.find(d=>d.id.name==='BUNDLE_DEFS');
const files=vm.runInNewContext('('+bundleSource.slice(declaration.init.start,declaration.init.end)+')')['tool-page'];
// Source-bundle preview only. Final hashed artifact and production checks remain
// release gates; use the actual bundle owner's ordered inputs and export removal.
const bundle=files.map(file=>fs.readFileSync(path.join(root,file),'utf8').replace(/;\s*export\s*\{[^}]*\}\s*;?/g,';').replace(/export\s*\{[^}]*\}\s*;?/g,'')).join(';\n');


for(const locale of ['en','fr'])for(const fault of ['missing-label','after-result'])test(`Kenya restore recovery ${locale}: ${fault}`,async({page,baseURL})=>{
 test.setTimeout(40000);const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.name+': '+e.message.slice(0,100)));
 await page.route('**/*',r=>{if(!['GET','HEAD'].includes(r.request().method())){writes.push('write');return r.abort()}return new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort()});
 await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.goto(locale==='en'?'/kenya/ke-paye.html':'/fr/kenya/ke-paye.html');const salary=page.locator('#salaryInput');await salary.focus();await salary.fill('123456');await page.locator('.calc-btn').first().click();await page.locator('#calcSaveName').fill('Synthetic original');await page.locator('#calcSaveBtn').click();await expect(page.locator('[data-action=load]')).toHaveCount(1);
 await salary.focus();await salary.fill('234567');await page.locator('[data-tog=pension]').click();await page.locator('#pensionContrib').fill('4000');await page.locator('.calc-btn').first().click();await page.locator('.per-btn').nth(1).click();await page.locator('#calcSaveName').fill('Synthetic unsaved');await page.locator('#calcSaveName').blur();
 // Settle the owner's debounced input calculation before injecting a restore-only fault.
 await page.waitForTimeout(350);
 const snapshot=()=>({fields:['salaryInput','salarySlider','pensionContrib','calcSaveName'].map(id=>document.getElementById(id).value),period:window.PERIOD,toggle:document.querySelector('[data-tog=pension]').className,rows:localStorage.getItem('afrotools-saved-'+window.PAYE_CALC_SYNC_CONFIG.storageSlug)});
 const before=await page.evaluate(snapshot);
 await page.evaluate(fault=>{window.__exports=0;window.AfroTools.pdf={generate:()=>window.__exports++};if(fault==='missing-label'){const node=document.getElementById('sliderVal'),marker=document.createComment('test');node.replaceWith(marker);window.__undoFault=()=>marker.replaceWith(node)}else{const node=document.getElementById('resAmount');Object.defineProperty(node,'textContent',{configurable:true,set(){throw Error('Synthetic rendering interruption')}});window.__undoFault=()=>{delete node.textContent}}},fault);
 await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','warning');await page.evaluate(()=>window.__undoFault());expect(await page.evaluate(snapshot)).toEqual(before);
 expect(await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.hasResult())).toBe(false);expect(await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.buildPayload())).toBeNull();await expect(page.locator('#calcSaveBtn')).toBeDisabled();await expect(page.locator('#aiBtn')).toBeDisabled();await expect(page.locator('#resultsCard')).toBeHidden();
 await page.evaluate(()=>window.downloadPdf());expect(await page.evaluate(()=>window.__exports)).toBe(0);
 await page.locator('.calc-btn').first().click();await expect(page.locator('#calcSaveBtn')).toBeEnabled();const draft=await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.buildPayload());expect(draft.inputs.salaryValue).toBe(234567);expect(draft.inputs.period).toBe('annual');expect(draft.inputs.toggles.pension).toBe(true);
 await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','info');expect(Number((await salary.inputValue()).replace(/[^0-9.-]/g,''))).toBe(123456);expect(writes).toEqual([]);expect(errors).toEqual([]);
});

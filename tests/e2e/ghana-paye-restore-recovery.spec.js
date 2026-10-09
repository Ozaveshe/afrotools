const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
test.use({trace:'off',video:'off',screenshot:'off'});
const root=path.resolve(__dirname,'../..'),bundleSource=fs.readFileSync(path.join(root,'scripts/bundle.js'),'utf8');
const declaration=acorn.parse(bundleSource,{ecmaVersion:'latest'}).body.find(node=>node.type==='VariableDeclaration'&&node.declarations.some(d=>d.id.name==='BUNDLE_DEFS')).declarations.find(d=>d.id.name==='BUNDLE_DEFS');
const files=vm.runInNewContext('('+bundleSource.slice(declaration.init.start,declaration.init.end)+')')['tool-page'];
// Source preview uses the bundle owner inputs. Artifact mode deliberately loads
// the served hashed bundle; production acceptance remains a separate gate.
const bundle=files.map(file=>fs.readFileSync(path.join(root,file),'utf8').replace(/;\s*export\s*\{[^}]*\}\s*;?/g,';').replace(/export\s*\{[^}]*\}\s*;?/g,'')).join(';\n');


for(const locale of ['en','fr'])for(const fault of ['missing-input','after-result'])test(`Ghana restore recovery ${locale}: ${fault}`,async({page,baseURL})=>{
 const route=locale==='en'?'/ghana/gh-paye.html':'/fr/ghana/gh-paye.html',errors=[],writes=[];
 test.setTimeout(35000);page.on('dialog',dialog=>dialog.accept());page.on('pageerror',error=>errors.push(error.name+': '+error.message.slice(0,100)));
 await page.route('**/*',r=>{const url=new URL(r.request().url());if(!['GET','HEAD'].includes(r.request().method())){writes.push(url.pathname);return r.abort()}return url.origin===new URL(baseURL).origin?r.continue():r.abort()});
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.goto(route);const salary=page.locator('#salaryInput');await salary.focus();await salary.fill('123456');await page.locator('#calcBtn').click();await page.locator('#calcSaveName').fill('Synthetic original');await page.locator('#calcSaveBtn').click();await expect(page.locator('[data-action=load]')).toHaveCount(1);
 await page.locator('#modeNet').click();await salary.focus();await salary.fill('234567');await page.locator('#basicSalary').fill('180000');await page.locator('label.tog').filter({has:page.locator('#togMarriage')}).click();await page.locator('#calcBtn').click();await page.locator('#calcSaveName').fill('Synthetic unsaved draft');await page.locator('#bonusAmt').fill('4000');await page.locator('.per-btn[data-period=annual]').click();
 await page.locator('#calcSaveName').focus();
 const before=await page.evaluate(()=>({values:['salaryInput','basicSalary','tier3Amt','bonusAmt','calcSaveName'].map(id=>document.getElementById(id).value),mode:document.getElementById('modeNet').className,marriage:document.getElementById('togMarriage').checked,period:document.querySelector('.per-btn.on').dataset.period,rows:localStorage.getItem('afrotools-saved-'+window.PAYE_CALC_SYNC_CONFIG.storageSlug)}));
 await page.evaluate(fault=>{
  window.__exports=0;window.AfroTools.pdf={generate:()=>window.__exports++};
  if(fault==='missing-input'){const node=document.getElementById('bonusAmt'),marker=document.createComment('restore-test');node.replaceWith(marker);window.__undoFault=()=>marker.replaceWith(node)}
  else {const node=document.getElementById('resAmount');Object.defineProperty(node,'textContent',{configurable:true,set(){throw Error('Synthetic interrupted rendering')}});window.__undoFault=()=>{delete node.textContent}}
 },fault);
 await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','warning');await page.evaluate(()=>window.__undoFault());
 expect(await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.hasResult())).toBe(false);expect(await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.buildPayload())).toBeNull();
 await expect(page.locator('#calcSaveBtn')).toBeDisabled();await expect(page.locator('#aiBtn')).toBeDisabled();await expect(page.locator('#resultsCard')).toBeHidden();await expect(page.locator('#bonusCard')).toBeHidden();
 const after=await page.evaluate(()=>({values:['salaryInput','basicSalary','tier3Amt','bonusAmt','calcSaveName'].map(id=>document.getElementById(id).value),mode:document.getElementById('modeNet').className,marriage:document.getElementById('togMarriage').checked,period:document.querySelector('.per-btn.on').dataset.period,rows:localStorage.getItem('afrotools-saved-'+window.PAYE_CALC_SYNC_CONFIG.storageSlug)}));expect(after).toEqual(before);
 await page.evaluate(()=>window.exportPdf());expect(await page.evaluate(()=>window.__exports)).toBe(0);
 await page.locator('#calcBtn').click();await expect(page.locator('#calcSaveBtn')).toBeEnabled();await expect(page.locator('#bonusCard')).not.toHaveAttribute('aria-hidden','true');const recalculated=await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.buildPayload());expect(recalculated.inputs.mode).toBe('net');expect(recalculated.inputs.period).toBe('annual');expect(recalculated.inputs.toggles.marriage).toBe(true);expect(recalculated.inputs.salaryValue).toBe(234567);
 await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','info');expect(Number((await salary.inputValue()).replace(/,/g,''))).toBe(123456);
 expect(writes).toEqual([]);expect(errors).toEqual([]);
});

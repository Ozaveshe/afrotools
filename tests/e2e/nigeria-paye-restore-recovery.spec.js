const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
test.use({trace:'off',video:'off',screenshot:'off'});
const root=path.resolve(__dirname,'../..'),bundleSource=fs.readFileSync(path.join(root,'scripts/bundle.js'),'utf8');
const declaration=acorn.parse(bundleSource,{ecmaVersion:'latest'}).body.find(node=>node.type==='VariableDeclaration'&&node.declarations.some(d=>d.id.name==='BUNDLE_DEFS')).declarations.find(d=>d.id.name==='BUNDLE_DEFS');
const files=vm.runInNewContext('('+bundleSource.slice(declaration.init.start,declaration.init.end)+')')['tool-page'];
// Source-bundle preview only. Final hashed artifact and production checks remain
// release gates; use the actual bundle owner's ordered inputs and export removal.
const bundle=files.map(file=>fs.readFileSync(path.join(root,file),'utf8').replace(/;\s*export\s*\{[^}]*\}\s*;?/g,';').replace(/export\s*\{[^}]*\}\s*;?/g,'')).join(';\n');



for(const [locale,route] of [['en','/nigeria/ng-salary-tax.html'],['fr','/fr/nigeria/ng-salary-tax.html'],['ha','/ha/najeriya/harajin-albashi/']])for(const fault of ['missing-label','after-result'])for(const version of ['current','legacy'])test(`Nigeria restore recovery ${locale}: ${fault} ${version}`,async({page,baseURL})=>{
 test.setTimeout(40000);const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.name));
 await page.route('**/*',r=>{if(!['GET','HEAD'].includes(r.request().method())){writes.push('write');return r.abort()}return new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort()});
 await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>process.env.AFROTOOLS_TEST_CHART_JS?r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.AFROTOOLS_TEST_CHART_JS)}):r.continue());
 await page.goto(route);const salary=page.locator('#grossSalary');await salary.focus();await salary.fill('1234567');await page.locator('.calc-btn').first().click();await page.locator('#calcSaveBtn').click();await expect(page.locator('[data-action=load]')).toHaveCount(1);
 if(version==='legacy')await page.evaluate(()=>{const key='afrotools-saved-'+(window.PAYE_CALC_SYNC_CONFIG?.storageSlug||'ng-salary-tax'),rows=JSON.parse(localStorage.getItem(key));rows[0].data={grossSalary:'1234567',_mode:'gross'};localStorage.setItem(key,JSON.stringify(rows))});
 await page.locator('.mode-toggle').first().locator('.mode-btn').nth(1).click();await page.locator('#periodMonthly').click();await page.locator('#tabNta').click();await salary.focus();await salary.fill('500000');await page.locator('[data-tog=pension]').click();await page.locator('.calc-btn').first().click();await page.locator('.per-btn').nth(1).click();await page.locator('#calcSaveName').fill('Synthetic draft');await page.locator('#calcSaveName').blur();await page.waitForTimeout(350);
 const snapshot=()=>({values:['grossSalary','salarySlider','nhisRate','annualRent','calcSaveName'].map(id=>document.getElementById(id).value),state:[CALC_MODE,SALARY_PERIOD,REGIME,PERIOD],toggle:document.querySelector('[data-tog=pension]').className,label:document.getElementById('salaryLabel').textContent,sliderLabel:document.getElementById('sliderVal').textContent,rows:localStorage.getItem('afrotools-saved-'+(window.PAYE_CALC_SYNC_CONFIG?.storageSlug||'ng-salary-tax'))});const before=await page.evaluate(snapshot);
 await page.evaluate(fault=>{window.__exports=0;window.AfroTools.pdf={generate:()=>window.__exports++};if(fault==='missing-label'){const node=document.getElementById('sliderVal'),marker=document.createComment('test');node.replaceWith(marker);window.__undoFault=()=>marker.replaceWith(node)}else{const node=document.getElementById('resAmount');Object.defineProperty(node,'textContent',{configurable:true,set(){throw Error('Synthetic rendering interruption')}});window.__undoFault=()=>{delete node.textContent}}},fault);
 await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','warning');await page.evaluate(()=>window.__undoFault());expect(await page.evaluate(snapshot)).toEqual(before);
 expect(await page.evaluate(()=>RESULT===null&&window.RESULT===null)).toBe(true);await expect(page.locator('#calcSaveBtn')).toBeDisabled();await expect(page.locator('#aiBtn')).toBeDisabled();await expect(page.locator('#resultsCard')).toBeHidden();await page.evaluate(()=>window.downloadPdf());expect(await page.evaluate(()=>window.__exports)).toBe(0);
 await page.locator('.calc-btn').first().click();await expect(page.locator('#resultsCard')).toBeVisible();await expect(page.locator('#calcSaveBtn')).toBeEnabled();expect(await page.evaluate(()=>[CALC_MODE,SALARY_PERIOD,REGIME,PERIOD])).toEqual(before.state);
 await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','info');await expect(page.locator('#resultsCard')).toBeVisible();expect(Number((await salary.inputValue()).replace(/[^0-9.-]/g,''))).toBe(1234567);expect(writes).toEqual([]);expect(errors).toEqual([]);
});

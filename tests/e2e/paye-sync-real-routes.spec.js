const chartFixture = process.env.AFROTOOLS_TEST_CHART_JS || require('node:path').resolve(__dirname, '../fixtures/chart-4.4.1-test-fixture.js');
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
test.use({trace:'off',video:'off',screenshot:'off'});
const root=path.resolve(__dirname,'../..'),bundleSource=fs.readFileSync(path.join(root,'scripts/bundle.js'),'utf8');
const declaration=acorn.parse(bundleSource,{ecmaVersion:'latest'}).body.find(node=>node.type==='VariableDeclaration'&&node.declarations.some(d=>d.id.name==='BUNDLE_DEFS')).declarations.find(d=>d.id.name==='BUNDLE_DEFS');
const files=vm.runInNewContext('('+bundleSource.slice(declaration.init.start,declaration.init.end)+')')['tool-page'];
// Source preview uses the bundle owner inputs. Artifact mode deliberately loads
// the served hashed bundle; production acceptance remains a separate gate.
const bundle=files.map(file=>fs.readFileSync(path.join(root,file),'utf8').replace(/;\s*export\s*\{[^}]*\}\s*;?/g,';').replace(/export\s*\{[^}]*\}\s*;?/g,'')).join(';\n');

const routes=['/nigeria/ng-salary-tax.html','/fr/nigeria/ng-salary-tax.html','/ghana/gh-paye.html','/fr/ghana/gh-paye.html','/kenya/ke-paye.html','/fr/kenya/ke-paye.html','/uganda/ug-paye.html','/tanzania/tz-paye.html','/south-africa/za-paye.html','/ha/najeriya/harajin-albashi/'];
for(const route of routes)test('modern PAYE real page restore: '+route,async({page,baseURL})=>{
 test.setTimeout(40000);const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.name+': '+e.message.slice(0,140)));await page.setViewportSize({width:390,height:844});
 await page.route('**/*',r=>{const req=r.request(),url=new URL(req.url());if(!['GET','HEAD'].includes(req.method())){writes.push(url.pathname);return r.fulfill({status:403,contentType:'application/json',body:'{}'})}return url.origin===new URL(baseURL).origin?r.continue():r.abort()});
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>chartFixture?r.fulfill({contentType:'application/javascript',body:fs.readFileSync(chartFixture)}):r.continue());
 await page.goto(route);const salary=page.locator('#grossSalary,#salaryInput').first();await salary.focus();await salary.fill('123456');expect(Number((await salary.inputValue()).replace(/[^0-9.-]/g,''))).toBe(123456);await page.locator('.calc-btn').first().click();await expect(page.locator('#calcSaveBtn')).toBeEnabled();
 await page.locator('#calcSaveName').fill('Synthetic restore proof');await page.locator('#calcSaveBtn').click();await expect(page.locator('#calcSavedList [data-action=load]')).toHaveCount(1);
 await salary.focus();await salary.fill('234567');await page.locator('#calcSavedList [data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','info');expect(Number((await salary.inputValue()).replace(/[^0-9.-]/g,''))).toBe(123456);
 if(['/ghana/gh-paye.html','/fr/ghana/gh-paye.html','/south-africa/za-paye.html'].includes(route)){
  await page.evaluate(()=>{const config=window.PAYE_CALC_SYNC_CONFIG;window.__legacyKey='afrotools-saved-'+config.storageSlug;const data={salaryInput:'123,456'};localStorage.setItem(window.__legacyKey,JSON.stringify([{id:'legacy',title:'Synthetic legacy',data,createdAt:1,updatedAt:1}]));window.dispatchEvent(new StorageEvent('storage',{key:window.__legacyKey}));});
  await expect(page.locator('#calcSavedList [data-save-id=legacy][data-action=load]')).toHaveCount(1);await salary.focus();await salary.fill('234567');await page.locator('#calcSavedList [data-save-id=legacy][data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','info');expect(Number((await salary.inputValue()).replace(/[^0-9.-]/g,''))).toBe(123456);
  await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem(window.__legacyKey));rows[0].data.salaryInput='not a salary';localStorage.setItem(window.__legacyKey,JSON.stringify(rows));});await salary.focus();await salary.fill('234567');await page.locator('#calcSavedList [data-save-id=legacy][data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','warning');expect(Number((await salary.inputValue()).replace(/[^0-9.-]/g,''))).toBe(234567);await page.locator('#calcBtn,.calc-btn').first().click();
 }
 if(route==='/fr/ghana/gh-paye.html'){
  const toggles=page.locator('label.tog input[type=checkbox]');await expect(toggles).toHaveCount(9);
  for(let index=0;index<9;index++){
   const toggle=toggles.nth(index);expect(await toggle.getAttribute('hidden')).toBeNull();expect(await toggle.getAttribute('aria-label')).not.toMatch(/^Tog/);
   await toggle.focus();await expect(toggle).toBeFocused();const checked=await toggle.isChecked();await toggle.press('Space');expect(await toggle.isChecked()).toBe(!checked);
   const geometry=await toggle.evaluate(el=>{const label=el.closest('label'),box=label.getBoundingClientRect();return {height:box.height,width:box.width,outline:getComputedStyle(label).outlineStyle}});
   expect(geometry.height).toBeGreaterThanOrEqual(44);expect(geometry.width).toBeGreaterThanOrEqual(44);expect(geometry.outline).toBe('solid');
  }
  await page.locator('#calcBtn').click();await page.evaluate(()=>{window.__whatsappCalls=0;window.AfroTools.shareState.whatsappShare=()=>{window.__whatsappCalls++}});page.once('dialog',d=>d.accept());await page.locator('#waBtn').click();expect(await page.evaluate(()=>window.__whatsappCalls)).toBe(1);

  await page.evaluate(()=>{window.__eventKeys=[];window.gtag=(type,name,meta)=>{if(name==='gh_paye_calculate')window.__eventKeys.push(Object.keys(meta).sort())};window.__exports=0;window.AfroTools.pdf={generate:()=>{window.__exports++}}});
  for(const control of ['#togMarriage','#basicSalary','#modeNet']){
   if(control==='#basicSalary')await page.locator(control).fill('60000');else if(control==='#togMarriage')await page.locator('label.tog').filter({has:page.locator(control)}).click();else await page.locator(control).click();
   await expect(page.locator('#resultsCard')).toBeHidden();await expect(page.locator('#calcSaveBtn')).toBeDisabled();
   expect(await page.evaluate(()=>window.PAYE_CALC_SYNC_ADAPTER.buildPayload())).toBeNull();
   await page.evaluate(()=>window.exportPdf());expect(await page.evaluate(()=>window.__exports)).toBe(0);
   await page.locator('#calcBtn').click();await expect(page.locator('#resultsCard')).toBeVisible();await expect(page.locator('#calcSaveBtn')).toBeEnabled();
  }
  expect(await page.evaluate(()=>window.__eventKeys)).toEqual(Array(3).fill(['country_code','mode','tool_id']));
  await page.evaluate(()=>window.exportPdf());expect(await page.evaluate(()=>window.__exports)).toBe(1);
  await salary.focus();await salary.fill('');await expect(page.locator('#resultsCard')).toBeHidden();await expect(page.locator('#calcSaveBtn')).toBeDisabled();await salary.press('Enter');await expect(page.locator('#resultsCard')).toBeHidden();
 }
 if(route.startsWith('/ha/'))await expect(page.locator('#calcSaveStatus')).toHaveText('An loda lissafin da aka ajiye.');
 expect(writes).toEqual([]);expect(errors).toEqual([]);
});

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


for(const [locale,route] of [['en','/nigeria/ng-salary-tax.html'],['fr','/fr/nigeria/ng-salary-tax.html'],['ha','/ha/najeriya/harajin-albashi/']])test('Nigeria saved settings round trip '+locale,async({page,baseURL})=>{
 test.setTimeout(40000);const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.name));
 await page.route('**/*',r=>{if(!['GET','HEAD'].includes(r.request().method())){writes.push('write');return r.abort()}return new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort()});
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>chartFixture?r.fulfill({contentType:'application/javascript',body:fs.readFileSync(chartFixture)}):r.continue());
 await page.goto(route);await page.locator('.mode-toggle').first().locator('.mode-btn').nth(1).click();await page.locator('#periodMonthly').click();await page.locator('#tabNta').click();const salary=page.locator('#grossSalary');await salary.focus();await salary.fill('500000');await page.locator('.calc-btn').first().click();await page.locator('.per-btn').nth(1).click();await page.waitForTimeout(350);await page.locator('#calcSaveBtn').click();await expect(page.locator('[data-action=load]')).toHaveCount(1);
 const expected={calcMode:'net',salaryPeriod:'monthly',regime:'nta',period:'annual'};
 const record=await page.evaluate(()=>{window.__scenarioKey='afrotools-saved-'+(window.PAYE_CALC_SYNC_CONFIG?.storageSlug||'ng-salary-tax');const raw=localStorage.getItem(window.__scenarioKey),inputs=JSON.parse(raw)[0].data.inputs;return {raw,settings:{calcMode:inputs.calcMode,salaryPeriod:inputs.salaryPeriod,regime:inputs.regime,period:inputs.period}}});expect(record.settings).toEqual(expected);
 await page.locator('.mode-toggle').first().locator('.mode-btn').first().click();await page.locator('#periodAnnual').click();await page.locator('#tabPita').click();await salary.focus();await salary.fill('6000000');await page.locator('.calc-btn').first().click();await page.locator('.per-btn').first().click();
 await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','info');expect(await page.evaluate(()=>({calcMode:CALC_MODE,salaryPeriod:SALARY_PERIOD,regime:REGIME,period:PERIOD}))).toEqual(expected);expect(Number((await salary.inputValue()).replace(/[^0-9.-]/g,''))).toBe(500000);
 expect(await page.evaluate(()=>localStorage.getItem(window.__scenarioKey))).toBe(record.raw);expect(writes).toEqual([]);expect(errors).toEqual([]);
});

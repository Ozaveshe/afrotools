const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
test.use({trace:'off',video:'off',screenshot:'off'});
const root=path.resolve(__dirname,'../..'),bundleSource=fs.readFileSync(path.join(root,'scripts/bundle.js'),'utf8');
const declaration=acorn.parse(bundleSource,{ecmaVersion:'latest'}).body.find(node=>node.type==='VariableDeclaration'&&node.declarations.some(d=>d.id.name==='BUNDLE_DEFS')).declarations.find(d=>d.id.name==='BUNDLE_DEFS');
const files=vm.runInNewContext('('+bundleSource.slice(declaration.init.start,declaration.init.end)+')')['tool-page'];
// Source-bundle preview only. Final hashed artifact and production checks remain
// release gates; use the actual bundle owner's ordered inputs and export removal.
const bundle=files.map(file=>fs.readFileSync(path.join(root,file),'utf8').replace(/;\s*export\s*\{[^}]*\}\s*;?/g,';').replace(/export\s*\{[^}]*\}\s*;?/g,'')).join(';\n');

const routes=['/nigeria/ng-salary-tax.html','/fr/nigeria/ng-salary-tax.html','/ghana/gh-paye.html','/fr/ghana/gh-paye.html','/kenya/ke-paye.html','/fr/kenya/ke-paye.html','/uganda/ug-paye.html','/tanzania/tz-paye.html','/south-africa/za-paye.html','/ha/najeriya/harajin-albashi/'];
for(const route of routes)test('modern PAYE real page restore: '+route,async({page,baseURL})=>{
 test.setTimeout(25000);const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.name+': '+e.message.slice(0,140)));await page.setViewportSize({width:390,height:844});
 await page.route('**/*',r=>{const req=r.request(),url=new URL(req.url());if(!['GET','HEAD'].includes(req.method())){writes.push(url.pathname);return r.fulfill({status:403,contentType:'application/json',body:'{}'})}return url.origin===new URL(baseURL).origin?r.continue():r.abort()});
 await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>process.env.AFROTOOLS_TEST_CHART_JS?r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.AFROTOOLS_TEST_CHART_JS)}):r.continue());
 await page.goto(route);const salary=page.locator('#grossSalary,#salaryInput').first();await salary.focus();await salary.fill('123456');expect(Number((await salary.inputValue()).replace(/[^0-9.-]/g,''))).toBe(123456);await page.locator('.calc-btn').first().click();await expect(page.locator('#calcSaveBtn')).toBeEnabled();
 await page.locator('#calcSaveName').fill('Synthetic restore proof');await page.locator('#calcSaveBtn').click();await expect(page.locator('#calcSavedList [data-action=load]')).toHaveCount(1);
 await salary.focus();await salary.fill('234567');await page.locator('#calcSavedList [data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toHaveAttribute('data-tone','info');expect(Number((await salary.inputValue()).replace(/[^0-9.-]/g,''))).toBe(123456);
 if(route.startsWith('/ha/'))await expect(page.locator('#calcSaveStatus')).toHaveText('An loda lissafin da aka ajiye.');
 expect(writes).toEqual([]);expect(errors).toEqual([]);
});

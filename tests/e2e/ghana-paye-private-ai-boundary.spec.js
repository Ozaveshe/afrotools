const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
test.use({trace:'off',video:'off',screenshot:'off'});
const root=path.resolve(__dirname,'../..'),bundleSource=fs.readFileSync(path.join(root,'scripts/bundle.js'),'utf8');
const declaration=acorn.parse(bundleSource,{ecmaVersion:'latest'}).body.find(node=>node.type==='VariableDeclaration'&&node.declarations.some(d=>d.id.name==='BUNDLE_DEFS')).declarations.find(d=>d.id.name==='BUNDLE_DEFS');
const files=vm.runInNewContext('('+bundleSource.slice(declaration.init.start,declaration.init.end)+')')['tool-page'];
// Source-bundle preview only. Final hashed artifact and production checks remain
// release gates; use the actual bundle owner's ordered inputs and export removal.
const bundle=files.map(file=>fs.readFileSync(path.join(root,file),'utf8').replace(/;\s*export\s*\{[^}]*\}\s*;?/g,';').replace(/export\s*\{[^}]*\}\s*;?/g,'')).join(';\n');


const coreFiles=vm.runInNewContext('('+bundleSource.slice(declaration.init.start,declaration.init.end)+')').core;
const coreBundle=coreFiles.map(file=>fs.readFileSync(path.join(root,file),'utf8').replace(/;\s*export\s*\{[^}]*\}\s*;?/g,';').replace(/export\s*\{[^}]*\}\s*;?/g,'')).join(';\n');
for(const route of ['/ghana/gh-paye.html','/fr/ghana/gh-paye.html'])test('Ghana AI requires fresh private-content consent and discards stale response: '+route,async({page,baseURL})=>{
 test.setTimeout(30000);const errors=[];page.on('pageerror',()=>errors.push('pageerror'));let allow=false,dialogs=0,preview=false,sends=0,headers;
 page.on('dialog',async dialog=>{dialogs++;preview=dialog.message().includes('123,456')&&dialog.message().includes('gh-paye');await (allow?dialog.accept():dialog.dismiss())});
 await page.addInitScript(()=>{localStorage.setItem('afrotools_ai_advisor_consent','accepted');localStorage.setItem('afrotools_ai_consent_ai_optional_content_included_gh-paye','accepted')});
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 await page.route('**/assets/js/bundles/core.*',r=>r.fulfill({contentType:'application/javascript',body:coreBundle}));
 await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>process.env.AFROTOOLS_TEST_CHART_JS?r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.AFROTOOLS_TEST_CHART_JS)}):r.continue());
 let release,started;const pending=new Promise(resolve=>release=resolve),requested=new Promise(resolve=>started=resolve);
 await page.route('**/.netlify/functions/ai-advisor',async r=>{sends++;headers=r.request().headers();started();await pending;await r.fulfill({contentType:'application/json',body:'{"text":"Synthetic delayed advice"}'})});
 await page.goto(route);await page.locator('#salaryInput').focus();await page.locator('#salaryInput').fill('123456');await page.locator('#calcBtn').click();
 await page.locator('#aiBtn').click();await expect(page.locator('#aiBtn')).toBeEnabled();expect(dialogs).toBe(1);expect(preview).toBe(true);expect(sends).toBe(0);await expect(page.locator('#resultsCard')).toBeVisible();
 allow=true;await page.locator('#aiBtn').click();await requested;expect(dialogs).toBe(2);expect(headers['x-afrotools-ai-content-consent']).toBe('accepted');expect(headers['x-afrotools-ai-consent']).toBe('accepted');
 await page.locator('#basicSalary').fill('60000');await expect(page.locator('#resultsCard')).toBeHidden();const response=page.waitForResponse(r=>r.url().includes('/.netlify/functions/ai-advisor'));release();await (await response).finished();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await expect(page.locator('#aiResp')).toBeHidden();await expect(page.locator('#aiResp')).toHaveText('');await expect(page.locator('#aiBtn')).toBeDisabled();await expect(page.locator('#aiChat')).not.toHaveClass(/\bon\b/);expect(errors).toEqual([]);
});

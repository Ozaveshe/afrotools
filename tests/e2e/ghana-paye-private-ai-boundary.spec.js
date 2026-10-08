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


const coreFiles=vm.runInNewContext('('+bundleSource.slice(declaration.init.start,declaration.init.end)+')').core;
const coreBundle=coreFiles.map(file=>fs.readFileSync(path.join(root,file),'utf8').replace(/;\s*export\s*\{[^}]*\}\s*;?/g,';').replace(/export\s*\{[^}]*\}\s*;?/g,'')).join(';\n');
for(const route of ['/ghana/gh-paye.html','/fr/ghana/gh-paye.html'])test('Ghana AI requires fresh private-content consent and discards stale response: '+route,async({page,baseURL})=>{
 test.setTimeout(30000);const errors=[];page.on('pageerror',()=>errors.push('pageerror'));let allow=false,dialogs=0,preview=false,sends=0,headers;
 page.on('dialog',async dialog=>{dialogs++;preview=dialog.message().includes('123,456')&&dialog.message().includes('gh-paye');await (allow?dialog.accept():dialog.dismiss())});
 await page.addInitScript(()=>{localStorage.setItem('afrotools_ai_advisor_consent','accepted');localStorage.setItem('afrotools_ai_consent_ai_optional_content_included_gh-paye','accepted')});
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/core.*',r=>r.fulfill({contentType:'application/javascript',body:coreBundle}));
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>chartFixture?r.fulfill({contentType:'application/javascript',body:fs.readFileSync(chartFixture)}):r.continue());
 let release,started;const pending=new Promise(resolve=>release=resolve),requested=new Promise(resolve=>started=resolve);
 await page.route('**/.netlify/functions/ai-advisor',async r=>{sends++;headers=r.request().headers();started();await pending;await r.fulfill({contentType:'application/json',body:'{"text":"Synthetic delayed advice"}'})});
 await page.goto(route);await page.locator('#salaryInput').focus();await page.locator('#salaryInput').fill('123456');await page.locator('#calcBtn').click();
 await page.locator('#aiBtn').click();await expect(page.locator('#aiBtn')).toBeEnabled();expect(dialogs).toBe(1);expect(preview).toBe(true);expect(sends).toBe(0);await expect(page.locator('#resultsCard')).toBeVisible();
 allow=true;await page.locator('#aiBtn').click();await requested;expect(dialogs).toBe(2);expect(headers['x-afrotools-ai-content-consent']).toBe('accepted');expect(headers['x-afrotools-ai-consent']).toBe('accepted');
 await page.locator('#basicSalary').fill('60000');await expect(page.locator('#resultsCard')).toBeHidden();const response=page.waitForResponse(r=>r.url().includes('/.netlify/functions/ai-advisor'));release();await (await response).finished();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await expect(page.locator('#aiResp')).toBeHidden();await expect(page.locator('#aiResp')).toHaveText('');await expect(page.locator('#aiBtn')).toBeDisabled();await expect(page.locator('#aiChat')).not.toHaveClass(/\bon\b/);expect(errors).toEqual([]);
});

for(const route of ['/ghana/gh-paye.html','/fr/ghana/gh-paye.html'])test('Ghana chat preserves drafts across refusal, failure and concurrent edits: '+route,async({page,baseURL})=>{
 test.setTimeout(40000);const errors=[];page.on('pageerror',()=>errors.push('pageerror'));let allow=true,sends=0,mode='success',release;
 page.on('dialog',d=>allow?d.accept():d.dismiss());
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/core.*',r=>r.fulfill({contentType:'application/javascript',body:coreBundle}));
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>chartFixture?r.fulfill({contentType:'application/javascript',body:fs.readFileSync(chartFixture)}):r.continue());
 await page.route('**/.netlify/functions/ai-advisor',async r=>{sends++;if(mode==='hold')await new Promise(resolve=>release=resolve);await r.fulfill({status:mode==='fail'?503:200,contentType:'application/json',body:'{"text":"Synthetic reply"}'})});
 await page.goto(route);await page.locator('#salaryInput').focus();await page.locator('#salaryInput').fill('123456');await page.locator('#calcBtn').click();await page.locator('#aiBtn').click();await expect(page.locator('#aiChat')).toHaveClass(/\bon\b/);expect(sends).toBe(1);
 const input=page.locator('#chatIn'),send=page.locator('#aiChat .chat-send');await input.fill('Synthetic follow-up');allow=false;await input.press('Enter');await expect(send).toBeEnabled();await expect(page.locator('#chatStatus')).toContainText(route.startsWith('/fr/')?'Aucun envoi':'Nothing sent');await expect(input).toHaveValue('Synthetic follow-up');expect(sends).toBe(1);
 allow=true;mode='fail';await send.click();await expect(page.locator('#chatStatus')).toContainText(route.startsWith('/fr/')?'Réponse indisponible':'Reply unavailable');await expect(input).toHaveValue('Synthetic follow-up');expect(sends).toBe(2);
 mode='hold';await input.press('Enter');await expect(send).toBeDisabled();await input.press('Enter');await input.fill('New unsent question');expect(sends).toBe(3);release();await expect(send).toBeEnabled();await expect(input).toHaveValue('New unsent question');await expect(page.locator('#chatMsgs')).toContainText('Synthetic reply');
 mode='success';await send.click();await expect(input).toHaveValue('');expect(sends).toBe(4);expect(errors).toEqual([]);
});

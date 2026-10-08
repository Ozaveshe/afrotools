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
const apps=[{locale:'en',slug:'eg-paye',route:'/egypt/eg-paye.html',input:'#grossSalary'},{locale:'fr',slug:'cm-paye',route:'/fr/cameroon/cm-paye.html',input:'#grossSalary'},{locale:'sw',slug:'gh-paye',route:'/sw/ghana/kikokotoo-kodi-mshahara/',input:'#salaryInput'}];
const copy={en:{write:'not saved',invalid:'unreadable',read:'cannot be read'},fr:{write:'pas été enregistrée',invalid:'illisibles',read:'Impossible de lire'},sw:{write:'hayajahifadhiwa',invalid:'haisomeki',read:'haviwezi kusomwa'}};
async function open(page,baseURL,app,raw){
 const errors=[];page.on('pageerror',()=>errors.push('pageerror'));page.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic saved scenario':undefined));await page.setViewportSize({width:390,height:844});
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 // The product currently depends on this exact public Chart.js version.
 // A cached original can make storage tests deterministic without claiming an offline repair.
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>chartFixture?r.fulfill({contentType:'application/javascript',body:fs.readFileSync(chartFixture)}):r.continue());
 await page.addInitScript(({key,raw})=>{if(raw!==undefined)localStorage.setItem(key,raw)},{key:'afrotools-saved-'+app.slug,raw});await page.goto(app.route);await page.locator('.calc-btn').first().click();await expect(page.locator('#payeSaveBtn')).toBeVisible();return errors;
}
async function raw(page,app){return page.evaluate(k=>localStorage.getItem(k),'afrotools-saved-'+app.slug)}
async function deny(page,app,read=false){await page.evaluate(({key,read})=>{const method=read?'getItem':'setItem',original=Storage.prototype[method];window.attempts=0;if(read)window.originalRead=()=>original.call(localStorage,key);Storage.prototype[method]=function(name,value){if(name===key){window.attempts++;throw Error('Synthetic failure')}return original.call(this,name,value)};window.restoreStorage=()=>Storage.prototype[method]=original},{key:'afrotools-saved-'+app.slug,read})}
for(const app of apps){
 test(app.locale+' legacy PAYE: failed save retains previous entries and permits retry',async({page,baseURL})=>{
  const errors=await open(page,baseURL,app);await page.locator('#payeSaveBtn').click();const before=await raw(page,app);await deny(page,app);await page.locator('#payeSaveBtn').click();await expect(page.locator('#payeStorageStatus')).toContainText(copy[app.locale].write);expect(await raw(page,app)).toBe(before);expect(await page.evaluate(()=>window.attempts)).toBe(1);await expect(page.locator('#payeSaveBtn')).toHaveText({en:'Save This Calculation',fr:'Enregistrer ce calcul',sw:'Hifadhi hesabu hii'}[app.locale]);await page.evaluate(()=>window.restoreStorage());await page.locator('#payeSaveBtn').click();expect(JSON.parse(await raw(page,app))).toHaveLength(2);await expect(page.locator('#payeStorageStatus')).toHaveCount(0);expect(errors).toEqual([]);
 });
 test(app.locale+' legacy PAYE: corrupt collection preserves calculator and original bytes',async({page,baseURL})=>{
  const errors=await open(page,baseURL,app,'{broken');await expect(page.locator('#payeStorageStatus')).toContainText(copy[app.locale].invalid);await page.locator('#payeSaveBtn').click();expect(await raw(page,app)).toBe('{broken');await expect(page.locator(app.input)).toBeEditable();expect(errors).toEqual([]);
 });
 test(app.locale+' legacy PAYE: saved fields reopen and failed deletion retains the card',async({page,baseURL})=>{
  const errors=await open(page,baseURL,app);await page.locator(app.input).fill('123456');await page.locator('#payeSaveBtn').click();await page.locator(app.input).fill('654321');await page.locator('.paye-open-btn').click();await expect.poll(()=>page.locator(app.input).inputValue()).toMatch(/123.?456/);const before=await raw(page,app);await deny(page,app);await page.locator('.paye-del-btn').click();await expect(page.locator('#payeStorageStatus')).toContainText(copy[app.locale].write);expect(await raw(page,app)).toBe(before);await expect(page.locator('.paye-saved-card')).toHaveCount(1);await page.evaluate(()=>window.restoreStorage());await page.locator('.paye-del-btn').click();await expect(page.locator('.paye-saved-card')).toHaveCount(0);await expect(page.locator('#payeSaveBtn')).toBeFocused();expect(errors).toEqual([]);
 });
 test(app.locale+' legacy PAYE: read failure never replaces current inputs',async({page,baseURL})=>{
  const errors=await open(page,baseURL,app);await page.locator('#payeSaveBtn').click();await page.locator(app.input).fill('456789');const before=await raw(page,app);await deny(page,app,true);await page.locator('.paye-open-btn').click();await expect(page.locator('#payeStorageStatus')).toContainText(copy[app.locale].read);await expect.poll(()=>page.locator(app.input).inputValue()).toMatch(/456.?789/);expect(await page.evaluate(()=>window.originalRead())).toBe(before);expect(errors).toEqual([]);
 });
 test(app.locale+' legacy PAYE: malformed payload is rejected before any field changes',async({page,baseURL})=>{
  const before=JSON.stringify([{id:'synthetic',title:'Synthetic damaged scenario',data:{[app.input.slice(1)]:{value:1}},createdAt:1,updatedAt:1}]);const errors=await open(page,baseURL,app,before);await page.locator(app.input).fill('345678');await page.locator('.paye-open-btn').focus();await page.keyboard.press('Enter');await expect(page.locator('#payeStorageStatus')).toBeVisible();await expect.poll(()=>page.locator(app.input).inputValue()).toMatch(/345.?678/);expect(await raw(page,app)).toBe(before);expect(errors).toEqual([]);
 });
}

for(const app of [{name:'Egypt',route:'/egypt/eg-paye.html',message:'Chart unavailable'},{name:'Cameroon EN',route:'/cameroon/cm-paye.html',message:'Chart unavailable'},{name:'Cameroon FR',route:'/fr/cameroon/cm-paye.html',message:'Graphique indisponible'}])for(const fault of ['missing-library','constructor-failure'])test(`${app.name} legacy PAYE chart resilience: ${fault}`,async({page,baseURL})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic chart recovery':undefined));
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 if(fault==='constructor-failure')await page.addInitScript(()=>{window.Chart=function(){throw Error('Synthetic chart failure')}});
 await page.goto(app.route);await page.locator('#grossSalary').fill('120000');await page.locator('.calc-btn').first().click();
 await expect(page.locator('#chartStatus')).toContainText(app.message);await expect(page.locator('#aiBtn')).toBeEnabled();
 await page.locator('#payeSaveBtn').click();await expect(page.locator('.paye-saved-card')).toHaveCount(1);
 await page.locator('#grossSalary').fill('240000');await page.locator('.calc-btn').first().click();await page.locator('.paye-open-btn').click();await expect(page.locator('#grossSalary')).toHaveValue('120000');
 for(const tab of await page.locator('.chart-tab').all())await tab.click();
 await page.locator('.chart-tab').first().click();await expect(page.locator('#chartStatus')).toContainText(app.message);
 if(app.name==='Egypt')await page.locator('.per-btn').nth(1).click();await expect(page.locator('#resultsCard')).toBeVisible();
 expect(chartFixture).toBeTruthy();await page.addScriptTag({content:fs.readFileSync(chartFixture,'utf8')});await page.locator('.chart-tab').first().click();await expect(page.locator('#chartStatus')).toBeHidden();await expect(page.locator('#mainChart')).toBeVisible();
 expect(errors).toEqual([]);
});

for(const route of ['/zimbabwe/zw-paye.html','/sw/cote-divoire/kikokotoo-kodi-mshahara/'])for(const changedMode of [false,true])test(`legacy restore mode ordering ${route}: ${changedMode?'changed mode':'same mode'}`,async({page,baseURL})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic restore ordering':undefined));
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(chartFixture)}));
 await page.goto(route);await page.locator('#grossSalary').fill('120000');await page.locator('.calc-btn').first().click();await page.locator('#payeSaveBtn').click();
 const before=await page.evaluate(()=>localStorage.getItem('afrotools-saved-'+window.PAYE_SAVE_SLUG));
 await page.locator('#grossSalary').fill('240000');await page.locator('.calc-btn').first().click();
 if(changedMode)await page.locator('.mode-btn').nth(1).click();
 await page.locator('.paye-open-btn').click();await page.waitForTimeout(800);
 await expect(page.locator('#grossSalary')).toHaveValue('120000');await expect(page.locator('.mode-btn').first()).toHaveClass(/on/);
 expect(await page.evaluate(()=>localStorage.getItem('afrotools-saved-'+window.PAYE_SAVE_SLUG))).toBe(before);await expect(page.locator('#payeStorageStatus')).toHaveCount(0);expect(errors).toEqual([]);
});

for(const [country,slug] of [['liberia','lr-paye-sw'],['mauritania','mr-paye-sw'],['guinea-bissau','gw-paye-sw']])test(`legacy calc-card layout ${country}: save/reopen and denied write`,async({page,baseURL})=>{
 const app={locale:'sw',slug,route:`/sw/${country}/kikokotoo-kodi-mshahara/`,input:'#salaryInput'};
 const errors=await open(page,baseURL,app);await page.locator(app.input).fill('120000');await page.locator('.calc-btn').click();await page.locator('#payeSaveBtn').click();
 await expect(page.locator('.paye-saved-card')).toHaveCount(1);const before=await raw(page,app);expect(JSON.parse(before)[0].data.salaryInput).toBe('120000');
 await page.locator(app.input).fill('240000');await deny(page,app);await page.locator('#payeSaveBtn').click();expect(await raw(page,app)).toBe(before);await expect(page.locator('#payeStorageStatus')).toContainText(copy.sw.write);
 await page.evaluate(()=>window.restoreStorage());await page.locator('.paye-open-btn').click();await page.waitForTimeout(800);await expect(page.locator(app.input)).toHaveValue('120000');expect(await raw(page,app)).toBe(before);expect(errors).toEqual([]);
});

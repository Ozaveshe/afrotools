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

for(const route of ['/ghana/gh-paye.html','/fr/ghana/gh-paye.html'])test('Ghana sharing keeps salary out of links and requires WhatsApp preview: '+route,async({page,baseURL})=>{
 const errors=[];page.on('pageerror',()=>errors.push('pageerror'));
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/core.*',r=>r.fulfill({contentType:'application/javascript',body:coreBundle}));
 if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') await page.route('**/assets/js/bundles/tool-page.*',r=>r.fulfill({contentType:'application/javascript',body:bundle}));
 await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',r=>chartFixture?r.fulfill({contentType:'application/javascript',body:fs.readFileSync(chartFixture)}):r.continue());
 await page.goto(route);await page.locator('#salaryInput').focus();await page.locator('#salaryInput').fill('123456');await page.locator('#calcBtn').click();
 await page.evaluate(()=>{history.replaceState({},'',location.pathname+'?g=123456&saved_calc=synthetic#private');window.__shared=[];window.__opened=[];Object.defineProperty(navigator,'share',{configurable:true,value:async data=>window.__shared.push(data)});window.open=url=>{window.__opened.push(url);return null}});
 await page.locator('#shareBtn').click();const shared=await page.evaluate(()=>window.__shared);expect(shared).toHaveLength(1);expect(new URL(shared[0].url).search).toBe('');expect(new URL(shared[0].url).hash).toBe('');expect(shared[0].text).not.toContain('123');
 await page.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copied=value}}})});await page.locator('#shareBtn').click();expect(await page.evaluate(()=>window.__copied)).toBe(shared[0].url);
 let preview=false;page.once('dialog',d=>{preview=d.message().includes('WhatsApp')&&d.message().includes('123,456');return d.dismiss()});await page.locator('#waBtn').click();expect(preview).toBe(true);expect(await page.evaluate(()=>window.__opened.length)).toBe(0);
 page.once('dialog',d=>d.accept());await page.locator('#waBtn').click();const opened=await page.evaluate(()=>window.__opened);expect(opened).toHaveLength(1);const text=new URL(opened[0]).searchParams.get('text');expect(text).toContain('123,456');expect(text).toContain(shared[0].url);expect(text).not.toContain('saved_calc');expect(text).not.toContain('?g=');expect(text).not.toContain('#private');expect(errors).toEqual([]);
});

'use strict';
const {test,expect}=require('@playwright/test');
for(const route of ['/tools/cv-builder/','/fr/tools/generateur-cv/']){
 for(const width of [320,1280]){
  test(`${route} shared core executes once and local editor works at ${width}px`,async({page,baseURL})=>{
   const origin=new URL(baseURL).origin,writes=[],errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',r=>{
    const req=r.request(),u=new URL(req.url());
    if(!['GET','HEAD'].includes(req.method())){writes.push({path:u.pathname,method:req.method()});return r.abort();}
    if(u.origin===origin&&!/^\/(?:api\/|\.netlify\/functions\/)/.test(u.pathname))return r.continue();
    return r.fulfill({status:204,body:'',contentType:u.pathname.endsWith('.js')?'application/javascript':'text/plain'});
   });
   // A metadata-only counter precedes otherwise unchanged served bundle bytes.
   // This proves execution count separately from request caching or tag count.
   await page.route('**/assets/js/bundles/core.*.min.js',async r=>{
    const response=await r.fetch(),body=await response.body();
    return r.fulfill({response,body:Buffer.concat([Buffer.from('window.__coreExecutionCount=(window.__coreExecutionCount||0)+1;\n'),body])});
   });
   await page.addInitScript(()=>{localStorage.setItem('afrotools_cookie_consent','declined');window.AFROTOOLS_TEST_DISABLE_ANALYTICS=true;});
   await page.setViewportSize({width,height:844});
   const response=await page.goto(route,{waitUntil:'domcontentloaded'});expect(response.status()).toBe(200);
   await page.waitForFunction(()=>window.CVApp&&document.querySelector('.cv-flow-primary[data-cv-flow-action="build"]'));
   await expect(page.locator('script[src*="/assets/js/bundles/core."]')).toHaveCount(1);
   await expect.poll(()=>page.evaluate(()=>window.__coreExecutionCount)).toBe(1);
   const start=page.locator('.cv-flow-primary[data-cv-flow-action="build"]');await expect(start).toBeVisible();await start.click();
   const firstName=page.locator('.cv-form-inner input[data-path="fn"]');await expect(firstName).toBeVisible();
   await firstName.focus();await firstName.fill('Synthetic');await expect(firstName).toHaveValue('Synthetic');
   await expect(page.locator('#cvpreview')).toContainText('Synthetic');
   expect(await page.evaluate(()=>CVApp.getState().data.fn)).toBe('Synthetic');
   expect(writes).toEqual([]);expect(errors).toEqual([]);
  });
 }
}

const {test,expect}=require('@playwright/test');
test.setTimeout(180000);
const workflows=[
  {slug:'kikokotoo-kahawa',engine:'coffee',helper:'sw-coffee-form'},
  {slug:'kikokotoo-cha-ushirika',engine:'cooperative',helper:'sw-cooperative-form'},
  {slug:'stakabadhi-ghalani',engine:'warehouse-receipt',helper:'sw-warehouse-receipt-form'}
];
const token='122345.789';
async function intercept(context){
  const content=[],errors=[];
  await context.route('**/*',route=>{
    const r=route.request();
    if(r.url().includes(token)||(r.postData()||'').includes(token)){content.push({method:r.method(),urlHasSynthetic:r.url().includes(token)});return route.abort();}
    if(!['GET','HEAD'].includes(r.method())||!r.url().startsWith('http://127.0.0.1:'))return route.abort();
    return route.continue();
  });
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  return {content,errors};
}
async function injectRaw(page){await page.locator('#scenario').evaluate((area,value)=>{area.value='{"revenue":'+value+'}';},token);}
for(const workflow of workflows){
  test(workflow.slug+': engine/helper/controller/guard losses fail closed and reload recovers',async({browser},testInfo)=>{
    for(const loss of ['engine','helper','controller','guard']){
      const context=await browser.newContext({baseURL:testInfo.project.use.baseURL,serviceWorkers:'block'});
      const observed=await intercept(context);
      const pattern=loss==='engine'?'**/engines/'+workflow.engine+'-engine.js*':loss==='helper'?'**/assets/js/lib/'+workflow.helper+'.js*':loss==='controller'?'**/assets/js/pages/sw-agriculture-commerce.js*':'**/assets/js/lib/sw-agriculture-commerce-submit-guard.js*';
      let blocked=0;await context.route(pattern,route=>{blocked++;return route.abort();});
      const page=await context.newPage();await page.goto('/sw/zana/'+workflow.slug+'/');
      await expect(page.locator('#scenario')).not.toHaveAttribute('name');
      await expect(page.locator('[data-agri-form] button[type=submit]')).toBeDisabled();
      await expect(page.locator('[data-commerce-script-note]')).toBeVisible();
      expect(blocked).toBe(1);await injectRaw(page);
      await page.locator('[data-agri-form]').evaluate(form=>form.requestSubmit());
      expect(observed.content).toEqual([]);expect(observed.errors).toEqual([]);
      await context.unroute(pattern);await page.reload();
      await expect(page.locator('[data-agri-form] button[type=submit]')).toBeEnabled();
      await expect(page.locator('[data-commerce-script-note]')).toBeHidden();
      await page.locator('[data-agri-form] button[type=submit]').click();await expect(page.locator('[data-result]')).toBeVisible();
      const download=page.waitForEvent('download');await page.locator('[data-export=json]').click();const file=await download;
      const fs=require('node:fs'),payload=JSON.parse(fs.readFileSync(await file.path(),'utf8'));expect(payload.locale).toBe('sw');expect(payload.privacy).toBe('local-only');expect(payload.result).toBeTruthy();
      await page.locator('[data-agri-form] button[type=reset]').click();await expect(page.locator('[data-result]')).toBeHidden();
      expect(observed.content).toEqual([]);expect(observed.errors).toEqual([]);await context.close();
    }
  });
  test(workflow.slug+': JavaScript-disabled forced submission has no serializable scenario',async({browser},testInfo)=>{
    const context=await browser.newContext({baseURL:testInfo.project.use.baseURL,javaScriptEnabled:false,serviceWorkers:'block'});
    const observed=await intercept(context),page=await context.newPage();await page.goto('/sw/zana/'+workflow.slug+'/');
    await expect(page.locator('#scenario')).not.toHaveAttribute('name');await expect(page.locator('[data-agri-form] button[type=submit]')).toBeDisabled();
    await expect(page.locator('[data-commerce-script-note]')).toBeVisible();await page.locator('#scenario').fill('{"revenue":'+token+'}');
    let attempted;const intercepted=new Promise(resolve=>attempted=resolve);
    await context.route('**/sw/zana/'+workflow.slug+'/**',async route=>{const r=route.request();if(!r.isNavigationRequest())return route.continue();const u=new URL(r.url());await route.abort();attempted({method:r.method(),query:u.searchParams.toString()});});
    await page.locator('[data-agri-form]').evaluate(form=>form.requestSubmit());const request=await intercepted;
    expect(request).toEqual({method:'GET',query:''});expect(observed.content).toEqual([]);expect(observed.errors).toEqual([]);await context.close();
  });
}
test('Strict CSP blocks inline configuration safely; unexpected engine errors remain visible',async({browser},testInfo)=>{
  for(const workflow of workflows){
    const context=await browser.newContext({baseURL:testInfo.project.use.baseURL,serviceWorkers:'block'}),observed=await intercept(context);
    await context.route('**/sw/zana/'+workflow.slug+'/',async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; object-src 'none'"}});});
    const page=await context.newPage();await page.goto('/sw/zana/'+workflow.slug+'/');await expect(page.locator('[data-agri-form] button[type=submit]')).toBeDisabled();await expect(page.locator('[data-commerce-script-note]')).toBeVisible();
    await injectRaw(page);await page.locator('[data-agri-form]').evaluate(form=>form.requestSubmit());expect(observed.content).toEqual([]);expect(observed.errors).toEqual([]);await context.close();
  }
  const context=await browser.newContext({baseURL:testInfo.project.use.baseURL,serviceWorkers:'block'}),observed=await intercept(context),page=await context.newPage();await page.goto('/sw/zana/kikokotoo-cha-ushirika/');
  await expect(page.locator('[data-agri-form] button[type=submit]')).toBeEnabled();await page.evaluate(()=>{window.__guardOriginalCalculate=window.AfroTools.CooperativeEngine.calculate;window.AfroTools.CooperativeEngine.calculate=()=>{throw Error('synthetic unexpected diagnostic');};});
  await page.locator('[data-agri-form] button[type=submit]').click();await expect(page.locator('[data-status]')).toContainText('synthetic unexpected diagnostic');await expect(page.locator('[data-result]')).toBeHidden();
  await page.evaluate(()=>{window.AfroTools.CooperativeEngine.calculate=window.__guardOriginalCalculate;});await page.locator('[data-agri-form] button[type=submit]').click();await expect(page.locator('[data-result]')).toBeVisible();expect(observed.content).toEqual([]);expect(observed.errors).toEqual([]);await context.close();
});

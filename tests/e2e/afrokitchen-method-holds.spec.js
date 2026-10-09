'use strict';
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const policy = require('../../engines/src/afrokitchen-engine');
const root = path.resolve(__dirname, '../..');

async function prepare(page, baseURL, width, theme) {
  await page.setViewportSize({width,height:850});
  await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  const origin=new URL(baseURL).origin,errors=[],missing=[],dataRequests=[];
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:204,body:''}));
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(new URL(response.url()).origin===origin&&response.status()>=400)missing.push(response.url());});
  page.on('request',request=>{if(/supabase\.co|\/\.netlify\/functions\/afrokitchen|\/recipe-index\.json/.test(request.url()))dataRequests.push(request.url());});
  await page.addInitScript(theme=>{localStorage.setItem('aft_theme',theme);localStorage.setItem('afrotools_cookie_consent','declined');},theme);
  return {errors,missing,dataRequests};
}

async function verify(page, slug, observation, theme, info) {
  const held=policy.applyMethodHold(slug);
  await expect(page.getByRole('heading',{name:held.name,exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Method under review',exact:true})).toBeVisible();
  await expect(page.getByText(policy.METHOD_HOLD_NOTICE,{exact:true})).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',held.route_url);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, follow');
  expect(await page.evaluate(()=>window.__AK_STATIC_RECIPE)).toBeUndefined();
  const schemas=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(node=>node.textContent.trim()).filter(Boolean).map(text=>JSON.parse(text)));
  expect(JSON.stringify(schemas)).not.toMatch(/recipeInstructions|recipeIngredient|"@type":"Recipe"/);
  const main=page.getByRole('main');
  await expect(main.locator('button,input,textarea,select,[data-ak-download-recipe],[data-timer-seconds]')).toHaveCount(0);
  await expect(main.locator('img')).toHaveCount(0);
  const link=page.getByRole('link',{name:`Browse ${held.country_name} recipes`,exact:true});
  await link.focus();await expect(link).toBeFocused();
  expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  // The shared navbar loads its stylesheet asynchronously. Inspect its settled
  // closed-menu state instead of auditing unstyled shadow DOM during startup.
  await expect(page.locator('afro-navbar .mob')).toBeHidden();
  await page.addScriptTag({path:path.join(root,'node_modules/axe-core/axe.min.js')});
  const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(row=>({id:row.id,nodes:row.nodes.map(node=>({target:node.target,summary:node.failureSummary}))})));
  expect(violations).toEqual([]);expect(observation.errors).toEqual([]);expect(observation.missing).toEqual([]);expect(observation.dataRequests).toEqual([]);
  await info.attach('method-hold-observation',{body:Buffer.from(JSON.stringify({slug,theme,...observation,violations,externalRequests:'stubbed; local route proof only'})),contentType:'application/json'});
  await page.keyboard.press('Enter');await expect(page).toHaveURL(new RegExp(held.country_route_path+'$'));
  await expect(page.getByRole('heading',{level:1})).toContainText(held.country_name);
}

for(const slug of policy.METHOD_HOLD_SLUGS) for(const width of [320,390]) for(const theme of ['light','dark']) {
  test(`${slug}: ${width}px ${theme} canonical withdrawal`,async({page,baseURL},info)=>{
    const observation=await prepare(page,baseURL,width,theme);
    const response=await page.goto('/tools/afrokitchen/recipes/'+slug+'/',{waitUntil:'domcontentloaded'});expect(response.status()).toBe(200);
    await verify(page,slug,observation,theme,info);
  });
}
for(const [index,slug] of policy.METHOD_HOLD_SLUGS.entries()) for(const width of [320,390]) {
  const theme=index%2?'dark':'light';
  test(`${slug}: ${width}px legacy fallback withdrawal`,async({page,baseURL},info)=>{
    const observation=await prepare(page,baseURL,width,theme);
    // Exercise the legacy controller itself when canonical handoff is unavailable.
    await page.route('**/recipe-handoff.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
    await page.goto('/tools/afrokitchen/recipe.html?slug='+slug,{waitUntil:'domcontentloaded'});
    await verify(page,slug,observation,theme,info);
  });
}
test('legacy normal handoff reaches the held canonical status',async({page,baseURL},info)=>{
  const observation=await prepare(page,baseURL,320,'dark'),slug=policy.METHOD_HOLD_SLUGS[0];
  await page.goto('/tools/afrokitchen/recipe.html?slug='+slug,{waitUntil:'domcontentloaded'});
  await expect(page).toHaveURL(new RegExp('/recipes/'+slug+'/$'));
  await verify(page,slug,observation,'dark',info);
});

test('neighboring recipe retains servings, cooking timers and actual TXT export',async({page,baseURL})=>{
  const observation=await prepare(page,baseURL,320,'dark');
  await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#ak-static-servings')).toHaveText('6');
  await page.getByRole('button',{name:'Increase servings',exact:true}).click();await expect(page.locator('#ak-static-servings')).toHaveText('7');
  await page.locator('[data-ak-full-method]').click();
  await expect(page.locator('#ak-timer-toggle-6')).toBeVisible();
  await page.locator('#ak-timer-toggle-6').click();await expect(page.locator('#ak-timer-toggle-6')).toContainText('Pause');
  await page.locator('.ak-visual-exports > summary').click();
  const pending=page.waitForEvent('download');await page.locator('[data-ak-download-recipe]').click();
  const download=await pending;expect(await download.failure()).toBeNull();
  const stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);
  const text=Buffer.concat(chunks).toString();expect(text).toMatch(/Jollof/i);expect(text).toContain('Servings: 7');
  expect(observation.errors).toEqual([]);expect(observation.missing).toEqual([]);
});

if(process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT==='1') test('historical import and review records are absent from the public artifact',async({request})=>{
  for(const route of [
    '/data/afrokitchen/recipe-expansion-batches/2026-05-03-gap-fill-wave-1.json',
    '/data/afrokitchen/recipe-expansion-batches/2026-05-02-central-southern-wave-1.json',
    '/data/afrokitchen/recipe-research-audit.json'
  ]) { const response=await request.get(route);expect(response.status()).toBe(404); }
});

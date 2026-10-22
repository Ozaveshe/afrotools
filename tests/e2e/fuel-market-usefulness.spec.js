'use strict';
const {test,expect}=require('@playwright/test');
test.describe('Dated, useful fuel lookup and fill planning',()=>{
 test.beforeEach(async({page,baseURL})=>{const origin=new URL(baseURL).origin;await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort('blockedbyclient'));await page.route('**/api/fuel-prices',route=>route.fulfill({status:200,contentType:'application/json',body:'{"countries":[]}'}));await page.goto('/tools/fuel-tracker/#fuel-finder');await expect(page.locator('#fuel-country')).toBeEnabled();for(const selector of ['#afro-pwa-close','#afro-cc-decline']){const choice=page.locator(selector);if(await choice.isVisible())await choice.click();}});
 test('Nigeria outlet observation gives a useful twenty-litre cost with exact provenance',async({page})=>{await expect(page.locator('#fuel-result-place')).toContainText('Abuja');await expect(page.locator('#fuel-result-confidence')).not.toContainText('country');await expect(page.locator('#fuel-price')).toHaveValue('1405');await expect(page.locator('#fuel-result-effective')).toHaveText('2026-10-09');await page.locator('#fuel-quantity').fill('20');await page.locator('#fuel-fill-calc').click();const report=await page.evaluate(()=>window.AfroTools.fuelFillReport());expect(report.calculation.totalCost).toBe(28100);expect(report.priceBasis).toBe('dated-observation');expect(report.market.granularity).toBe('city');expect(report.market.sourceUrl).toContain('punchng.com');await page.locator('#fuel-finder').screenshot({path:test.info().outputPath('nigeria-useful.png')});});
 test('Kenya city cap keeps the official period and updates petrol, diesel and tank cost',async({page})=>{await page.locator('#fuel-country').selectOption('KE');await page.locator('#fuel-market').selectOption('ke-nairobi-2026-10');await expect(page.locator('#fuel-price')).toHaveValue('226.96');await expect(page.locator('#fuel-result-effective')).toHaveText('2026-10-15');await expect(page.locator('#fuel-result-validTo')).toHaveText('2026-11-14');await expect(page.locator('#fuel-result-note')).toContainText('Official maximum retail cap');await page.locator('#fuel-type').selectOption('diesel');await expect(page.locator('#fuel-price')).toHaveValue('227.76');await page.locator('#fuel-fill-mode').selectOption('tank');await page.locator('#fuel-tank-size').fill('50');await page.locator('#fuel-current-level').fill('20');await page.locator('#fuel-fill-calc').click();const report=await page.evaluate(()=>window.AfroTools.fuelFillReport());expect(report.calculation.litres).toBe(40);expect(report.calculation.totalCost).toBeCloseTo(9110.4);expect(report.market.validTo).toBe('2026-11-14');expect(report.market.priceKind).toBe('official-maximum-retail');await page.locator('#fuel-finder').screenshot({path:test.info().outputPath('kenya-current-cap.png')});});
 test('historical Nigeria benchmark is visible and needs an explicit planning choice',async({page})=>{await page.locator('#fuel-market').selectOption('ng-national');await expect(page.locator('#fuel-result-price')).toContainText('1,202.75');await expect(page.locator('#fuel-result-confidence')).toContainText('Historical');await expect(page.locator('#fuel-price')).toHaveValue('');await page.locator('#fuel-use-history').click();await expect(page.locator('#fuel-price')).toHaveValue('1202.75');await page.locator('#fuel-fill-calc').click();const report=await page.evaluate(()=>window.AfroTools.fuelFillReport());expect(report.priceBasis).toBe('historical-estimate');expect(report.calculation.totalCost).toBe(24055);expect(report.market.snapshotDate).toBe('2026-08-10');expect(report.market.effectiveDate).toBeNull();await expect(page.locator('#fuel-result-date-label')).toHaveText('Snapshot date');await expect(page.locator('#fuel-result-verified')).toContainText('Not supplied');await expect(page.locator('#fuel-fill-status')).toContainText('Historical');const downloaded=page.waitForEvent('download');await page.locator('#fuel-fill-json').click();const download=await downloaded;const stream=await download.createReadStream();let text='';for await(const chunk of stream)text+=chunk;expect(JSON.parse(text)).toEqual(report);await page.locator('#fuel-finder').screenshot({path:test.info().outputPath('historical-choice.png')});});
 test('a manual local price clears prior basis; invalid volume cannot export a stale result',async({page})=>{await page.locator('#fuel-price').fill('1500');await page.locator('#fuel-fill-calc').click();let report=await page.evaluate(()=>window.AfroTools.fuelFillReport());expect(report.priceBasis).toBe('manual');expect(report.market).toBeNull();expect(report.calculation.totalCost).toBe(30000);await page.locator('#fuel-quantity').fill('0');await page.locator('#fuel-fill-calc').click();expect(await page.evaluate(()=>window.AfroTools.fuelFillReport())).toBeNull();await expect(page.locator('#fuel-fill-json')).toBeDisabled();});
 test('mobile selection, observation coverage, keyboard action and viewport stay useful',async({page})=>{await page.setViewportSize({width:375,height:812});await page.locator('#fuel-country').selectOption('BI');await expect(page.locator('#fuel-result-granularity')).toHaveText('National benchmark');await expect(page.locator('#fuel-price')).toHaveValue('4000');await page.locator('#fuel-fill-calc').focus();await page.keyboard.press('Enter');expect((await page.evaluate(()=>window.AfroTools.fuelFillReport())).calculation.totalCost).toBe(80000);const widths=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));expect(widths.scroll).toBeLessThanOrEqual(widths.inner+1);await expect(page.locator('#fuel-data-status')).not.toContainText('0 recent references');await page.locator('#fuel-type').selectOption('diesel');await expect(page.locator('#fuel-price')).toHaveValue('3925');await page.locator('#fuel-fill-calc').click();const diesel=await page.evaluate(()=>window.AfroTools.fuelFillReport());expect(diesel.calculation.totalCost).toBe(78500);expect(diesel.priceBasis).toBe('snapshot-estimate');expect(diesel.market.sourceUrl).toBe('https://www.globalpetrolprices.com/Burundi/diesel_prices/');expect(diesel.market.observationDate).toBeNull();await expect(page.locator('#fuel-result-date-label')).toHaveText('Snapshot date');await page.locator('#fuel-finder').screenshot({path:test.info().outputPath('mobile-country-observation.png')});});
});


test.describe('Optional scheduled fuel feed',()=>{
 test.beforeEach(async({page,baseURL})=>{const origin=new URL(baseURL).origin;await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort('blockedbyclient'));});
 async function openFinder(page){await page.goto('/tools/fuel-tracker/#fuel-finder');await expect(page.locator('#fuel-country')).toBeEnabled();for(const selector of ['#afro-pwa-close','#afro-cc-decline']){const choice=page.locator(selector);if(await choice.isVisible())await choice.click();}}
 const feed={countries:[{code:'NG',name:'Nigeria',currency:'NGN',source_url:'https://www.globalpetrolprices.com/Nigeria/gasoline_prices/',last_updated:'2026-10-22',petrol:{price:1500,unit:'liter',observed_at:'2026-10-21',source_url:'https://www.globalpetrolprices.com/Nigeria/gasoline_prices/'}}]};
 test('product-dated API price is useful while scoped outlet and manual planning stay intact',async({page})=>{
  await page.route('**/api/fuel-prices',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(feed)}));
  await openFinder(page);
  // Wait for optional data before making a visitor selection; input is never overwritten by a later feed.
  await expect.poll(()=>page.locator('#fuel-table-body').innerText()).toContain('2026-10-21');
  await page.locator('#fuel-market').selectOption('ng-national');await expect(page.locator('#fuel-price')).toHaveValue('1500');
  await expect(page.locator('#fuel-result-date-label')).toHaveText('Observation date');
  await page.locator('#fuel-fill-calc').click();const report=await page.evaluate(()=>window.AfroTools.fuelFillReport());expect(report.calculation.totalCost).toBe(30000);expect(report.market.observationDate).toBe('2026-10-21');expect(report.market.effectiveDate).toBeNull();
  await page.locator('#fuel-market').selectOption('ng-abuja-nnpc-observed');await expect(page.locator('#fuel-price')).toHaveValue('1405');
 });
 for(const failure of ['http','shape','timeout'])test('static planning survives optional API '+failure,async({page})=>{
  await page.route('**/api/fuel-prices',async route=>{if(failure==='timeout'){await new Promise(resolve=>setTimeout(resolve,3000));try{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(feed)});}catch(_){}return;}await route.fulfill({status:failure==='http'?503:200,contentType:'application/json',body:failure==='shape'?'{}':'{"error":"synthetic unavailable"}'});});
  await openFinder(page);await expect(page.locator('#fuel-price')).toHaveValue('1405');
  await page.locator('#fuel-price').fill('1600');await page.locator('#fuel-fill-calc').click();await expect(page.locator('#fuel-fill-total')).toContainText('32,000');
  await expect.poll(async()=>{const r=await page.evaluate(()=>window.AfroTools.fuelFillReport());return r&&r.calculation.totalCost;}).toBe(32000);
  if(failure==='timeout'){await page.waitForTimeout(3000);expect((await page.evaluate(()=>window.AfroTools.fuelFillReport())).priceBasis).toBe('manual');await expect(page.locator('#fuel-price')).toHaveValue('1600');}
 });
 // Pause the page clock before navigation: hold a genuine successful response without
 // depending on CI wall-clock speed or changing the production2500ms deadline.
 async function pausedFeed(page,{staticMissing=false,feedBody=feed}={}){
  await page.clock.install({time:new Date('2026-10-22T11:59:59Z')});
  await page.clock.pauseAt(new Date('2026-10-22T12:00:00Z'));
  let release,entered;const held=new Promise(resolve=>release=resolve),requested=new Promise(resolve=>entered=resolve);
  await page.route('**/api/fuel-prices',async route=>{entered();await held;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(feedBody)});});
  if(staticMissing){
   await page.route('**/data/fuel/markets.json',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"synthetic static unavailable"}'}));
   await page.route('**/data/fuel/latest.json',route=>route.fulfill({status:200,contentType:'application/json',body:'{"countries":[]}'}));
  }
  await page.goto('/tools/fuel-tracker/#fuel-finder');await requested;
  return async()=>{const responsePromise=page.waitForResponse('**/api/fuel-prices');release();const response=await responsePromise;expect(response.status()).toBe(200);expect(await response.json()).toEqual(feedBody);await response.finished();await page.clock.runFor(2501);};
 }
 for(const staticMissing of [false,true])test('held successful API preserves active manual plan with static '+(staticMissing?'unavailable':'available'),async({page},testInfo)=>{
  const release=await pausedFeed(page,{staticMissing});
  if(!staticMissing)await expect(page.locator('#fuel-price')).toHaveValue('1405');
  await page.locator('#fuel-price').fill('1600');await page.locator('#fuel-currency').fill('NGN');await page.locator('#fuel-quantity').fill('20');await page.locator('#fuel-fill-calc').click();
  const before=await page.evaluate(()=>window.AfroTools.fuelFillReport());expect(before.priceBasis).toBe('manual');expect(before.calculation.totalCost).toBe(32000);
  await release();
  await testInfo.attach('actual-before-after-plan',{body:JSON.stringify({before,after:await page.evaluate(()=>window.AfroTools.fuelFillReport())},null,2),contentType:'application/json'});
  await expect(page.locator('#fuel-price')).toHaveValue('1600');await expect(page.locator('#fuel-currency')).toHaveValue('NGN');await expect(page.locator('#fuel-quantity')).toHaveValue('20');
  await expect(page.locator('#fuel-fill-result')).toBeVisible();await expect(page.locator('#fuel-fill-json')).toBeEnabled();
  expect(await page.evaluate(()=>window.AfroTools.fuelFillReport())).toEqual(before);
  await expect(page.locator('#fuel-country')).toBeEnabled();await expect(page.locator('#fuel-market')).toBeEnabled();
  await page.locator('#fuel-market').selectOption(staticMissing?'ng-national-observation':'ng-national');await expect(page.locator('#fuel-price')).toHaveValue('1500');
  await expect(page.locator('#fuel-fill-result')).toBeHidden();await page.locator('#fuel-fill-calc').click();
  expect((await page.evaluate(()=>window.AfroTools.fuelFillReport())).calculation.totalCost).toBe(30000);
 });
 test('held successful API recovers empty static lookup when no visitor plan has started',async({page})=>{
  const release=await pausedFeed(page,{staticMissing:true});await release();
  await expect(page.locator('#fuel-country')).toBeEnabled();await expect(page.locator('#fuel-price')).toHaveValue('1500');
  await expect(page.locator('#fuel-result-date-label')).toHaveText('Observation date');await expect(page.locator('#fuel-result-effective')).toHaveText('2026-10-21');
  await page.locator('#fuel-quantity').fill('20');await page.locator('#fuel-fill-calc').click();const report=await page.evaluate(()=>window.AfroTools.fuelFillReport());expect(report.priceBasis).toBe('dated-observation');expect(report.calculation.totalCost).toBe(30000);
 });
 test('held malformed API preserves a manual plan when both static sources are unavailable',async({page})=>{
  const release=await pausedFeed(page,{staticMissing:true,feedBody:{countries:[null]}});
  await page.locator('#fuel-price').fill('1600');await page.locator('#fuel-currency').fill('NGN');await page.locator('#fuel-quantity').fill('20');await page.locator('#fuel-fill-calc').click();
  const before=await page.evaluate(()=>window.AfroTools.fuelFillReport());await release();
  await expect(page.locator('#fuel-price')).toHaveValue('1600');await expect(page.locator('#fuel-fill-json')).toBeEnabled();
  expect(await page.evaluate(()=>window.AfroTools.fuelFillReport())).toEqual(before);expect(before.calculation.totalCost).toBe(32000);
  await expect(page.locator('#fuel-country')).toBeDisabled();
 });

});

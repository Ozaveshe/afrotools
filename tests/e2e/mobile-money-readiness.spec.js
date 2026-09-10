'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('fs');
const routes={en:'/tools/mobile-money-fees/',fr:'/fr/tools/frais-mobile-money/',sw:'/sw/zana/ada-pesa-simu/'};
async function fillQuotes(page){
  for(const [letter,fee] of [['a','104'],['b','150']]){
    for(const [key,value] of Object.entries({label:'Synthetic '+letter,market:'Cameroun',currency:'XAF',amount:'10000',sender:'0',recipient:fee,observed:'2026-09-09T12:00'}))await page.locator(`#mm-${letter}-${key}`).fill(value);
  }
}
test.use({viewport:{width:390,height:844}});
for(const locale of Object.keys(routes))test(`${locale}: early Enter and pointer preserve input until controller is ready`,async({page})=>{
  let release;
  const delayed=new Promise(resolve=>{release=resolve;});
  const navigations=[];
  page.on('request',request=>{if(request.isNavigationRequest()&&request.frame()===page.mainFrame())navigations.push(request.url());});
  await page.route('**/assets/js/pages/mobile-money-quote-parity.js*',async route=>{await delayed;await route.continue();});
  try{
    await page.goto(routes[locale],{waitUntil:'commit'});
    await fillQuotes(page);
    await page.locator('#mm-a-label').press('Enter',{noWaitAfter:true});
    // Real pointer input is harmless while the action is disabled.
    const button=page.locator('#mm-form button[type="submit"]');
    await button.scrollIntoViewIfNeeded();
    const box=await button.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    await page.waitForTimeout(150);
    expect(navigations).toHaveLength(1);
    await expect(page.locator('#mm-a-label')).toHaveValue('Synthetic a');
    await expect(button).toBeDisabled();
    release();
    await expect(button).toBeEnabled();
    await expect(page.locator('#mm-b-recipient')).toHaveValue('150');
    await button.click();
    await expect(page.locator('#mm-result-list')).toContainText('104');
    await expect(page.locator('#mm-result-list')).toContainText('46');
    const download=page.waitForEvent('download');await page.locator('#mm-json').click();
    const result=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));
    expect(result.result.quotes.map(quote=>quote.totalFee)).toEqual([104,150]);
    expect(result.result.quotes[1].differenceFromLowest).toBe(46);
    expect(navigations).toHaveLength(1);
  }finally{release();}
});
for(const locale of Object.keys(routes))for(const dependency of ['pages/mobile-money-quote-parity','engines/mobile-money-quote-engine'])test(`${locale}: failed ${dependency} keeps drafts and reports unavailable`,async({page})=>{
  const navigations=[];
  page.on('request',request=>{if(request.isNavigationRequest()&&request.frame()===page.mainFrame())navigations.push(request.url());});
  await page.route(`**/assets/js/${dependency}.js*`,route=>route.abort('failed'));
  await page.goto(routes[locale]);
  await page.locator('#mm-a-label').fill('Synthetic retained draft');
  await page.locator('#mm-a-label').press('Enter');
  await expect(page.locator('#mm-form')).toHaveAttribute('data-readiness','failed');
  await expect(page.locator('#mm-status')).toContainText({en:'unavailable',fr:'indisponible',sw:'hakipatikani'}[locale]);
  await expect(page.locator('#mm-form button[type="submit"]')).toBeDisabled();
  await expect(page.locator('#mm-copy')).toBeDisabled();
  await expect(page.locator('#mm-json')).toBeDisabled();
  await expect(page.locator('#mm-a-label')).toHaveValue('Synthetic retained draft');
  await expect(page.locator('#mm-result-list')).toBeEmpty();
  expect(navigations).toHaveLength(1);
});
test('tariff catalogue readiness retains an amount entered before loading',async({page})=>{
  let release;const delayed=new Promise(resolve=>{release=resolve;});
  await page.route('**/data/fintech/mobile-money-tariffs.json',async route=>{await delayed;await route.continue();});
  try{
    await page.goto(routes.fr);
    await page.locator('#mm-amount').fill('10000');
    await page.locator('#mm-amount').press('Enter');
    await expect(page.locator('#mm-tariff-form button')).toBeDisabled();
    await expect(page.locator('#mm-tariff-status')).toContainText('Chargement');
    release();
    await expect(page.locator('#mm-tariff-form button')).toBeEnabled();
    await expect(page.locator('#mm-amount')).toHaveValue('10000');
    await page.locator('#mm-tariff-form button').click();
    await expect(page.locator('#mm-tariff-result')).toContainText('MTN');
  }finally{release();}
});
test('initialization timeout reports failure without erasing a draft',async({page})=>{
  await page.clock.install();
  await page.route('**/assets/js/pages/mobile-money-quote-parity.js*',route=>route.fulfill({contentType:'application/javascript',body:''}));
  await page.goto(routes.fr);
  await page.locator('#mm-a-label').fill('Synthetic retained draft');
  await expect(page.locator('#mm-form')).toHaveAttribute('data-readiness','loading');
  await page.clock.runFor(15001);
  await expect(page.locator('#mm-form')).toHaveAttribute('data-readiness','failed');
  await expect(page.locator('#mm-status')).toContainText('indisponible');
  await expect(page.locator('#mm-a-label')).toHaveValue('Synthetic retained draft');
  await expect(page.locator('#mm-json')).toBeDisabled();
});

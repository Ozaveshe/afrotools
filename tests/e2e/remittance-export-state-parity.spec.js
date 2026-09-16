const {test,expect}=require('@playwright/test');
const fs=require('fs');
test.use({timezoneId:'UTC'});
for(const [locale,route,failure] of [['en','/tools/remittance-compare/','Could not copy'],['fr','/fr/tools/transfert-argent/','Impossible de copier'],['sw','/sw/zana/ulinganisho-uhamishaji-pesa/','Imeshindikana kunakili']]) {
 test(`${locale} exports refresh expiry and errors clear on edit`,async({page})=>{
  await page.clock.install({time:new Date('2026-09-16T12:00:00Z')});
  const sent=[];page.on('request',request=>{if((request.url()+' '+(request.postData()||'')).includes('Synthetic'))sent.push(request.url());});
  await page.goto(route);
  for(const letter of ['a','b'])for(const [key,value] of Object.entries({label:`Synthetic ${letter}`,send:'USD',debit:'500',receive:'NGN',recipient:letter==='a'?'780000':'790000',observed:'2026-09-16T11:00',expires:letter==='b'?'2026-09-16T12:01':''})) await page.locator(`#rm-${letter}-${key}`).fill(value);
  await page.locator('#rm-form button[type=submit]').click();
  await expect(page.locator('.rm-result[data-highest=true]')).toHaveCount(1);
  await page.clock.setFixedTime(new Date('2026-09-16T12:01:00Z'));
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedQuote=text;}}}));
  await page.locator('#rm-copy').click();
  await expect(page.locator('.rm-result[data-expiry=expired]')).toHaveCount(1);
  expect(await page.evaluate(()=>window.copiedQuote)).toContain('Synthetic b');
  const download=page.waitForEvent('download');await page.locator('#rm-json').click();
  const payload=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));
  expect(payload.result.quotes[1].expiryState).toBe('expired');
  expect(payload.result.hasEligibleComparison).toBe(false);
  await page.locator('#rm-b-recipient').fill('0');await page.locator('#rm-form button[type=submit]').click();
  await expect(page.locator('#rm-error')).not.toBeEmpty();
  await page.locator('#rm-b-recipient').fill('790000');
  await expect(page.locator('#rm-error')).toBeEmpty();
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('denied'))}});document.execCommand=()=>false;});
  await page.locator('#rm-copy').click();await expect(page.locator('#rm-status')).toContainText(failure);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));
  await page.locator('#rm-copy').click();await expect(page.locator('#rm-status')).toContainText(failure);
  expect(sent).toEqual([]);
 });
}


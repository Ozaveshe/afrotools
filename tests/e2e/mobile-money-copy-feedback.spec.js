const {test,expect}=require('@playwright/test');
const routes={en:'/tools/mobile-money-fees/',fr:'/fr/tools/frais-mobile-money/',sw:'/sw/zana/ada-pesa-simu/'};
for(const [locale,route] of Object.entries(routes))for(const mode of ['success','missing','denied'])test(`${locale} quote copy ${mode} preserves context or offers JSON`,async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(mode=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:mode==='missing'?undefined:{writeText:async value=>{if(mode==='denied')throw new DOMException('Denied','NotAllowedError');window.__copied=value;}}}),mode);
 await page.goto(route);
 for(const letter of ['a','b'])for(const [key,value]of Object.entries({label:'Synthetic '+letter,market:'Senegal',currency:'XOF',amount:'10000',sender:'20',recipient:'5',observed:'2026-01-01T11:00'}))await page.locator(`#mm-${letter}-${key}`).fill(value);
 await page.locator('#mm-copy').click();
 if(mode==='success'){
  await expect(page.locator('#mm-status')).toContainText({en:'Summary copied',fr:'Résumé copié',sw:'Muhtasari umenakiliwa'}[locale]);
  const copied=await page.evaluate(()=>window.__copied);expect(copied).toContain('Synthetic a (Senegal)');expect(copied).toContain('20 XOF');expect(copied).toContain('5 XOF');expect(copied).toContain('25 XOF');expect(copied).toContain('2026');
  expect(copied).toContain({en:'Transaction amount',fr:'Montant de la transaction',sw:'Kiasi cha muamala'}[locale]);
 }else{
  await expect(page.locator('#mm-status')).toContainText('JSON');
  await expect(page.locator('#mm-status')).toContainText(mode==='missing'?{en:'unavailable',fr:'indisponible',sw:'hakupatikani'}[locale]:{en:'denied',fr:'refusée',sw:'kumekataliwa'}[locale]);
  const download=page.waitForEvent('download');await page.locator('#mm-json').click();expect((await download).suggestedFilename()).toMatch(/\.json$/);
 }
 expect(errors).toEqual([]);
});

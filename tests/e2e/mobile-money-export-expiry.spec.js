const {test,expect}=require('@playwright/test');const fs=require('node:fs');
test.use({timezoneId:'UTC'});
const routes={en:'/tools/mobile-money-fees/',fr:'/fr/tools/frais-mobile-money/',sw:'/sw/zana/ada-pesa-simu/'};
for(const[locale,route]of Object.entries(routes))test(`${locale} copy and JSON recheck elapsed quote expiry`,async({page})=>{
 await page.clock.install({time:new Date('2026-09-16T12:00:00Z')});await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>window.__quoteCopy=value}}));await page.goto(route);
 for(const l of ['a','b'])for(const[k,v]of Object.entries({label:'Synthetic '+l,market:'Senegal',currency:'XOF',amount:'10000',sender:l==='a'?'10':'20',recipient:'0',observed:'2026-09-16T11:00',expires:'2026-09-16T12:01'}))await page.locator('#mm-'+l+'-'+k).fill(v);
 await page.locator('#mm-form button[type=submit]').click();await expect(page.locator('#mm-primary-value')).toHaveText('10 XOF');await page.clock.fastForward(120000);
 const pending=page.waitForEvent('download');await page.locator('#mm-json').click();const json=JSON.parse(fs.readFileSync(await(await pending).path(),'utf8'));
 expect(json.result.hasEligibleComparison).toBe(false);expect(Date.parse(json.result.asOf)).toBeGreaterThanOrEqual(Date.parse('2026-09-16T12:02:00Z'));expect(json.result.quotes.map(q=>q.expiryState)).toEqual(['expired','expired']);await expect(page.locator('#mm-primary-value')).not.toHaveText('10 XOF');
 await page.locator('#mm-copy').click();expect(await page.evaluate(()=>window.__quoteCopy)).toContain({en:'Expired',fr:'Expiré',sw:'Muda umeisha'}[locale]);
});
for(const[locale,route]of Object.entries(routes))test(`${locale} country equivalence preserves user values and excludes other markets`,async({page})=>{
 await page.clock.setFixedTime(new Date('2026-09-16T12:00:00Z'));await page.goto(route);
 for(const l of ['a','b'])for(const[k,v]of Object.entries({label:'Synthetic '+l,market:l==='a'?'Sénégal':'SN',currency:'XOF',amount:'10000',sender:l==='a'?'10':'20',recipient:'0',observed:'2026-09-16T11:00'}))await page.locator('#mm-'+l+'-'+k).fill(v);
 await page.locator('#mm-form button[type=submit]').click();await expect(page.locator('#mm-primary-value')).toHaveText('10 XOF');const pending=page.waitForEvent('download');await page.locator('#mm-json').click();const json=JSON.parse(fs.readFileSync(await(await pending).path(),'utf8'));expect(json.result.quotes.map(q=>q.market)).toEqual(['Sénégal','SN']);
 await page.locator('#mm-b-market').fill('Mali');await page.locator('#mm-copy').click();await expect(page.locator('#mm-primary-value')).not.toHaveText('10 XOF');await expect(page.locator('#mm-primary-value')).toContainText({en:'No eligible',fr:'Aucun devis',sw:'Hakuna'}[locale]);await expect(page.locator('#mm-error')).toBeEmpty();
 await page.locator('#mm-b-market').fill('SN');await page.locator('#mm-b-amount').fill('');await page.locator('#mm-json').click();await expect(page.locator('#mm-result-list')).toBeEmpty();await expect(page.locator('#mm-error')).not.toBeEmpty();
});

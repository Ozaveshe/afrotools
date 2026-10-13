const {test,expect}=require('@playwright/test');
const ledger=require('../../data/ideas/registration-evidence.json');
const record={id:'synthetic',name:'Synthetic shop',country_code:'KE',country_name:'Kenya',sector:'retail',currency:'KES',risk:'low',startup_cost_min:75000,startup_cost_max:95000,monthly_revenue_min:30000,monthly_revenue_max:50000,record_origin:'generated_example'};
const routes=[['/tools/idea-board/','en'],['/fr/tools/tableau-idees/','fr'],['/sw/zana/kichunguzi-ushahidi-wa-mawazo/','sw']];
async function open(page,url,payload=ledger,country='KE'){
 await page.clock.setFixedTime(new Date('2026-10-13T12:00:00Z'));
 let references=0;await page.route('**/data/ideas/registration-evidence.json',route=>{references++;return route.fulfill({contentType:'application/json',body:JSON.stringify(payload)})});
 await page.route('**/.netlify/functions/idea-evidence**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({rows:[{...record,country_code:country,currency:country==='NG'?'NGN':'KES'}],reportedTotal:1})}));
 await page.goto(url);await expect(page.locator('[data-search-form]')).toBeVisible();expect(references).toBe(0);
 await page.locator('[data-search-form] button[type=submit]').click();await expect(page.locator('.iee-card')).toHaveCount(1);expect(references).toBe(0);
 const trigger=page.locator('.iee-card button[data-action^="details:"]');await trigger.click();return trigger;
}
for(const [url,lang] of routes)test(lang+' displays a scoped primary reference with mobile focus and unchanged estimate source',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:320,height:850});
 const trigger=await open(page,url);const panel=page.locator('[data-registration-reference]');await expect(panel).toContainText('950');
 await expect(panel.locator('a')).toHaveAttribute('href',ledger.claims[0].sourceUrl);await expect(panel).toContainText('2026-10-13');
 await expect(page.locator('.iee-card')).toContainText(lang==='en'?'Source not supplied':lang==='fr'?'Source non fournie':'Chanzo hakijatolewa');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
 expect(await page.locator('.iee-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await panel.scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath('registration-reference-320.png')});
 await page.keyboard.press('Escape');await expect(page.locator('.iee-dialog')).toBeHidden();await expect(trigger).toBeFocused();expect(errors).toEqual([]);
});
test('expired fee is withheld rather than silently refreshed',async({page})=>{
 const old=JSON.parse(JSON.stringify(ledger));old.claims[0].observedAt=old.claims[0].reviewedAt='2020-10-13';await open(page,routes[0][0],old);
 const panel=page.locator('[data-registration-reference]');await expect(panel).toContainText('Review overdue');await expect(panel).not.toContainText('950');await expect(panel.locator('a')).toHaveAttribute('href',ledger.claims[0].sourceUrl);
});
test('uncovered country and failed reference request preserve the idea dialog',async({page})=>{
 await open(page,routes[0][0],ledger,'ZA');await expect(page.locator('[data-registration-reference]')).toContainText('No reviewed');
 await page.keyboard.press('Escape');await page.reload();await page.unroute('**/data/ideas/registration-evidence.json');await page.route('**/data/ideas/registration-evidence.json',route=>route.fulfill({status:503,body:'unavailable'}));
 await page.locator('[data-search-form] button[type=submit]').click();await page.locator('.iee-card button[data-action^="details:"]').click();await expect(page.locator('[data-registration-reference]')).toContainText('reference is unavailable');await expect(page.locator('.iee-dialog')).toContainText('Synthetic shop');
});
test('Nigeria reference separates publication and signature dates and withholds an unproven current amount',async({page})=>{
 await open(page,routes[0][0],ledger,'NG');const panel=page.locator('[data-registration-reference]');await expect(panel).toContainText('Current fee applicability is unverified');await expect(panel).not.toContainText('20,000');await expect(panel).toContainText('Publication date: 2025-05-29');await expect(panel).toContainText('Signature date: 2024-10-31');await expect(panel.locator('a')).toHaveAttribute('href',ledger.claims[1].sourceUrl);
});

const {test,expect}=require('@playwright/test');
for(const[locale,route]of[['en','/tools/remittance-compare/'],['fr','/fr/tools/transfert-argent/'],['sw','/sw/zana/ulinganisho-uhamishaji-pesa/']])test(`${locale} native field errors identify and focus invalid quote`,async({page})=>{
 await page.goto(route);
 for(const letter of ['a','b'])for(const[key,value]of Object.entries({label:'Synthetic '+letter,send:'USD',debit:'500',receive:'NGN',recipient:'790000',observed:'2026-01-01T11:00'}))await page.locator(`#rm-${letter}-${key}`).fill(value);
 for(const[field,value]of[['fee','501'],['expires','2025-01-01T11:00'],['observed','2099-01-01T11:00'],['recipient','0']]){
  await page.locator(`#rm-b-${field}`).fill(value);await page.locator('#rm-form button[type=submit]').click();
  await expect(page.locator(`#rm-b-${field}`)).toBeFocused();await expect(page.locator(`#rm-b-${field}`)).toHaveAttribute('aria-invalid','true');await expect(page.locator(`#rm-b-${field}`)).toHaveAttribute('aria-describedby',/rm-error/);
  await expect(page.locator('#rm-error')).toContainText(await page.locator(`label[for="rm-b-${field}"] span`).textContent());
  await page.locator(`#rm-b-${field}`).fill(field==='observed'?'2026-01-01T11:00':field==='recipient'?'790000':'');await expect(page.locator('#rm-error')).toBeEmpty();
 }
 if(locale==='sw')await expect(page.locator('#rm-a-payout')).toContainText('Pochi ya simu');
});

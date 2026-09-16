const{test,expect}=require('@playwright/test');
for(const[locale,route,subtotal,dated]of[
 ['en','/tools/mobile-money-fees/','Amount + published fee (tax excluded)','Current validity is unconfirmed'],
 ['fr','/fr/tools/frais-mobile-money/','Montant + frais publiés (hors taxe)','Sa validité actuelle n’est pas confirmée'],
 ['sw','/sw/zana/ada-pesa-simu/','Kiasi + ada iliyochapishwa (bila kodi)','Uhalali wa sasa haujathibitishwa']
])test(locale+' published tariff arithmetic and source limitations at mobile width',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(route);
 const result=page.locator('#mm-tariff-result');
 async function calculate(provider,action,amount){await page.locator('#mm-provider').selectOption(provider);await page.locator('#mm-action').selectOption(action);await page.locator('#mm-amount').fill(String(amount));await page.locator('#mm-tariff-form button[type=submit]').click();}
 await calculate('mtn-uganda','withdraw',500);await expect(result).toContainText(subtotal);await expect(result).toContainText('830 UGX');
 await expect(result).not.toContainText(locale==='fr'?'Total débité':locale==='sw'?'Jumla inayokatwa':'Total debited');
 await calculate('mtn-uganda','deposit',500);await expect(result).toContainText('0 UGX');
 await calculate('airtel-tanzania','withdraw',3000);await expect(result).toContainText('590 TZS');await expect(result).toContainText('576 TZS');await expect(result).toContainText('14 TZS');await expect(result).toContainText(dated);await expect(result).not.toContainText('604 TZS');
 await calculate('airtel-tanzania','withdraw',5000000);await expect(result).toContainText(/11[\s,]*500 TZS/);await expect(result).toContainText(dated);
 await calculate('airtel-tanzania','send',10000);await expect(result).toContainText('325 TZS');
 await calculate('airtel-tanzania','send',5000001);await expect(result.locator('.mm-unavailable')).toBeVisible();await expect(result).not.toContainText('325 TZS');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await expect(page.locator('[data-provider-table="airtel-tanzania"]')).toContainText(dated);
});

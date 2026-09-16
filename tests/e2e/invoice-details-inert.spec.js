const {test,expect}=require('@playwright/test');
for(const route of ['/tools/invoice-generator/','/fr/tools/generateur-factures/','/sw/zana/kizalishaji-ankara/'])test(`${route} billing details stay text in previews`,async({page})=>{
 await page.goto(route);
 const payload='<img src=x onerror="window.__invoiceXss=1">';
 for(const id of ['businessAddress','businessEmail','businessPhone','taxID','clientCompany','clientAddress','clientEmail']){
  const input=page.locator('#'+id);
  if(!await input.isVisible())await page.locator('details').filter({has:input}).locator('summary').click();
  await input.fill(payload);
 }
 await page.locator('#companyName').focus();
 await expect(page.locator('#pBizDetail')).toContainText(payload);
 await expect(page.locator('#pClientDetail')).toContainText(payload);
 await expect(page.locator('#pBizDetail img,#pClientDetail img')).toHaveCount(0);
 expect(await page.evaluate(()=>window.__invoiceXss||0)).toBe(0);
 // Keep user text intact; only its HTML interpretation changes.
 await expect(page.locator('#businessAddress')).toHaveValue(payload);
});

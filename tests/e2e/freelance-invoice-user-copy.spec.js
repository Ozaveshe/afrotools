const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');
for(const route of ['/fr/tools/facture-freelance/','/sw/zana/ankara-ya-freelancer/'])test(`${route} localized exports preserve user words matching labels`,async({page})=>{
 await page.goto(route);
 await page.locator('#freelancerName').fill('Invoice');
 await page.locator('#freelancerContact').fill('fixture-studio@example.test');
 await page.locator('#clientName').fill('Withholding');
 await page.locator('#clientEmail').fill('fixture-client@example.test');
 await page.locator('[data-item-field=description]').first().fill('Receipt');
 await page.locator('#paymentInstructions').fill('Synthetic transfer instructions; use invoice reference INV-LOCAL-42.');
 await page.locator('#clientNote').fill('Description');
 await page.locator('#terms').fill('Total');
 if(await page.locator('#fiExportReview').count())await page.locator('#fiExportReview').check();
 for(const id of ['pdfBtn','txtBtn','docBtn']){
  const pending=page.waitForEvent('download');await page.locator('#'+id).click();
  const bytes=fs.readFileSync(await(await pending).path());
  const text=id==='pdfBtn'?(await pdfParse(bytes)).text:bytes.toString('utf8');
  // These are intentionally exact dictionary keys, entered by the user.
  // Native titles are FACTURE/ANKARA and REÇU/RISITI, so the English values
  // cannot be satisfied by translated chrome or document headings.
  for(const word of ['Invoice','Withholding','Receipt','Description','Total'])expect(text).toContain(word);
 }
});

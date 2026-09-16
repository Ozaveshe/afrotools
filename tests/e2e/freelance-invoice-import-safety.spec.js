const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const routes={en:'/tools/freelance-invoice/',fr:'/fr/tools/facture-freelance/',sw:'/sw/zana/ankara-ya-freelancer/'};
for(const [locale,route]of Object.entries(routes))test(`${locale} freelance imports reject unrelated and unsafe JSON without changing the draft`,async({page})=>{
 const requests=[];page.on('request',r=>requests.push(r.url()+' '+(r.postData()||'')));
 await page.goto(route);
 await page.locator('#freelancerName').fill('Synthetic importer studio');
 await page.locator('#freelancerContact').fill('import-studio@example.test');
 await page.locator('#clientName').fill('Synthetic importer client');
 await page.locator('#clientEmail').fill('import-client@example.test');
 await page.locator('#invoiceNumber').fill('IMPORT-KEEP-42');
 await page.locator('[data-item-field=description]').first().fill('Synthetic import review');
 await page.locator('[data-item-field=quantity]').first().fill('3');
 await page.locator('[data-item-field=rate]').first().fill('19.99');
 await page.locator('#paymentInstructions').fill('Synthetic transfer instructions; use reference IMPORT-KEEP-42.');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools-freelance-invoice-current-v1')||'{}').meta?.number)).toBe('IMPORT-KEEP-42');
 await page.locator('#fiExportReview').check();
 const pending=page.waitForEvent('download');await page.locator('#jsonBtn').click();
 const bytes=fs.readFileSync(await(await pending).path()),backup=JSON.parse(bytes.toString('utf8'));
 const badInputs=[{},[],{version:1,data:{project:'unrelated'}},{...backup,version:999},{...backup,data:{...backup.data,lineItems:[{...backup.data.lineItems[0],rate:'not a number'}]}},JSON.parse(JSON.stringify(backup).replace('"data":{','"data":{"__proto__":{"invoiceImportPolluted":"yes"},'))];
 for(const bad of badInputs){
  await page.locator('#importJson').setInputFiles({name:'invalid-invoice.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
  await expect(page.locator('#importJson')).toHaveValue('');
  await expect(page.locator('.fi-toast')).toContainText(locale==='fr'?'inchangée':locale==='sw'?'haijabadilika':'unchanged');
  await expect(page.locator('#invoiceNumber')).toHaveValue('IMPORT-KEEP-42');
  await expect(page.locator('[data-item-field=rate]').first()).toHaveValue('19.99');
  expect(await page.evaluate(()=>({}).invoiceImportPolluted)).toBeUndefined();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools-freelance-invoice-current-v1')).meta.number)).toBe('IMPORT-KEEP-42');
 }
 // Both the existing version-1 envelope and legacy bare state remain portable.
 for(const valid of [backup,backup.data]){
  await page.locator('#invoiceNumber').fill('Changed');
  await page.locator('#importJson').setInputFiles({name:'valid-invoice.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(valid))});
  await expect(page.locator('#invoiceNumber')).toHaveValue('IMPORT-KEEP-42');
  await expect(page.locator('[data-item-field=rate]').first()).toHaveValue('19.99');
 }
 expect(requests.filter(x=>/IMPORT-KEEP-42|import-studio|import-client/.test(x))).toEqual([]);
});

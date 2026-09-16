const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');
const routes={en:'/tools/invoice-generator/',fr:'/fr/tools/generateur-factures/',sw:'/sw/zana/kizalishaji-ankara/'};
const labels={en:['INVOICE','QUOTE / ESTIMATE','RECEIPT','Subtotal','Discount','Withholding','Amount paid','Balance due'],fr:['FACTURE','DEVIS','REÇU','Sous-total','Remise','Retenue','Montant payé','Solde dû'],sw:['ANKARA','MAKADIRIO','RISITI','Jumla ndogo','Punguzo','Kodi iliyozuiliwa','Kiasi kilicholipwa','Salio linalodaiwa']};
async function reveal(page,id){const input=page.locator('#'+id);for(const detail of await input.locator('xpath=ancestor::details').all())if(await detail.getAttribute('open')===null)await detail.locator('summary').first().click();return input;}
async function download(page,id){const pending=page.waitForEvent('download');await (await reveal(page,id)).click();const file=await pending;return {name:file.suggestedFilename(),bytes:fs.readFileSync(await file.path())};}
for(const [locale,route]of Object.entries(routes))test(`${locale} invoice has local saved state, explicit sharing and matching native PDF modes`,async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:320,height:844});
 const requests=[],errors=[],downloads=[];
 page.on('download',file=>downloads.push(file));
 page.on('request',r=>requests.push(r.url()+' '+(r.postData()||'')));
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__copies=[];window.__prints=0;Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__copies.push(text)}});window.print=()=>window.__prints++;});
 await page.goto(route);
 await page.locator('#companyName').fill('Synthetic Local Studio INV-PRIVATE-42');
 await page.locator('#clientName').fill('Synthetic Local Client');
 await (await reveal(page,'clientEmail')).fill('invoice-fixture@example.test');
 await page.locator('#currency').selectOption('USD');
 await page.locator('.li-desc').first().fill('Synthetic consulting');
 await page.locator('.li-qty').first().fill('3');
 await page.locator('.li-price').first().fill('19.99');
 await page.locator('#discountPercent').fill('10');
 await (await reveal(page,'taxType')).selectOption('vat');
 await page.locator('#taxRate').fill('7.5');
 await (await reveal(page,'withholdingPercent')).fill('5');
 await (await reveal(page,'amountPaid')).fill('10');
 await (await reveal(page,'bankDetails')).fill('Synthetic transfer reference INV-PRIVATE-42');
 await page.locator('#companyName').focus();
 await expect(page.locator('#sumTotal')).toContainText('58.02');
 await expect(page.locator('#sumBalance')).toContainText('45.32');
 await page.locator('#btnSaveClient').click();
 await expect(page.locator('.client-item')).toHaveCount(1);
 await page.locator('#clientName').fill('Changed');
 await page.locator('.client-item-name').click();
 await expect(page.locator('#clientName')).toHaveValue('Synthetic Local Client');
 await (await reveal(page,'btnSaveItem')).click();
 await page.locator('.li-desc').first().fill('');
 await page.locator('#savedItemSelect').selectOption('0');
 await page.locator('#btnApplySavedItem').click();
 await expect(page.locator('.li-desc').first()).toHaveValue('Synthetic consulting');
 await page.locator('#btnSaveInvoice').click();
 await expect(page.locator('.invoice-saved-card')).toHaveCount(1);
 await page.locator('#companyName').fill('Changed');
 await page.locator('.invoice-saved-card').click();
 await expect(page.locator('#companyName')).toHaveValue('Synthetic Local Studio INV-PRIVATE-42');
 await page.locator('#invoiceReviewConfirm').check();
 await page.locator('.li-desc').first().fill('Synthetic consulting reviewed');
 await expect(page.locator('#invoiceReviewConfirm')).not.toBeChecked();
 await page.locator('#btnPDF').click();
 await expect(page.locator('#invoiceReviewConfirm')).toBeFocused();
 await (await reveal(page,'btnExportJson')).click();
 await expect(page.locator('#invoiceReviewConfirm')).toBeFocused();
 expect(downloads).toHaveLength(0);
 await page.locator('#invoiceReviewConfirm').check();
 const json=await download(page,'btnExportJson');
 const state=JSON.parse(json.bytes.toString('utf8'));
 expect(state).toMatchObject({cu:'USD',ap:'10',wh:'5',bd:'Synthetic transfer reference INV-PRIVATE-42'});
 await page.locator('#companyName').fill('Changed');
 await page.locator('#importJsonInput').setInputFiles({name:'synthetic-invoice.json',mimeType:'application/json',buffer:json.bytes});
 await expect(page.locator('#companyName')).toHaveValue('Synthetic Local Studio INV-PRIVATE-42');
 await expect(page.locator('#sumBalance')).toContainText('45.32');
 await (await reveal(page,'btnPrint')).click();
 expect(await page.evaluate(()=>window.__prints)).toBe(1);
 await expect(page.locator('#includeInvoiceDataInLink')).not.toBeChecked();
 await page.locator('#btnShare').click();
 await expect.poll(()=>page.evaluate(()=>window.__copies.length)).toBe(1);
 expect(new URL(await page.evaluate(()=>window.__copies[0])).search).toBe('');
 expect(await page.evaluate(()=>window.__copies[0])).not.toContain('INV-PRIVATE-42');
 await page.locator('#includeInvoiceDataInLink').check();
 await page.locator('#btnShare').click();
 await expect.poll(()=>page.evaluate(()=>window.__copies.length)).toBe(2);
 const shared=new URL(await page.evaluate(()=>window.__copies[1]));
 expect(JSON.parse(Buffer.from(shared.searchParams.get('invoice'),'base64url').toString('utf8'))).toMatchObject({bd:'Synthetic transfer reference INV-PRIVATE-42',cu:'USD'});
 await page.locator('#includeInvoiceDataInLink').uncheck();
 for(const [index,mode]of ['invoice','estimate','receipt'].entries()){
  await page.locator('#documentType').selectOption(mode);
  // The existing receipt mode marks the document paid. Explicitly clear that
  // choice to verify a partial-payment receipt with the same entered amounts.
  if(mode==='receipt'){
   await page.locator('#markPaid').uncheck();
   await (await reveal(page,'amountPaid')).fill('10');
   await expect(page.locator('#sumBalance')).toContainText('45.32');
  }
  await page.locator('#invoiceReviewConfirm').check();
  const file=await download(page,'btnPDF');
  const text=(await pdfParse(file.bytes)).text;
  expect(text).toContain(labels[locale][index]);
  for(const label of labels[locale].slice(3))expect(text).toContain(label);
  for(const amount of ['59.97','6.00','4.05','58.02','2.70','10.00','45.32'])expect(text).toContain(amount);
  expect(text).toContain('Synthetic transfer reference INV-PRIVATE-42');
  expect(file.name).toMatch(/\.pdf$/);
 }
 await page.locator('.li-price').first().fill('19.995');
 await expect(page.locator('#pItems')).toContainText('19.995');
 await expect(page.locator('#sumBalance')).toContainText('45.34');
 for(const currency of ['NGN','MAD','TND']){
  await page.locator('#currency').selectOption(currency);
  // Currency selection applies an existing country tax preset; restore the
  // explicit synthetic assumption instead of treating that preset as law.
  await (await reveal(page,'taxType')).selectOption('vat');
  await page.locator('#taxRate').fill('7.5');
  await expect(page.locator('#sumBalance')).toContainText('45.34');
  await page.locator('#invoiceReviewConfirm').check();
  const file=await download(page,'btnPDF'),text=(await pdfParse(file.bytes)).text;
  // Standard PDF fonts cannot encode naira/Arabic currency symbols. The ISO
  // code keeps both the currency and numeric amount readable to parsers.
  expect(text).toContain(currency+' 19.995');
  expect(text).toContain(currency+' 45.34');
  expect(text).not.toContain('\u0000');
 }
 await page.reload();
 await expect(page.locator('#includeInvoiceDataInLink')).not.toBeChecked();
 await expect(page.locator('.invoice-saved-card')).toHaveCount(1);
 await page.locator('.invoice-saved-card').click();
 await expect(page.locator('#sumBalance')).toContainText('45.32');
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
 expect(requests.filter(value=>/INV-PRIVATE-42|invoice-fixture@example/.test(value))).toEqual([]);
 expect(errors).toEqual([]);
});

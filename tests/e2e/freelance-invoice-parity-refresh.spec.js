const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');
const routes={en:'/tools/freelance-invoice/',fr:'/fr/tools/facture-freelance/',sw:'/sw/zana/ankara-ya-freelancer/'};
for(const [locale,route] of Object.entries(routes))test(`${locale} freelance edits survive field blur, saved drafts and parsed exports`,async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 const requests=[],errors=[];
 page.on('request',r=>requests.push(r.url()+' '+(r.postData()||'')));
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(route);
 await page.locator('#country').selectOption('Pan-African');
 await page.locator('#currency').selectOption('USD');
 await page.locator('#freelancerName').fill('Synthetic Invoice Studio');
 await page.locator('#freelancerContact').fill('fixture-studio@example.test');
 await page.locator('#clientName').fill('Synthetic Invoice Client');
 await page.locator('#clientEmail').fill('fixture-client@example.test');
 const instructions='Synthetic transfer instructions; use invoice reference INV-LOCAL-42.';
 await page.locator('#paymentInstructions').fill(instructions);
 // Blur previously rebuilt these controls and redirected typing into the old field.
 const description=page.locator('[data-item-field=description]').first();
 await description.evaluate(e=>{window.__invoiceLineNode=e;});
 await description.fill('Synthetic consulting INV-LOCAL-42');
 await expect(description).toHaveValue('Synthetic consulting INV-LOCAL-42');
 expect(await description.evaluate(e=>e===window.__invoiceLineNode)).toBe(true);
 await expect(page.locator('#paymentInstructions')).toHaveValue(instructions);
 await page.locator('[data-item-field=quantity]').first().fill('3');
 await page.locator('[data-item-field=rate]').first().fill('19.99');
 await page.locator('#discountPct').fill('10');
 await page.locator('#taxPct').fill('7.5');
 await page.locator('#withholdingPct').fill('5');
 await page.locator('#amountPaid').fill('10');
 await expect(page.locator('#invoicePreview')).toContainText('59.97');
 await expect(page.locator('#invoicePreview')).toContainText('45.32');
 // A real local save followed by a new document and a restored saved record.
 await page.locator('#invoicePreview').focus();
 await page.locator('#saveInvoiceBtn').focus();
 await page.locator('#saveInvoiceBtn').press('Enter');
 await expect(page.locator('[data-open-saved]')).toHaveCount(1);
 await page.locator('#newInvoiceBtn').click();
 await page.locator('[data-open-saved]').click();
 await expect(description).toHaveValue('Synthetic consulting INV-LOCAL-42');
 await expect(page.locator('#currency')).toHaveValue('USD');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools-freelance-invoice-current-v1')||'{}').lineItems?.[0]?.rate)).toBe(19.99);
 await page.reload();
 await expect(description).toHaveValue('Synthetic consulting INV-LOCAL-42');
 await expect(page.locator('#paymentInstructions')).toHaveValue(instructions);
 if(await page.locator('#fiExportReview').count())await page.locator('#fiExportReview').check();
 const exports={};
 for(const [id,format]of [['jsonBtn','json'],['csvBtn','csv'],['txtBtn','txt'],['docBtn','doc'],['pdfBtn','pdf']]){
  const pending=page.waitForEvent('download');await page.locator('#'+id).click();const download=await pending;
  const bytes=fs.readFileSync(await download.path());exports[format]=format==='pdf'?(await pdfParse(bytes)).text:bytes.toString('utf8');
 }
 const data=JSON.parse(exports.json).data;
 expect(data.lineItems[0]).toMatchObject({description:'Synthetic consulting INV-LOCAL-42',quantity:3,rate:19.99});
 expect(data.payment.instructions).toBe(instructions);
 for(const format of ['txt','doc','pdf']){
  expect(exports[format]).toContain('Synthetic consulting INV-LOCAL-42');
  expect(exports[format]).toContain('45.32');
  expect(exports[format]).not.toContain('150,000');
 }
 expect(exports.pdf).toContain('USD 59.97');
 expect(exports.pdf).toContain('USD 58.02');
 const csv=Object.fromEntries(exports.csv.split(/\r?\n/).filter(x=>/^(Subtotal|Discount|Tax|Total|Withholding|Paid|Balance due),/.test(x)).map(x=>{const[k,v]=x.split(',');return[k,Number(v)];}));
 expect(csv.Subtotal).toBeCloseTo(59.97,8);
 expect(csv.Total).toBeCloseTo(58.020975,8);
 expect(csv['Balance due']).toBeCloseTo(45.322325,8);
 // Import the portable backup through the visible file input.
 await page.locator('#newInvoiceBtn').click();
 await page.locator('#importJson').setInputFiles({name:'synthetic-invoice.json',mimeType:'application/json',buffer:Buffer.from(exports.json)});
 await expect(description).toHaveValue('Synthetic consulting INV-LOCAL-42');
 await expect(page.locator('#invoicePreview')).toContainText('45.32');
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 expect(requests.filter(x=>/INV-LOCAL-42|fixture-studio|fixture-client/.test(x))).toEqual([]);
 expect(errors).toEqual([]);
});

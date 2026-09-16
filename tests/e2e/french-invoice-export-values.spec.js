const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');
async function file(page,id){const next=page.waitForEvent('download');await page.locator('#'+id).click();return fs.readFileSync(await(await next).path());}
test('French invoice JSON preserves user values that collide with export labels',async({page})=>{
 await page.goto('/fr/tools/generateur-factures/');
 await page.locator('#companyName').fill('Revenue');
 await page.locator('#clientName').fill('Year 1');
 await page.locator('.li-desc').first().fill('Gross profit');
 await page.locator('.li-price').first().fill('10');
 await page.locator('details.action-more summary').click();
 await page.locator('#invoiceReviewConfirm').check();
 const bytes=await file(page,'btnExportJson'),data=JSON.parse(bytes.toString('utf8'));
 expect(data.cn).toBe('Revenue');expect(data.cl).toBe('Year 1');expect(data.items[0].d).toBe('Gross profit');
 await page.locator('#companyName').fill('Changed');
 await page.locator('#importJsonInput').setInputFiles({name:'invoice.json',mimeType:'application/json',buffer:bytes});
 await expect(page.locator('#companyName')).toHaveValue('Revenue');
 await expect(page.locator('#clientName')).toHaveValue('Year 1');
});
test('French freelance source-owned JSON CSV TXT DOC and PDF keep label-like user values intact',async({page})=>{
 await page.goto('/fr/tools/facture-freelance/');
 await page.locator('#freelancerName').fill('Revenue');
 await page.locator('#freelancerContact').fill('fixture-studio@example.test');
 await page.locator('#clientName').fill('Year 1');
 await page.locator('#clientEmail').fill('fixture-client@example.test');
 await page.locator('[data-item-field=description]').first().fill('Gross profit');
 await page.locator('#clientNote').fill('Year 2');
 await page.locator('#paymentInstructions').fill('Synthetic transfer instructions; use invoice reference INV-LOCAL-42.');
 await page.locator('#fiExportReview').check();
 const json=JSON.parse((await file(page,'jsonBtn')).toString('utf8'));
 expect(json.data.freelancer.name).toBe('Revenue');expect(json.data.client.name).toBe('Year 1');expect(json.data.lineItems[0].description).toBe('Gross profit');expect(json.data.notes.clientNote).toBe('Year 2');
 const csv=(await file(page,'csvBtn')).toString('utf8');expect(csv).toContain(',Gross profit,');expect(csv).toContain('Sous-total');
 const txt=(await file(page,'txtBtn')).toString('utf8');expect(txt).toContain('Revenue');expect(txt).toContain('Year 2');expect(txt).toContain('Solde dû');
 const doc=(await file(page,'docBtn')).toString('utf8');expect(doc).toContain('<strong>Revenue</strong>');expect(doc).toContain('<strong>Gross profit</strong>');expect(doc).toContain('Solde dû');
 const pdf=(await pdfParse(await file(page,'pdfBtn'))).text;expect(pdf).toContain('Revenue');expect(pdf).toContain('Gross profit');expect(pdf).toContain('FACTURE');
});

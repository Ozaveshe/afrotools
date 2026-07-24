const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const routes = [
  { name:'en',path:'/ghana/gh-vat',calculate:'Calculate Ghana VAT' },
  { name:'fr',path:'/fr/ghana/gh-vat',calculate:'Calculer la TVA Ghana' },
  { name:'sw',path:'/sw/ghana/kikokotoo-vat/',calculate:'Kokotoa VAT ya Ghana' }
];

for (const route of routes) {
  test(`${route.name} Ghana VAT VIP parity`, async ({ page }) => {
    const errors=[]; const nonGet=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{ if(message.type()==='error') errors.push(message.text()); });
    page.on('request',request=>{ if(request.method()!=='GET') nonGet.push(`${request.method()} ${request.url()}`); });
    await page.emulateMedia({ colorScheme:'dark',reducedMotion:'reduce' }); await page.setViewportSize({ width:375,height:812 });
    await page.goto(route.path,{ waitUntil:'networkidle' }); await expect(page.locator('html')).toHaveAttribute('lang',route.name);
    expect(await page.locator('#ghvInvoiceQty').evaluate(element=>getComputedStyle(element).appearance)).toBe('textfield');
    await expect(page.getByRole('button',{ name:route.calculate })).toBeVisible();
    expect(await page.evaluate(()=>window.GHVatApp.getResult())).toMatchObject({base:1000,vat:150,nhil:25,getfund:25,totalTax:200,gross:1200});
    await page.locator('[data-mode="extract"]').click(); await page.locator('#ghvAmount').fill('1200'); expect(await page.evaluate(()=>window.GHVatApp.getResult())).toMatchObject({base:1000,vat:150,nhil:25,getfund:25,gross:1200});
    await page.locator('[data-rate-kind="scenario"]').click(); await page.locator('#ghvCustomRate').fill('10'); await page.locator('[data-mode="add"]').click(); await page.locator('#ghvAmount').fill('1000'); expect(await page.evaluate(()=>window.GHVatApp.getResult())).toMatchObject({effectiveRate:10,vat:100,nhil:0,getfund:0,gross:1100}); await expect(page.locator('#ghvNhilLabel')).toContainText(route.name==='fr'?'non modélisée':route.name==='sw'?'haijakokotolewa':'not modelled');
    await page.locator('[data-rate-kind="zero"]').click(); await expect(page.locator('#ghvTax')).toContainText('0');
    await page.locator('[data-rate-kind="standard"]').click(); await page.locator('#ghvInvoiceQty').fill('2'); await page.locator('#ghvInvoiceUnit').fill('500'); await page.locator('#ghvInvoiceForm').evaluate(form=>form.requestSubmit()); await expect(page.locator('#ghvInvoiceVat')).toContainText('150'); await expect(page.locator('#ghvInvoiceLevies')).toContainText('50');
    await page.locator('#ghvClassification').selectOption('confirmed-relieved'); await expect(page.locator('#ghvClassificationResult')).toContainText('Act 1151');
    await page.locator('#ghvAmount').fill('1000'); const downloadPromise=page.waitForEvent('download'); await page.locator('#ghvPdf').click(); const download=await downloadPromise; const parsed=await pdfParse(fs.readFileSync(await download.path())); expect(parsed.text).toContain('Ghana'); expect(parsed.text).toContain('1000.00'); expect(parsed.text).toContain('150.00'); expect(parsed.text).toContain('25.00');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>/ghv|vat/i.test(key)))).toEqual([]); expect(nonGet).toEqual([]); expect(errors).toEqual([]);
    await expect(page.locator('afro-site-assistant')).toBeHidden();
    // Hide the shared sticky shell only for the stitched full-page artifact; its
    // fixed host otherwise appears mid-image as Playwright scrolls each tile.
    await page.locator('afro-navbar').evaluate(element=>element.style.setProperty('display','none','important'));
    await page.screenshot({ path:`artifacts/ghana-vat-${route.name}-375-dark.png`,fullPage:true });
  });
}

test('Ghana VAT widget 320 dark parity', async ({ page }) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message)); page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.setViewportSize({width:320,height:640}); await page.goto('/widgets/iframe/financial-ghana-vat.html?theme=dark',{waitUntil:'networkidle'});
  await page.locator('#awGhAmount').fill('1000'); await expect(page.locator('[data-ref="vat"]')).toContainText('150'); await expect(page.locator('[data-ref="nhil"]')).toContainText('25'); await expect(page.locator('[data-ref="total"]')).toContainText('1,200');
  await page.locator('[data-m="extract"]').click(); await page.locator('#awGhAmount').fill('1200'); await expect(page.locator('[data-ref="base"]')).toContainText('1,000');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0); expect(errors).toEqual([]);
  await page.screenshot({path:'artifacts/ghana-vat-widget-320-dark.png',fullPage:true});
});

const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');
const normalize=text=>text.normalize('NFKC').replace(/\s+/g,' ').trim();
for(const item of [{locale:'fr',route:'/fr/tools/planificateur-budget/'},{locale:'sw',route:'/sw/zana/mpango-bajeti/'}]) {
 test(`${item.locale}: all advertised budget currencies retain numeric PDF text`,async({page},testInfo)=>{
  test.setTimeout(120000);await page.setViewportSize({width:390,height:900});await page.goto(item.route);
  const currency=page.locator('[name="currency"]');const values=await currency.locator('option').evaluateAll(options=>options.map(option=>option.value));
  expect(values).toContain('XOF');expect(values).toContain('XAF');
  for(const value of values){
   await currency.selectOption(value);await page.locator('[name="incomeMain"]').fill('1234567');
   await page.locator('[data-business-form]').evaluate(form=>form.requestSubmit());await expect(page.locator('[data-business-result]')).toBeVisible();
   const metrics=await page.locator('[data-result-metrics] strong').allTextContents();
   const pending=page.waitForEvent('download');await page.locator('[data-export="pdf"]').click();const download=await pending;const bytes=fs.readFileSync(await download.path());fs.mkdirSync(testInfo.outputDir,{recursive:true});fs.writeFileSync(testInfo.outputPath(item.locale+'-'+value+'.pdf'),bytes);const parsed=await pdfParse(bytes);
   expect(parsed.numpages).toBe(1);for(const metric of metrics)expect(normalize(parsed.text)).toContain(normalize(metric));
  }
 });
}

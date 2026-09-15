const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
test('French BOQ descriptive labels and reopened CSV preserve English quantities and totals',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/tools/boq-generator/');await page.locator('button[onclick="generate()"]').click();const english=await page.evaluate(()=>window._boqExportData);
 await page.goto('/fr/tools/generateur-boq/');await page.locator('button[onclick="generate()"]').click();const french=await page.evaluate(()=>window._boqExportData);
 expect(french.grandTotal).toBe(12910759);expect(french.grandTotal).toBe(english.grandTotal);expect(french.allItems.map(({id,qty,rate,amount})=>({id,qty,rate,amount}))).toEqual(english.allItems.map(({id,qty,rate,amount})=>({id,qty,rate,amount})));
 for(const label of ['Vis de toiture avec rondelles','Faîtière et solins','Panneaux de plafond en PVC ou fibres dures'])await expect(page.locator('#boqTableWrap')).toContainText(label);
 const download=page.waitForEvent('download');await page.locator('button[onclick="exportCSV()"]').click();const content=await fs.readFile(await(await download).path(),'utf8');for(const label of ['Vis de toiture avec rondelles','Faîtière et solins','Panneaux de plafond en PVC ou fibres dures'])expect(content).toContain(label);expect(content).not.toMatch(/Roofing screws|Ridge cap|Ceiling board/);expect(content).toContain('12910759');
});

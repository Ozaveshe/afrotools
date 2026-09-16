const{test,expect}=require('@playwright/test');
test.beforeEach(async({page,baseURL})=>{await page.route('**/*',r=>r.request().url().startsWith(baseURL)?r.continue():r.abort());});
test('French checklist preserves literal text; invalid payroll clears results and all exports',async({page})=>{
 await page.goto('/fr/tools/salaire-minimum/');
 const literal='<b data-synthetic="1">Synthetic market</b>';
 await page.locator('#country').fill(literal);await page.locator('#role').fill(literal);
 await expect(page.locator('#checklist b')).toHaveCount(0);await expect(page.locator('#checklist')).toContainText(literal);
 for(const [field,value] of [['minWage',''],['minWage','-1'],['actualPay','-1'],['hoursWeek','0'],['daysMonth','32']]){
  await page.locator('#sampleBtn').click();await page.locator('#'+field).fill(value);
  await expect(page.locator('#complianceOut')).toHaveText('Calcul indisponible');
  await expect(page.locator('#summaryOutput')).toBeEmpty();await expect(page.locator('#scenarioRows')).toBeEmpty();
  await expect(page.locator('#downloadSummary')).toBeDisabled();await expect(page.locator('#copySummary')).toBeDisabled();
  expect(await page.locator('.fr-finance-export-actions button').evaluateAll(nodes=>nodes.every(n=>n.disabled))).toBe(true);
  const error=await page.evaluate(()=>AfroTools.frenchFinanceExport.run('csv').then(()=>null,error=>error.message));expect(error).toContain('Corrigez');
 }
 await page.locator('#sampleBtn').click();await page.locator('#actualPay').fill('0');await expect(page.locator('#downloadSummary')).toBeEnabled();
 await expect(page.locator('#complianceOut')).toHaveText('Sous le minimum');
 await page.locator('#resetBtn').click();await expect(page.locator('#downloadSummary')).toBeEnabled();
});
for(const route of ['/tools/minimum-wage/','/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/'])test('USD ranking membership survives country sort '+route,async({page})=>{
 await page.goto(route);await page.locator('#filter-top10').click();
 const before=await page.locator('#table-body .ct-name').allTextContents();
 await page.locator('.mw-country-table thead th').nth(1).click();await page.locator('#filter-top10').click();
 const after=await page.locator('#table-body .ct-name').allTextContents();expect(after.slice().sort()).toEqual(before.slice().sort());
 const ranks=await page.locator('#table-body .ct-rank').allTextContents();expect(ranks.map(Number).sort((a,b)=>a-b)).toEqual([1,2,3,4,5,6,7,8,9,10]);
 await page.locator('#filter-bot10').click();const bottom=await page.locator('#table-body .ct-name').allTextContents();await page.locator('.mw-country-table thead th').nth(3).click();expect((await page.locator('#table-body .ct-name').allTextContents()).slice().sort()).toEqual(bottom.slice().sort());
});

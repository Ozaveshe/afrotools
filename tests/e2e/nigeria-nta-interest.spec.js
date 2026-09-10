const {test,expect}=require('@playwright/test'); const fs=require('node:fs');
test('NTA eligible interest above rent cap: save reload PDF and invalid recovery',async({page,context})=>{
 await context.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));
 await page.setViewportSize({width:390,height:844});await page.goto('/nigeria/ng-salary-tax');await page.locator('#tabNta').click();
 for(const id of ['pension','nhf','nhis'])await page.locator(`[data-tog="${id}"]`).click();
 await page.locator('#grossSalary').focus();await page.locator('#grossSalary').fill('3000000');
 await page.locator('[data-tog="homeloan"]').click();await page.locator('#homeloanAmt').fill('600000');await page.locator('#calcBtn').click();
 expect(await page.evaluate(()=>({tax:RESULT.tax,taxable:RESULT.taxable,interest:RESULT.homeloan}))).toEqual({tax:240000,taxable:2400000,interest:600000});
 await expect(page.locator('#homeLoanHelp')).toContainText('Exclude principal');await expect(page.locator('#homeLoanLimitHint')).toHaveText('NTA: no fixed cap');
 await page.locator('#calcSaveName').fill('Synthetic qualifying interest');await page.locator('#calcSaveBtn').click();
 await expect(page.locator('#calcSaveStatus')).toContainText('Saved on this device');await page.reload();await page.locator('#calcBtn').click();await page.locator('#calcSavedList').getByRole('button',{name:'Load',exact:true}).click();await page.locator('#calcBtn').click();
 expect(await page.evaluate(()=>({regime:RESULT.regime,tax:RESULT.tax,interest:RESULT.homeloan}))).toEqual({regime:'nta',tax:240000,interest:600000});
 const download=page.waitForEvent('download');await page.locator('#pdfBtn').click();const pdf=await require('pdf-parse')(fs.readFileSync(await(await download).path()));expect(pdf.text).toContain('600,000');expect(pdf.text).toContain('240,000');expect(pdf.text).toContain('2,160,000');expect(pdf.text).toContain('owner-occupied');
 for(const input of ['-1','600000abc']){await page.locator('#homeloanAmt').focus();await page.locator('#homeloanAmt').fill(input);await page.locator('#calcBtn').click();await expect(page.locator('#homeLoanError')).toContainText('non-negative');await expect(page.locator('#resultsCard')).toBeHidden();}
 await page.locator('#homeloanAmt').fill('600000');await page.locator('#calcBtn').click();await expect(page.locator('#resultsCard')).toBeVisible();expect(await page.evaluate(()=>RESULT.tax)).toBe(240000);
 await page.locator('[data-tog="homeloan"]').click();await page.locator('#calcBtn').click();expect(await page.evaluate(()=>RESULT.tax)).toBe(330000);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

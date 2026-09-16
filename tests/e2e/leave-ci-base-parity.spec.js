const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
for(const [locale,route] of [['en','/tools/leave-calculator/'],['sw','/sw/zana/kikokotoo-likizo/']])test(`${locale}: CI unrounded annual base and TXT preserve source limits`,async({page})=>{
 await page.goto(route);const decline=page.getByRole('button',{name:locale==='sw'?'Kataa uchanganuzi':'Decline analytics',exact:true});if(await decline.isVisible())await decline.click();
 await page.locator('#lc-country').selectOption('CI');
 const summary=await page.evaluate(()=>lcBuildSummary());expect(summary).toContain('26.4');expect(summary).toContain('25.1');expect(summary).toContain(locale==='sw'?'bila kuzungusha':'not calculated');
 const download=page.waitForEvent('download');await page.locator('[onclick="lcDownloadSummary()"]').click();expect(fs.readFileSync(await(await download).path(),'utf8')).toContain('26.4');
 await page.locator('#lc-tab-accrual').click();await page.locator('#ac-country').selectOption('CI');await expect(page.locator('#ac-entitlement')).toHaveValue('26.4');
 expect(await page.locator('#ac-entitlement').evaluate(el=>el.checkValidity())).toBe(true);
 await page.locator('#ac-start').fill('2026-01-01');await page.locator('#ac-today').fill('2026-07-02');
 // 182 elapsed days / 365 * 26.4 = 13.1638..., existing planning display floors to one decimal.
 await expect(page.locator('#ac-result')).toContainText('13.1');
});
test('fr: CI base, remaining amount and parsed reports retain unrounded limitations',async({page})=>{
 await page.goto('/fr/tools/calculateur-conges-pto/');const form=page.locator('[data-frhr-app] form').first();await form.locator('#country').selectOption('CI');await form.locator('#daysTaken').fill('4');await form.getByRole('button',{name:'Afficher et calculer'}).click();
 const result=page.locator('[data-result]');await expect(result).toContainText('26.4 jours');await expect(result).toContainText('22.4 jours');await expect(result).toContainText('non arrondie');
 for(const format of ['txt','json','pdf']){const pending=page.waitForEvent('download');await result.locator('[data-'+format+']').click();const body=fs.readFileSync(await(await pending).path());if(format==='json'){const value=JSON.parse(body);expect(value.result.annualLeave.days).toBe(26.4);expect(value.inputs).toEqual({country:'CI',daysTaken:4});}else{const text=format==='pdf'?(await require('pdf-parse')(body)).text:body.toString();expect(text).toContain('22.4 jours');expect(text).toContain('non arrondie');expect(text).toContain('25.1');}}
});

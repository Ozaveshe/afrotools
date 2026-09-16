const {test,expect}=require('@playwright/test');const fs=require('node:fs');
for(const [locale,route]of [['en','/tools/leave-calculator/'],['sw','/sw/zana/kikokotoo-likizo/']])test(`${locale}: six leave views and active TXT exports stay usable`,async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.goto(route);await page.waitForFunction(()=>typeof lcBuildSummary==='function');
 const decline=page.getByRole('button',{name:locale==='sw'?'Kataa uchanganuzi':'Decline analytics',exact:true});if(await decline.isVisible())await decline.click();
 const failures=[];page.on('pageerror',e=>failures.push(e.message));
 await page.locator('#lc-country').selectOption('AO');expect(await page.evaluate(()=>lcBuildSummary())).toContain('Angola');
 await page.locator('#lc-tab-accrual').focus();await page.keyboard.press('Enter');await page.locator('#ac-start').fill('2026-01-01');await page.locator('#ac-today').fill('2026-07-02');await page.locator('#ac-entitlement').fill('12');await expect(page.locator('#ac-result')).toContainText('5.9');
 const dl=page.waitForEvent('download');await page.locator('[onclick="lcDownloadSummary()"]').click();const d=await dl;const txt=fs.readFileSync(await d.path(),'utf8');expect(txt).toContain('5.9');expect(txt).toContain(locale==='sw'?'Limbikizo':'accrual');await info.attach('accrual-txt',{body:txt,contentType:'text/plain'});
 await page.locator('#ac-start').fill('');expect(await page.evaluate(()=>lcBuildSummary())).toBe('');
 for(const tab of ['payout','parental','weekends','compare']){await page.locator('#lc-tab-'+tab).click();await expect(page.locator('#lc-panel-'+tab)).toBeVisible();}
 expect(await page.locator('#lc-tbody tr').count()).toBeGreaterThan(40);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(failures).toEqual([]);
});

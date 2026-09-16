const {test,expect}=require('@playwright/test'),fs=require('node:fs');
for(const [locale,route] of [['en','/tools/leave-calculator/'],['fr','/fr/tools/calculateur-conges-pto/'],['sw','/sw/zana/kikokotoo-likizo/']])test(`${locale}: Cameroon archived baseline has four prenatal weeks and truthful calendar`,async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.goto(route);
 if(locale!=='fr')await page.locator('#lc-tab-parental').click();
 const card=locale==='fr'?page.locator('[data-leave-workflow=parental]'):page.locator('#pp-result');
 await page.locator('#pp-country').selectOption('CM');await page.locator('#pp-type').selectOption('mat');await page.locator('#pp-due').fill('2026-10-29');
 if(locale==='fr'){await card.locator('button[type=submit]').focus();await page.keyboard.press('Enter');}
 await expect(card).toContainText('1992');await expect(card).toContainText('84');
 const schedule=await page.evaluate(fr=>fr?document.querySelector('[data-leave-workflow=parental]')._schedule:lcCurrentPP.schedule,locale==='fr');
 expect(schedule).toMatchObject({start:'2026-10-01',lastLeaveDate:'2027-01-06',endExclusive:'2027-01-07',days:98});
 const pending=page.waitForEvent('download');await (locale==='fr'?card.getByRole('button',{name:'Télécharger ICS'}):card.locator('.lc-ical-btn')).click();
 const body=fs.readFileSync(await(await pending).path(),'utf8').replace(/\r\n[ \t]/g,'');
 const first=body.split('BEGIN:VEVENT')[1].split('END:VEVENT')[0];
 expect(first).toContain('DTSTART;VALUE=DATE:20261001');expect(first).toContain('DTEND;VALUE=DATE:20270107');expect(first).toContain('1992');expect(first).toContain('code_du_travail_1993.pdf');expect(first).toContain(locale==='en'?'unverified':locale==='fr'?'non vérifiés':'havijahakikiwa');
 await info.attach('cameroon-baseline-calendar',{body,contentType:'text/calendar'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#pp-due').fill('');if(locale==='fr')await expect(card.getByRole('button',{name:'Télécharger ICS'})).toBeDisabled();else expect(await page.evaluate(()=>lcCurrentPP)).toBeNull();
 await page.locator('#pp-country').selectOption('AO');await page.locator('#pp-due').fill('2026-10-29');if(locale==='fr')await card.locator('button[type=submit]').click();
 const other=await page.evaluate(fr=>fr?document.querySelector('[data-leave-workflow=parental]')._schedule:lcCurrentPP.schedule,locale==='fr');expect(other.start).toBe('2026-10-15');
});

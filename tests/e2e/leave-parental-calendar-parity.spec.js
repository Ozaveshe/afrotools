const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
function events(text){
 const lines=text.replace(/\r\n[ \t]/g,'').split('\r\n'); const result=[];let event;
 for(const line of lines){if(line==='BEGIN:VEVENT')event={};else if(line==='END:VEVENT'){result.push(event);event=null;}else if(event){const p=line.indexOf(':');if(p>0)event[line.slice(0,p)]=line.slice(p+1);}}
 return result;
}
for(const [locale,route] of [['en','/tools/leave-calculator/'],['sw','/sw/zana/kikokotoo-likizo/']])test(`${locale}: parental dates and parsed ICS retain exact duration and invalidate stale export`,async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});await page.goto(route);
 await page.waitForFunction(()=>typeof ppCalc==='function');
 // Synthetic entitlement isolates date arithmetic from statutory data.
 await page.evaluate(()=>{LEAVE_DATA.AO.patDays=3;LEAVE_DATA.AO.matWeeks=2;});
 await page.locator('#lc-tab-parental').click();
 await page.locator('#pp-country').selectOption('AO');await page.locator('#pp-type').selectOption('pat');await page.locator('#pp-due').fill('2026-09-18');
 expect(await page.evaluate(()=>lcCurrentPP.schedule)).toMatchObject({start:'2026-09-18',lastLeaveDate:'2026-09-22',endExclusive:'2026-09-23',returnDate:'2026-09-23',days:3});
 const downloadPromise=page.waitForEvent('download');await page.locator('#pp-result .lc-ical-btn').click();const download=await downloadPromise;const text=fs.readFileSync(await download.path(),'utf8');const parsed=events(text);
 expect(parsed).toHaveLength(2);expect(parsed[0]['DTSTART;VALUE=DATE']).toBe('20260918');expect(parsed[0]['DTEND;VALUE=DATE']).toBe('20260923');expect(parsed[1]['DTEND;VALUE=DATE']).toBe('20260924');expect(parsed[1].TRIGGER).toBe('-P7D');expect(parsed[0].UID).toBeTruthy();expect(parsed[0].DTSTAMP).toMatch(/^\d{8}T\d{6}Z$/);
 await info.attach('parsed-calendar',{body:text,contentType:'text/calendar'});
 await page.locator('#pp-type').selectOption('mat');expect(await page.evaluate(()=>lcCurrentPP.schedule)).toMatchObject({start:'2026-09-04',lastLeaveDate:'2026-09-17',returnDate:'2026-09-18',days:14});
 await page.locator('#pp-due').fill('');expect(await page.evaluate(()=>lcCurrentPP)).toBeNull();await expect(page.locator('#pp-result')).toBeHidden();
 await page.locator('#pp-due').fill('2026-09-18');await page.evaluate(()=>{LEAVE_DATA.AO.patDays=0;document.getElementById('pp-type').value='pat';ppCalc();});expect(await page.evaluate(()=>lcCurrentPP)).toBeNull();
 await page.evaluate(()=>{LEAVE_DATA.AO.patDays=1;ppCalc();});expect(await page.evaluate(()=>lcCurrentPP.schedule)).toMatchObject({lastLeaveDate:'2026-09-18',returnDate:'2026-09-21'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await info.attach('mobile-plan',{body:await page.screenshot(),contentType:'image/png'});
});

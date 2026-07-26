const {test,expect}=require('@playwright/test');
const path=require('node:path');
const route='/tools/boarding-school/';

test.beforeEach(async({page})=>{await page.goto(route);});

async function fillScenario(page){
 await page.locator('#bs-label').fill('NGN');
 await page.locator('#bs-years').fill('2');
 await page.locator('#bs-terms').fill('3');
 await page.locator('#bs-months').fill('9');
 await page.locator('#bs-trips').fill('6');
 await page.locator('#bs-tuition').fill('100');
 await page.locator('#bs-boarding').fill('50');
 await page.locator('#bs-meals').fill('25');
 await page.locator('#bs-term-extra').fill('25');
 await page.locator('#bs-monthly').fill('10');
 await page.locator('#bs-trip-cost').fill('5');
 await page.locator('#bs-annual').fill('20');
 await page.locator('#bs-startup').fill('200');
 await page.locator('#bs-inflation').fill('0');
 await page.locator('#bs-contingency').fill('0');
 await page.locator('#bs-day').fill('500');
}

test('uses self-hosted typography and has no unsupported preset contract',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.reload();
 await expect(page.locator('body')).toHaveCSS('font-family',/DM Sans/);
 expect(await page.locator('link[href*="fonts.googleapis.com"]').count()).toBe(0);
 expect(await page.locator('select').count()).toBe(0);
 const source=await page.locator('html').innerText();
 expect(source).not.toMatch(/Federal Government College|Government\/Federal Boarding|Mission\/Church School|best value|better academic outcomes/i);
 await expect(page.getByLabel('Tuition and school fees per term')).toBeVisible();
 expect(errors).toEqual([]);
});

test('makes periods explicit and calculates a known full-duration fixture',async({page})=>{
 await fillScenario(page);
 await page.getByRole('button',{name:'Calculate full cost'}).click();
 await expect(page.locator('#bs-result')).toBeVisible();
 await expect(page.locator('#bs-result-summary')).toContainText('2-year scenario using 3 term(s), 9 spending month(s) and 6 chargeable trip(s)');
 await expect(page.locator('#bs-metrics')).toContainText('NGN 940.00');
 await expect(page.locator('#bs-metrics')).toContainText('NGN 1,680.00');
 await expect(page.locator('#bs-metrics')).toContainText('NGN 680.00');
 await expect(page.locator('#bs-schedule tr')).toHaveCount(2);
 await expect(page.locator('#bs-breakdown')).toContainText('NGN 200.00 × 3 terms');
});

test('rejects empty and negative scenarios',async({page})=>{
 await page.getByRole('button',{name:'Calculate full cost'}).click();
 await expect(page.getByRole('alert')).toContainText('Enter at least one');
 await page.locator('#bs-tuition').fill('-1');
 await page.getByRole('button',{name:'Calculate full cost'}).click();
 await expect(page.getByRole('alert')).toContainText('cannot be negative');
});

test('downloads the exact assumptions and print/PDF works at 320px',async({page})=>{
 await fillScenario(page);await page.getByRole('button',{name:'Calculate full cost'}).click();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download TXT'}).click();const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('boarding-school-full-cost-scenario.txt');
 const stream=await download.createReadStream();let text='';for await(const chunk of stream)text+=chunk.toString();
 expect(text).toContain('Terms per year: 3');expect(text).toContain('Spending months per year: 9');expect(text).toContain('Full-duration total: NGN 1,680.00');
 await page.setViewportSize({width:320,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
 let printed=false;await page.exposeFunction('recordPrint',()=>{printed=true;});await page.evaluate(()=>{window.print=()=>window.recordPrint();});await page.getByRole('button',{name:'Print / save PDF'}).click();expect(printed).toBe(true);
 const pdf=await page.pdf({format:'A4'});expect(pdf.length).toBeGreaterThan(1000);
});

test('captures desktop, mobile dark and 200 percent text proof',async({page})=>{
 const artifact=name=>path.join(process.cwd(),'artifacts','day5-boarding-school-vip',name);
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:artifact('desktop-light.png'),fullPage:true});
 await page.emulateMedia({colorScheme:'dark'});await page.setViewportSize({width:375,height:812});await page.screenshot({path:artifact('mobile-dark.png'),fullPage:true});
 await page.setViewportSize({width:750,height:900});await page.evaluate(()=>{document.documentElement.style.zoom='2';});expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);await page.screenshot({path:artifact('text-200-dark.png'),fullPage:true});
});

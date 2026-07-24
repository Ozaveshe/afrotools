const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const routes = [
  { name:'en', path:'/tools/mortgage-calculator/', button:'Calculate mortgage plan', canonical:'https://afrotools.com/tools/mortgage-calculator/', title:'Mortgage Calculator Africa', pdf:'Mortgage Planning Report' },
  { name:'fr', path:'/fr/tools/calculateur-hypothecaire/', button:'Calculer le scénario', canonical:'https://afrotools.com/fr/tools/calculateur-hypothecaire/', title:'Calculateur hypothécaire Afrique', pdf:'Rapport de planification hypothécaire' },
  { name:'sw', path:'/sw/zana/kikokotoo-mkopo-wa-nyumba/', button:'Kokotoa mpango', canonical:'https://afrotools.com/sw/zana/kikokotoo-mkopo-wa-nyumba/', title:'Kikokotoo cha Mkopo wa Nyumba', pdf:'Ripoti ya Mpango wa Mkopo wa Nyumba' }
];

for (const route of routes) test(`${route.name} mortgage planner is private, native and PDF-capable`, async ({ page }) => {
  const errors=[]; const nonGet=[];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if(message.type()==='error') errors.push(message.text()); });
  page.on('request', request => { if(request.method()!=='GET') nonGet.push(`${request.method()} ${request.url()}`); });
  await page.addInitScript(() => { window.__sharedPayload=null; Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{window.__sharedPayload=payload;}}); });
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'}); await page.setViewportSize({width:375,height:812});
  await page.goto(route.path,{waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('lang',route.name);
  await page.evaluate(() => { if (!document.querySelector('afro-site-assistant')) document.body.appendChild(document.createElement('afro-site-assistant')); });
  await expect(page.locator('afro-site-assistant')).toBeHidden();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',route.canonical);
  await page.locator('#currency').selectOption('USD'); await page.locator('#propertyPrice').fill('100000'); await page.locator('#deposit').fill('20000'); await page.locator('#annualRate').fill('12'); await page.locator('#termYears').fill('20'); await page.locator('#upfrontCosts').fill('3000'); await page.locator('#monthlyCosts').fill('250'); await page.locator('#stressIncrease').fill('3');
  await page.getByRole('button',{name:route.button}).click(); await expect(page.locator('#status')).toHaveClass(/error/);
  await page.locator('#confirmedAssumptions').check(); await page.getByRole('button',{name:route.button}).click();
  await expect(page.locator('#monthlyResult')).toContainText(/1.?130/); await expect(page.locator('#loanResult')).toContainText(/80.?000/); await expect(page.locator('#ltvResult')).toContainText('80'); await expect(page.locator('#stressResult')).not.toHaveText('—'); await expect(page.locator('#scheduleRows tr')).toHaveCount(20);
  const downloadPromise=page.waitForEvent('download'); await page.locator('#pdfBtn').click(); const download=await downloadPromise; const saved=await download.path(); const parsed=await pdfParse(fs.readFileSync(saved)); expect(parsed.text).toContain(route.pdf); expect(parsed.text).toMatch(/80.?000/);
  await page.locator('#shareBtn').click(); expect(await page.evaluate(()=>window.__sharedPayload)).toEqual({title:route.title,url:route.canonical});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>/mortgage|hypothe|mkopo/i.test(key)))).toEqual([]);
  const html=await page.locator('html').evaluate(node=>node.outerHTML); expect(html).not.toMatch(/SaveState|fetch\(|XMLHttpRequest|\.netlify\/functions|AI advisor/i);
  expect(nonGet).toEqual([]); expect(errors).toEqual([]);
  await page.screenshot({path:`test-results/mortgage-${route.name}-375-dark.png`,fullPage:true});
});

test('mortgage widget is safe and usable at 320px dark', async ({ page }) => {
  const errors=[]; const nonGet=[]; page.on('pageerror',error=>errors.push(error.message)); page.on('console',message=>{if(message.type()==='error')errors.push(message.text());}); page.on('request',request=>{if(request.method()!=='GET')nonGet.push(request.method());});
  await page.setViewportSize({width:320,height:640}); await page.goto('/widgets/iframe/financial-mortgage-calculator.html?theme=dark',{waitUntil:'networkidle'});
  await page.locator('#aw-currency').selectOption('USD'); await page.locator('#aw-loan').fill('80000'); await page.locator('#aw-rate').fill('12'); await page.locator('#aw-term').fill('20'); await page.locator('#aw-confirm').check(); await page.locator('#aw-calc').click();
  await expect(page.locator('#aw-res')).toContainText('880'); await expect(page.locator('#aw-res')).toContainText('Total interest');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0); expect(nonGet).toEqual([]); expect(errors).toEqual([]);
  await page.screenshot({path:'test-results/mortgage-widget-320-dark.png',fullPage:true});
});

test('French mortgage widget parent is a dark-safe shareable surface', async ({ page }) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message)); page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'}); await page.setViewportSize({width:375,height:812}); await page.goto('/fr/widgets/calculateur-hypothecaire/',{waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('lang','fr'); await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://afrotools.com/fr/widgets/calculateur-hypothecaire/'); await expect(page.locator('.fr-widget-code')).toContainText('financial-mortgage-calculator.html');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0); expect(errors).toEqual([]); await page.screenshot({path:'test-results/mortgage-fr-widget-parent-375-dark.png',fullPage:true});
});

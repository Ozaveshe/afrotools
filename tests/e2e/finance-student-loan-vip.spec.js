const { test, expect } = require('@playwright/test');

const routes = [{ path: '/tools/student-loan/', lang: 'en' }, { path: '/fr/tools/pret-etudiant/', lang: 'fr' }];

async function fillPlan(page) {
  const values = {'#sl-balance':'10000','#sl-financed-fees':'500','#sl-rate':'0','#sl-months':'10','#sl-grace':'2','#sl-monthly-fee':'10','#sl-extra':'0','#sl-income':'5000','#sl-debts':'500','#sl-source':'Synthetic statement','#sl-date':'2026-07-22'};
  for (const [selector,value] of Object.entries(values)) await page.locator(selector).fill(value);
  await page.locator('#sl-grace-accrual').check();
  await page.locator('#sl-form button[type="submit"]').click();
}

for (const route of routes) test(`${route.lang} student-loan route is exact, private and mobile-safe`, async ({ page }) => {
  const errors=[],nonGet=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('request',request=>{if(request.method()!=='GET')nonGet.push(request.url())});
  await page.setViewportSize({width:375,height:812});await page.goto(route.path,{waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('lang',route.lang);expect((await page.title()).length).toBeLessThanOrEqual(60);await expect(page.locator('link[rel="alternate"]')).toHaveCount(3);
  expect(await page.locator('#sl-form input').evaluateAll(inputs=>inputs.every(input=>input.labels&&input.labels.length===1&&input.labels[0].textContent.trim()))).toBe(true);
  await page.locator('#sl-balance').focus();await expect(page.locator('#sl-balance')).toBeFocused();await fillPlan(page);
  for(const [id,value] of [['#sl-start',10500],['#sl-payment',1050],['#sl-cash-payment',1060],['#sl-interest',0],['#sl-fees',600],['#sl-total',10600],['#sl-cash-after',3440]]){const text=await page.locator(id).textContent();expect(Number(text.replace(/[^0-9.-]/g,''))).toBe(value)}
  await expect(page.locator('#sl-timeline')).toContainText('12');await expect(page.locator('#sl-debt-load')).toHaveText('31.2%');await expect(page.locator('#sl-schedule tr')).toHaveCount(12);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>/student|loan/i.test(key)))).toEqual([]);expect(nonGet).toEqual([]);expect(errors).toEqual([]);
  await page.locator('#sl-extra').fill('50000');await page.locator('#sl-form button[type="submit"]').click();
  expect(Number((await page.locator('#sl-cash-payment').textContent()).replace(/[^0-9.-]/g,''))).toBe(10510);await expect(page.locator('#sl-debt-load')).toHaveText('220.2%');expect(Number((await page.locator('#sl-cash-after').textContent()).replace(/[^0-9.-]/g,''))).toBe(-6010);
  await page.locator('#sl-balance').fill('11000');await expect(page.locator('#sl-results')).toBeHidden();
});

test('exports stay local and stale evidence fails closed',async({page})=>{await page.addInitScript(()=>{window.__pdfArgs=null;window.addEventListener('DOMContentLoaded',()=>{window.AfroTools=window.AfroTools||{};window.AfroTools.pdf={generate:async args=>{window.__pdfArgs=args}}})});await page.goto('/tools/student-loan/');await fillPlan(page);for(const id of ['#sl-csv','#sl-json']){const download=page.waitForEvent('download');await page.locator(id).click();await download}await page.locator('#sl-pdf').click();expect(await page.evaluate(()=>({noGate:window.__pdfArgs.noGate,skipGate:window.__pdfArgs.skipGate,rows:window.__pdfArgs.sections[0].rows.length}))).toEqual({noGate:true,skipGate:true,rows:12});await page.locator('#sl-date').fill('2025-01-01');await page.locator('#sl-form button[type="submit"]').click();await expect(page.locator('#sl-error')).toContainText('365 days');await expect(page.locator('#sl-results')).toBeHidden()});

test('manual and system dark mode remain stable at 320px and 200% equivalent',async({page})=>{await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.setViewportSize({width:320,height:720});await page.goto('/tools/student-loan/');await page.locator('html').evaluate(node=>node.setAttribute('data-theme','dark'));await fillPlan(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);await page.screenshot({path:'artifacts/student-loan-dark-320-zoom200-equivalent.png',fullPage:true})});

test('tablet layout remains stable at 768px',async({page})=>{await page.setViewportSize({width:768,height:900});await page.goto('/tools/student-loan/');await fillPlan(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0)});

test('compact widget requires sourced terms and matches the engine',async({page})=>{await page.setViewportSize({width:320,height:720});await page.goto('/widgets/iframe/education-student-loan.html?theme=dark');await page.locator('#aw-sl-balance').fill('10000');await page.locator('#aw-sl-rate').fill('0');await page.locator('#aw-sl-months').fill('10');await page.locator('#aw-sl-calc').click();await expect(page.locator('#aw-sl-error')).toContainText('checked date within 365 days');await page.locator('#aw-sl-source').fill('Synthetic statement');await page.locator('#aw-sl-date').fill('2026-07-22');await page.locator('#aw-sl-calc').click();await expect(page.locator('#aw-sl-result')).toContainText(/KES\s+1,000/);expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0)});

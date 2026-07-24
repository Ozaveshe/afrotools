const { test, expect } = require('@playwright/test');

const routes = [['/tools/salary-intelligence/','en'],['/fr/jobs/salary-benchmarks/','fr']];

async function addRow(page, amount, source, overrides = {}) {
  for (const [field,value] of Object.entries(overrides)) await page.locator(`#si-${field}`).fill(String(value));
  await page.locator('#si-amount').fill(String(amount));
  await page.locator('#si-source').fill(source);
  await page.locator('#si-form button[type="submit"]').click();
}

for (const [route,lang] of routes) {
  test(`${lang} salary evidence notebook calculates only local comparable rows`, async ({ page }) => {
    const errors=[],apiCalls=[];
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()===404)errors.push('404 '+response.url());});
    page.on('request',request=>{if(/api\/salary-intelligence|\.netlify\/functions\/api-salary/i.test(request.url()))apiCalls.push(request.url());});
    await page.setViewportSize({width:375,height:812});
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang',lang);
    await expect(page.locator('[data-salary-evidence-app]')).toBeVisible();
    await page.locator('#si-period').selectOption('annual');
    await page.locator('#si-date').fill('2026-07-20');
    for (const amount of [100000,200000,300000,400000,500000]) await addRow(page,amount,`Survey row ${amount}`);
    await expect(page.locator('.si-row')).toHaveCount(5);
    await page.locator('#si-analyze').click();
    await expect(page.locator('#si-result')).toBeVisible();
    const digits=async selector=>Number((await page.locator(selector).textContent()).replace(/\D/g,''));
    expect(await digits('#si-q1')).toBe(150000);
    expect(await digits('#si-median')).toBe(300000);
    expect(await digits('#si-q3')).toBe(450000);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.locator('#si-horizon').selectOption('180');
    await expect(page.locator('#si-result')).toBeHidden();
    await expect(page.locator('#si-pdf')).toBeDisabled();
    expect(apiCalls).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('mixed evidence and insufficient fresh rows fail closed', async ({ page }) => {
  await page.goto('/tools/salary-intelligence/');
  await page.locator('#si-period').selectOption('annual');
  await page.locator('#si-date').fill('2026-07-20');
  for (const amount of [100000,200000,300000,400000]) await addRow(page,amount,`Evidence ${amount}`);
  await page.locator('#si-analyze').click();
  await expect(page.locator('#si-result')).toBeHidden();
  await expect(page.locator('#si-error')).not.toBeEmpty();
  await page.locator('#si-currency').fill('USD');
  await addRow(page,500000,'Different currency');
  await page.locator('#si-analyze').click();
  await expect(page.locator('#si-result')).toBeHidden();
  await expect(page.locator('#si-error')).not.toBeEmpty();
});

test('CSV, JSON and PDF exports are explicit and complete', async ({ page }) => {
  await page.goto('/tools/salary-intelligence/');
  await page.locator('#si-period').selectOption('annual');
  await page.locator('#si-date').fill('2026-07-20');
  for (const amount of [100000,200000,300000,400000,500000]) await addRow(page,amount,`Evidence ${amount}`);
  await page.locator('#si-analyze').click();
  const csvDownload=page.waitForEvent('download');await page.locator('#si-csv').click();expect((await csvDownload).suggestedFilename()).toBe('salary-evidence.csv');
  const jsonDownload=page.waitForEvent('download');await page.locator('#si-json').click();expect((await jsonDownload).suggestedFilename()).toBe('salary-evidence.json');
  await page.evaluate(()=>{window.__salaryPdf=null;window.AfroTools=window.AfroTools||{};window.AfroTools.pdf={generate:async payload=>{window.__salaryPdf=payload;}};});
  await page.locator('#si-pdf').click();
  const payload=await page.evaluate(()=>window.__salaryPdf);
  expect(payload.noGate).toBe(true);
  expect(payload.sections[0].rows).toHaveLength(5);
  expect(payload.disclaimer).toContain('not an official wage schedule');
});

test('dark 320 layout at 200 percent equivalent remains contained', async ({ page }) => {
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  await page.setViewportSize({width:160,height:700});
  await page.goto('/tools/salary-intelligence/');
  const overflow=await page.evaluate(()=>({delta:document.documentElement.scrollWidth-document.documentElement.clientWidth,offenders:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.right>document.documentElement.clientWidth+1||r.left<-1;}).slice(0,12).map(el=>({tag:el.tagName,cls:el.className,id:el.id,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scroll:el.scrollWidth}))}));
  expect(overflow.delta,JSON.stringify(overflow.offenders)).toBeLessThanOrEqual(1);
  await expect(page.locator('#si-form button[type="submit"]')).toBeVisible();
  await page.screenshot({path:'test-results/salary-intelligence-dark-320-zoom200-equivalent.png',fullPage:true});
});

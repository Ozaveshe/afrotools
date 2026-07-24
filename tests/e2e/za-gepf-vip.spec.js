const { test, expect } = require('@playwright/test');

for (const route of ['/tools/za-gepf/','/fr/tools/za-gepf/']) {
  test(route+' calculates two-pot retirement and exports PDF locally', async ({ page }) => {
    const errors=[],requests=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>requests.push({url:request.url(),method:request.method()}));
    await page.setViewportSize({width:375,height:812});
    await page.addInitScript(()=>{window.__pdfCalls=[];window.addEventListener('DOMContentLoaded',()=>{window.AfroTools=window.AfroTools||{};window.AfroTools.pdf={generate:async options=>window.__pdfCalls.push(options)}})});
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await page.locator('#gp-form button[type=submit]').click();
    await expect(page.locator('#gp-results')).toBeVisible();
    await expect(page.locator('#gp-monthly')).toContainText('12');
    await page.locator('#gp-pdf').click();
    await expect.poll(()=>page.evaluate(()=>window.__pdfCalls.length)).toBe(1);
    expect(await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,labels:[...document.querySelectorAll('input,select')].every(el=>el.labels&&el.labels.length)}))).toEqual(expect.objectContaining({labels:true}));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBeTruthy();
    expect(errors).toEqual([]);
    expect(requests.filter(request=>request.method!=='GET'||/\.netlify\/functions|\/api\/|supabase|\/collect\b|beacon/i.test(request.url))).toEqual([]);
    if(route==='/tools/za-gepf/')await page.screenshot({path:'artifacts/finance-row-101-za-gepf/375-light-result.png',fullPage:true});
  });
}

test('fails closed under ten years and covers responsive dark layouts',async({page})=>{
  await page.setViewportSize({width:320,height:800});await page.goto('/tools/za-gepf/');
  await page.locator('#gp-vested').fill('8');await page.locator('#gp-savings').fill('0.3');await page.locator('#gp-retirement').fill('0.6');await page.locator('#gp-form button[type=submit]').click();
  await expect(page.locator('#gp-error')).toContainText('at least 10 years');await expect(page.locator('#gp-results')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBeTruthy();
  await page.setViewportSize({width:768,height:900});await page.evaluate(()=>window.AfroTools.darkMode.set('dark'));await page.reload();
  await page.locator('#gp-form button[type=submit]').click();await expect(page.locator('#gp-results')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBeTruthy();
  await page.screenshot({path:'artifacts/finance-row-101-za-gepf/768-dark.png',fullPage:true});
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBeTruthy();
});

test('creates a real local PDF document',async({page})=>{
  await page.goto('/tools/za-gepf/');await page.locator('#gp-form button[type=submit]').click();
  const pending=page.waitForEvent('download');await page.locator('#gp-pdf').click();const download=await pending;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);const stream=await download.createReadStream();let header='';
  for await(const chunk of stream){header+=chunk.subarray(0,4).toString('ascii');break}expect(header).toBe('%PDF');
});

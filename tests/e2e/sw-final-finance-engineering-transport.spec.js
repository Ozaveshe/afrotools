const { test, expect } = require('@playwright/test');

function parsePortablePdf(bytes){const text=bytes.toString('latin1'),start=text.match(/startxref\s+(\d+)\s+%%EOF/);expect(start).toBeTruthy();expect(text.slice(Number(start[1]),Number(start[1])+4)).toBe('xref');expect(text).toMatch(/stream[\s\S]*BT[\s\S]*Tj[\s\S]*ET[\s\S]*endstream/);return text;}
async function downloadBytes(page,button){const pending=page.waitForEvent('download');await button.click();const file=await pending;return require('fs').promises.readFile(await file.path());}

const routes=[
  '/sw/nigeria/kikokotoo-kodi-mshahara/','/sw/south-africa/kikokotoo-kodi-mshahara/','/sw/morocco/kikokotoo-kodi-mshahara/','/sw/algeria/kikokotoo-kodi-mshahara/','/sw/tunisia/kikokotoo-kodi-mshahara/','/sw/libya/kikokotoo-kodi-mshahara/','/sw/sudan/kikokotoo-kodi-mshahara/','/sw/mozambique/kikokotoo-kodi-mshahara/','/sw/namibia/kikokotoo-kodi-mshahara/','/sw/madagascar/kikokotoo-kodi-mshahara/','/sw/dr-congo/kikokotoo-kodi-mshahara/','/sw/congo/kikokotoo-kodi-mshahara/','/sw/sierra-leone/kikokotoo-kodi-mshahara/'
];

test.describe.configure({mode:'serial'});
for(const route of routes){
  test(`complete PAYE workflow ${route}`,async({page})=>{
    await page.setViewportSize({width:320,height:900});const requests=[];page.on('request',r=>requests.push(r));await page.goto(route);const app=page.locator('[data-sw-final-app=paye]');await expect(app).toHaveCount(1);await expect(page.locator('html')).toHaveAttribute('lang','sw');
    await app.locator('[name=gross]').fill('1000000');await app.locator('form button[type=submit]').click();await expect(app.locator('[data-result] strong')).toBeVisible();
    await app.locator('[data-save]').click();await app.locator('[name=gross]').fill('2000000');await app.locator('[data-load]').click();await expect(app.locator('[name=gross]')).toHaveValue('1000000');
    await app.locator('[data-explain]').click();await expect(app.locator('[data-ai-result]')).toContainText('bila mtandao');
    await app.locator('[name=desiredNet]').fill('500000');await app.locator('[data-net-to-gross]').click();await expect(app.locator('[name=gross]')).not.toHaveValue('1000000');
    for(const format of ['json','csv','txt','pdf']){const bytes=await downloadBytes(page,app.locator(`[data-export=${format}]`));expect(bytes.length).toBeGreaterThan(20);if(format==='json'){const data=JSON.parse(bytes.toString());expect(data.locale).toBe('sw');expect(data.result.net).toBeGreaterThan(0);}if(format==='csv')expect(bytes.toString()).toMatch(/^field,value\r?\n/);if(format==='txt')expect(bytes.toString()).toContain('gross:');if(format==='pdf')parsePortablePdf(bytes);}
    expect(requests.filter(r=>r.method()!=='GET'&&!/google-analytics|googlesyndication/.test(r.url()))).toHaveLength(0);expect(requests.filter(r=>/1000000/.test(`${r.url()} ${r.postData()||''}`))).toHaveLength(0);
    await app.locator('[data-reset]').click();await expect(app.locator('[data-result]')).toBeEmpty();await app.locator('form button[type=submit]').click();await expect(app.locator('[data-status]')).toHaveAttribute('data-error','true');
    const reflow=await page.evaluate(()=>({ok:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,wide:[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect();return{tag:el.tagName,cls:String(el.className||'').slice(0,80),right:Math.round(r.right),width:Math.round(r.width)};}).filter(x=>x.right>document.documentElement.clientWidth+1).slice(0,12)}));expect(reflow.ok,`${route} ${JSON.stringify(reflow)}`).toBeTruthy();
  });
}

test('AI remains disabled without consent and sends only the disclosed result payload',async({page})=>{
  let payload=null;await page.route('**/.netlify/functions/ai-advisor',async route=>{payload=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:'Maelezo salama ya mfano.'})});});
  await page.goto('/sw/tunisia/kikokotoo-kodi-mshahara/');const app=page.locator('[data-sw-final-app=paye]');await app.locator('[name=gross]').fill('100000');await app.locator('form button[type=submit]').click();await expect(app.locator('[data-ai]')).toBeDisabled();await app.locator('[name=aiConsent]').check();await expect(app.locator('[data-ai]')).toBeEnabled();await app.locator('[data-ai]').click();await expect(app.locator('[data-ai-result]')).toContainText('Maelezo salama');expect(payload.consent).toBe(true);expect(Object.keys(payload.context).sort()).toEqual(['contribution','currency','gross','locale','net','sourceReviewed','tax','toolId'].sort());expect(JSON.stringify(payload)).not.toMatch(/email|name|file|document|password|otp/i);
});

test('all 13 owners preserve SEO depth and reflow at 320px, 375px and effective 200%',async({page})=>{
  test.setTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/google|doubleclick|googlesyndication/i.test(m.text()))errors.push(m.text());});
  const cases=[{width:320,zoom:1,scheme:'light'},{width:375,zoom:1,scheme:'dark'},{width:750,zoom:2,scheme:'light'}];
  for(const route of routes){for(const view of cases){errors.length=0;await page.emulateMedia({colorScheme:view.scheme});await page.setViewportSize({width:view.width,height:900});await page.goto(route);await page.evaluate(z=>{document.documentElement.style.zoom=String(z);},view.zoom);await expect(page.locator('script[type="application/ld+json"]')).not.toHaveCount(0);await expect(page.locator('h2')).not.toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),`${route} ${JSON.stringify(view)}`).toBeTruthy();await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement&&document.activeElement!==document.body)).toBeTruthy();expect(errors,route).toEqual([]);}}
});

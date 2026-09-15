const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
async function download(page, app, format){const pending=page.waitForEvent('download');await app.locator(`[data-export=${format}]`).click();return fs.promises.readFile(await (await pending).path());}
for(const country of ['algeria']) {
  test(`${country} displayed period matches copy, explanation and reopened exports`,async({page})=>{
    await page.setViewportSize({width:320,height:900});
    await page.goto(`/sw/${country}/kikokotoo-kodi-mshahara/`);
    const app=page.locator('[data-sw-paye-app=paye]');
    await app.locator('[name=gross]').fill('120000');
    await app.locator('form button[type=submit]').click();
    const annual=JSON.parse((await download(page,app,'json')).toString()).result;
    expect(annual.period).toBe('annual');
    await app.locator('[name=inputPeriod]').selectOption('monthly');
    await app.locator('[name=gross]').fill('10000');
    await app.locator('form button[type=submit]').click();
    const monthly=JSON.parse((await download(page,app,'json')).toString()).result;
    expect(monthly.period).toBe('monthly');expect(monthly.calculationPeriod).toBe('annual');
    for(const key of ['gross','net','tax','contribution','taxable'])expect(monthly[key]).toBeCloseTo(annual[key]/12,6);
    const net=new Intl.NumberFormat('sw',{style:'currency',currency:monthly.currency,maximumFractionDigits:2}).format(monthly.net);
    await expect(app.locator('[data-result] strong')).toHaveText(net);
    await expect(app.locator('[data-result]')).toContainText('kwa mwezi');
    await page.evaluate(()=>{window.__copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copied=value;}}});});
    await app.locator('[data-copy]').click();
    expect(await page.evaluate(()=>window.__copied)).toContain(net);
    expect(await page.evaluate(()=>window.__copied)).toContain('kwa mwezi');
    await app.locator('[data-explain]').click();
    await expect(app.locator('[data-ai-result]')).toContainText(net);
    await expect(app.locator('[data-ai-result]')).toContainText('kwa mwezi');
    await app.locator('form button[type=submit]').click();
    await expect(app.locator('[data-ai-result]')).toBeEmpty();
    for(const format of ['txt','csv','pdf']){
      const bytes=await download(page,app,format),text=bytes.toString(format==='pdf'?'latin1':'utf8');
      if(format==='csv'){expect(text).toContain('"period","monthly"');expect(text).toContain('"gross","10000"');expect(text).toContain(`"net","${monthly.net}"`);}
      else {expect(text).toContain('period: monthly');expect(text).toContain('gross: 10000');expect(text).toContain(`net: ${monthly.net}`);}
      if(format==='pdf'){const marker=text.match(/startxref\s+(\d+)\s+%%EOF/);expect(marker).toBeTruthy();expect(text.slice(Number(marker[1]),Number(marker[1])+4)).toBe('xref');await page.addScriptTag({url:'/assets/vendor/pdfjs/pdf.min.js'});const parsed=await page.evaluate(async data=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc='/assets/vendor/pdfjs/pdf.worker.min.js';const doc=await window.pdfjsLib.getDocument({data:new Uint8Array(data)}).promise;const content=await(await doc.getPage(1)).getTextContent();return content.items.map(item=>item.str).join(' ');},Array.from(bytes));expect(parsed).toContain('period: monthly');expect(parsed).toContain(`net: ${monthly.net}`);}
    }
    if(country==='morocco'){
      for(const key of ['cnss','amo']){expect(monthly.components[key]).toBeCloseTo(annual.components[key]/12,6);await expect(app.locator('[data-breakdown]')).toContainText(key.toUpperCase());}
    }
    await app.locator('[data-save]').click();await app.locator('[data-reset]').click();await app.locator('[data-load]').click();
    await expect(app.locator('[data-result]')).toContainText('kwa mwezi');
    // Changing a form control must not relabel an already calculated result.
    await app.locator('[name=inputPeriod]').selectOption('annual');
    expect(JSON.parse((await download(page,app,'json')).toString()).result.period).toBe('monthly');
    await app.locator('[name=gross]').fill('0');await app.locator('form button[type=submit]').click();
    for(const selector of ['[data-result]','[data-breakdown]','[data-chart]','[data-ai-result]'])await expect(app.locator(selector)).toBeEmpty();
    await app.locator('[data-export=txt]').click();await expect(app.locator('[data-status]')).toContainText('kwanza');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBeTruthy();
  });
}

'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

for (const route of [
  { path:'/tools/compound-interest/', lang:'en', result:'Projection result', pdf:'Projected balance', methodTxt:'Method:', methodPdf:'Method:', width:375, scheme:'dark', shot:'artifacts/compound-interest-vip-en-375-dark.png' },
  { path:'/fr/tools/interet-compose/', lang:'fr', result:'Résultat de la projection', pdf:'Solde projete', methodTxt:'Méthode :', methodPdf:'Methode :', width:768, scheme:'light', shot:'artifacts/compound-interest-vip-fr-768-light.png' }
]) {
  test(`${route.lang} regular-savings projection and local exports`, async ({ page }) => {
    const errors=[];const nonGet=[];
    page.on('pageerror',(error)=>errors.push(error.message));
    page.on('console',(message)=>{if(message.type()==='error')errors.push(message.text());});
    page.on('request',(request)=>{if(request.method()!=='GET')nonGet.push(`${request.method()} ${request.url()}`);});
    await page.setViewportSize({width:route.width,height:760});
    await page.emulateMedia({colorScheme:route.scheme,reducedMotion:'reduce'});
    await page.goto(route.path,{waitUntil:'networkidle'});
    await expect(page.locator('html')).toHaveAttribute('lang',route.lang);
    await expect(page.locator('#ciTxt')).toBeDisabled();
    await expect(page.locator('#ciPdf')).toBeDisabled();
    await expect(page.locator('#ciStatus')).toHaveAttribute('aria-live','polite');
    await page.locator('#ciForm').evaluate((form)=>form.requestSubmit());
    await expect(page.getByRole('heading',{name:route.result})).toBeFocused();
    await expect(page.locator('#ciFinal')).toContainText(/883/);
    await expect(page.locator('#ciContributed')).toContainText(/700/);
    await expect(page.locator('#ciInterest')).toContainText(/183/);
    await expect(page.locator('#ciAssumptions')).toContainText(/8/);
    await expect(page.locator('.ci-year-card')).toHaveCount(5);
    await expect(page.locator('.ci-year-card').first().locator('dt')).toHaveCount(3);
    await expect(page.locator('.ci-year-card').first().locator('dd')).toHaveCount(3);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(await page.evaluate(()=>Object.keys(localStorage).filter((key)=>/compound|interest/i.test(key)))).toEqual([]);
    expect(nonGet).toEqual([]);
    if(route.lang==='en'){
      const contrast=await page.locator('.ci-example').evaluate((node)=>{
        function rgb(value){return value.match(/\d+/g).slice(0,3).map(Number);}
        function lum(parts){return parts.map((part)=>{const v=part/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);}
        const style=getComputedStyle(node),a=lum(rgb(style.color)),b=lum(rgb(style.backgroundColor));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({path:route.shot,fullPage:true});

    const txtPending=page.waitForEvent('download');await page.locator('#ciTxt').click();const txt=await txtPending;
    const txtText=fs.readFileSync(await txt.path(),'utf8');expect(txtText).toContain('883');expect(txtText).toContain(route.methodTxt);
    const pdfPending=page.waitForEvent('download');await page.locator('#ciPdf').click();const pdf=await pdfPending;
    const parsed=await pdfParse(fs.readFileSync(await pdf.path()));expect(parsed.text).toContain(route.pdf);expect(parsed.text).toContain('883');expect(parsed.text).toContain(route.methodPdf);

    await page.locator('#ciInitial').fill('-1');await page.locator('#ciForm').evaluate((form)=>form.requestSubmit());
    await expect(page.locator('#ciResult')).toBeHidden();await expect(page.locator('#ciTxt')).toBeDisabled();
    await page.locator('#ciInitial').fill('1000000000001');await page.locator('#ciForm').evaluate((form)=>form.requestSubmit());
    await expect(page.locator('#ciResult')).toBeHidden();await expect(page.locator('#ciTxt')).toBeDisabled();
    await page.locator('#ciInitial').fill('1000');await page.locator('#ciMonthly').fill('100');await page.locator('#ciRate').fill('0');await page.locator('#ciYears').fill('1');await page.locator('#ciForm').evaluate((form)=>form.requestSubmit());
    await expect(page.locator('#ciInterest')).toContainText(/(?:0|0,00)/);
    await page.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));
    await expect(page.locator('.ci-card')).toHaveCSS('background-color','rgb(255, 255, 255)');
    expect(errors).toEqual([]);
  });
}

test('year cards retain localized label-value structure at 320, 375 and 768', async ({ page }) => {
  for(const width of [320,375,768]){
    for(const route of [
      {path:'/tools/compound-interest/',labels:['Cumulative contributions','Cumulative interest','Projected balance']},
      {path:'/fr/tools/interet-compose/',labels:['Versements cumulés','Intérêts cumulés','Solde projeté']}
    ]){
      await page.setViewportSize({width,height:760});await page.goto(route.path,{waitUntil:'domcontentloaded'});
      await page.locator('#ciForm').evaluate((form)=>form.requestSubmit());
      await expect(page.locator('.ci-year-cards')).toBeVisible();await expect(page.locator('.ci-table-wrap')).toBeHidden();
      await expect(page.locator('.ci-year-card')).toHaveCount(5);
      const structure=await page.locator('.ci-year-card').evaluateAll((cards)=>cards.map((card)=>({
        labels:[...card.querySelectorAll('dt')].map((node)=>node.textContent.trim()),
        values:[...card.querySelectorAll('dd')].map((node)=>node.textContent.trim()),
        valueGeometry:[...card.querySelectorAll('dd')].map((node)=>({height:node.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(node).lineHeight),scrollWidth:node.scrollWidth,clientWidth:node.clientWidth})),
        left:card.getBoundingClientRect().left,right:card.getBoundingClientRect().right
      })));
      for(const card of structure){
        expect(card.labels).toEqual(route.labels);expect(card.values).toHaveLength(3);expect(card.values.every(Boolean)).toBe(true);expect(card.left).toBeGreaterThanOrEqual(0);expect(card.right).toBeLessThanOrEqual(width);
        if(width===375)for(const value of card.valueGeometry){expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth);expect(value.height).toBeLessThanOrEqual(value.lineHeight*1.2);}
      }
    }
  }
});

test('desktop table keeps headers aligned with body columns', async ({ page }) => {
  await page.setViewportSize({width:1024,height:800});await page.goto('/tools/compound-interest/',{waitUntil:'domcontentloaded'});await page.locator('#ciForm').evaluate((form)=>form.requestSubmit());
  await expect(page.locator('.ci-year-cards')).toBeHidden();await expect(page.locator('.ci-table-wrap')).toBeVisible();
  const geometry=await page.locator('.ci-table').evaluate((table)=>({
    headers:[...table.querySelectorAll('thead th')].map((node)=>node.getBoundingClientRect().left),
    cells:[...table.querySelectorAll('tbody tr:first-child td')].map((node)=>node.getBoundingClientRect().left)
  }));
  expect(geometry.headers).toHaveLength(4);expect(geometry.cells).toHaveLength(4);
  geometry.headers.forEach((left,index)=>expect(Math.abs(left-geometry.cells[index])).toBeLessThan(1));
});

test('EN and FR widget use the shared engine and match', async ({ page }) => {
  for (const locale of ['en','fr']) {
    await page.goto(`/widgets/iframe/financial-compound-interest.html?lang=${locale}`,{waitUntil:'domcontentloaded'});
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await page.getByRole('button',{name:locale==='fr'?'Calculer':'Calculate'}).click();
    await expect(page.locator('#aw-ci-final')).toContainText(/883/);
    await expect(page.locator('#aw-ci-contributed')).toContainText(/700/);
  }
});

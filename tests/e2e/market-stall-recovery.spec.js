const { test, expect } = require('@playwright/test');
test.use({ trace:'off',video:'off',screenshot:'off' });
const key='afrotools:market-stall-profit:history:v1';
async function calculate(page) {
  await page.locator('.js-name').first().fill('Synthetic item');
  for (const [cls,value] of [['cost','10'],['price','15'],['sold','5']]) await page.locator('.js-'+cls).first().fill(value);
  await page.locator('.msp-submit').click();
  await expect(page.locator('[data-results]')).toBeVisible();
}
for (const [locale,route] of [['en','/tools/market-stall-profit/'],['fr','/fr/tools/profit-stand-marche/'],['sw','/sw/zana/faida-ya-kibanda-sokoni/']]) {
  test(`${locale} malformed history remains intact on save and currency clear`,async({page})=>{
    await page.goto(route);await calculate(page);
    for (const value of ['{broken',JSON.stringify({schemaVersion:1,records:[null]})]) {
      await page.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value});
      await page.locator('[data-action=save]').click();
      expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(value);
      await expect(page.locator('[data-result-status]')).not.toBeEmpty();
      await page.locator('[data-action=clear-history]').click();
      expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(value);
      await expect(page.locator('[data-status]')).not.toBeEmpty();
    }
  });
  test(`${locale} denied storage writes preserve history and JSON export`,async({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.name));
    await page.goto(route);await calculate(page);await page.locator('[data-action=save]').click();
    const before=await page.evaluate(key=>localStorage.getItem(key),key);
    await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Denied','QuotaExceededError');};});
    await page.locator('[data-action=save]').click();await expect(page.locator('[data-result-status]')).toContainText('JSON');
    for(const action of ['delete-history','clear-history']) {
      await page.locator('[data-action='+action+']').first().click();
      await expect(page.locator('[data-status]')).toContainText('JSON');
      expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(before);
    }
    const pending=page.waitForEvent('download');await page.locator('[data-action=json]').click();expect((await pending).suggestedFilename()).toBe('market-stall-profit.json');expect(errors).toEqual([]);
  });
  test(`${locale} unavailable clipboard keeps summary export usable`,async({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.name));
    await page.goto(route);await calculate(page);
    for(const mode of ['missing','reject','throw']) {
      await page.evaluate(mode=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:mode==='missing'?undefined:{writeText:()=>{if(mode==='throw')throw new Error('Denied');return Promise.reject(new Error('Denied'));}}});document.querySelector('[data-result-status]').textContent='';},mode);
      await page.locator('[data-action=copy]').click();await expect(page.locator('[data-result-status]')).toContainText('JSON');
    }
    expect(errors).toEqual([]);
  });
  test(`${locale} history deletes only selected records and currency`,async({page})=>{
    await page.goto(route);await calculate(page);await page.locator('[data-action=save]').click();await page.locator('[data-action=save]').click();
    await page.locator('[data-action=delete-history]').first().click();await expect(page.locator('[data-action=delete-history]')).toHaveCount(1);
    await page.locator('.js-currency').fill('GHS');await page.locator('.msp-submit').click();await page.locator('[data-action=save]').click();
    await page.locator('[data-action=clear-history]').click();
    const records=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).records,key);expect(records).toHaveLength(1);expect(records[0].currency).toBe(locale==='fr'?'XOF':'KES');
  });
  test(`${locale} full twenty-item PDF retains printable content`,async({page},info)=>{
    const fs=require('node:fs'),pdf=require('pdf-parse');
    await page.goto(route);
    await page.evaluate(()=>{
      document.querySelector('.js-currency').value='SYNTHETICCUR';
      for(let i=1;i<20;i++)document.querySelector('[data-action=add-item]').click();
      document.querySelectorAll('.msp-item').forEach((row,i)=>{
        row.querySelector('.js-name').value='Synthetic '+String(i+1).padStart(2,'0')+' '+'W'.repeat(47);
        for(const cls of ['cost','price','sold'])row.querySelector('.js-'+cls).value=cls==='sold'?'100000':'1000000';
      });
    });
    await page.locator('.msp-submit').click();await expect(page.locator('[data-results]')).toBeVisible();
    const pending=page.waitForEvent('download');await page.locator('[data-action=pdf]').click();
    const file=info.outputPath('synthetic-twenty-items.pdf');await (await pending).saveAs(file);
    const outside=[];
    const parsed=await pdf(fs.readFileSync(file),{pagerender:async p=>{
      const c=await p.getTextContent(),v=p.getViewport(1);
      for(const t of c.items)if(t.str.trim()&&(t.transform[4]<35||t.transform[4]+t.width>v.width-35||t.transform[5]<30||t.transform[5]>v.height-25))outside.push({page:p.pageNumber,x:t.transform[4],y:t.transform[5],width:t.width});
      return c.items.map(t=>t.str).join(' ');
    }});
    fs.writeFileSync(info.outputPath('pdf-bounds.json'),JSON.stringify({pages:parsed.numpages,outside}));
    expect(outside).toEqual([]);expect(parsed.numpages).toBeGreaterThan(1);
    expect(parsed.text).toContain(locale==='fr'?'2 000 000 000 000':'2,000,000,000,000');
    for(let i=1;i<=20;i++)expect(parsed.text).toContain('Synthetic '+String(i).padStart(2,'0'));
  });

}

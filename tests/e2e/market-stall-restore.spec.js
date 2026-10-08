const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test.use({trace:'off',video:'off',screenshot:'off'});
const key='afrotools:market-stall-profit:history:v1';
const record={id:'synthetic-1',savedAt:'2026-10-08T00:00:00.000Z',currency:'KES',netDailyProfit:-5,revenue:10,monthlyNetProfit:-120,marketDays:24,engineVersion:'market-stall-profit-2026-07-23'};
const backup=records=>JSON.stringify({schemaVersion:1,records});
async function select(page,text,name='history.json'){await page.locator('#msp-restore-file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(text)});}
async function restore(page){await page.locator('#msp-restore-confirm').check();await expect(page.locator('[data-action=restore-history]')).toBeEnabled();await page.locator('[data-action=restore-history]').click();}
for(const [locale,route] of [['en','/tools/market-stall-profit/'],['fr','/fr/tools/profit-stand-marche/'],['sw','/sw/zana/faida-ya-kibanda-sokoni/']]) {
 test(`${locale} downloaded history restores only after explicit replacement and persists`,async({page})=>{
  await page.setViewportSize({width:320,height:850});await page.goto(route);
  await page.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value:backup([record,{...record,id:'synthetic-2',currency:'GHS'}])});
  const pending=page.waitForEvent('download');await page.locator('[data-action=backup-history]').click();const text=fs.readFileSync(await(await pending).path(),'utf8');
  await page.evaluate(key=>localStorage.setItem(key,'{broken'),key);
  await select(page,text);await expect(page.locator('#msp-restore-status')).toContainText('2');await expect(page.locator('[data-action=restore-history]')).toBeDisabled();expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('{broken');
  await restore(page);await expect(page.locator('#msp-restore-status')).toBeFocused();expect(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key)).records).toHaveLength(2);
  await page.reload();expect(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key)).records).toHaveLength(2);await expect(page.locator('.js-name').first()).toHaveValue('');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
 });
 test(`${locale} malformed oversized and invalid-schema backups never change history`,async({page})=>{
  await page.goto(route);const before=backup([record]);await page.evaluate(({key,before})=>localStorage.setItem(key,before),{key,before});
  for(const text of ['{broken','x'.repeat(65537),backup([null]),backup([record,record]),backup([{...record,revenue:-1}]),backup([{...record,netDailyProfit:'5'}]),backup(Array.from({length:31},(_,i)=>({...record,id:String(i)})))]) {
   await select(page,text);await expect(page.locator('#msp-restore-status')).not.toBeEmpty();await page.locator('#msp-restore-confirm').check();await expect(page.locator('[data-action=restore-history]')).toBeDisabled();expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(before);
  }
 });
 test(`${locale} denied restore write preserves history and can retry`,async({page})=>{
  await page.goto(route);const before=backup([record]);await page.evaluate(({key,before})=>{localStorage.setItem(key,before);window.originalSyntheticSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Denied','QuotaExceededError');};},{key,before});
  await select(page,backup([]));await expect(page.locator('#msp-restore-status')).toContainText('0');await restore(page);expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(before);await expect(page.locator('[data-action=restore-history]')).toBeEnabled();
  await page.evaluate(()=>Storage.prototype.setItem=window.originalSyntheticSet);await page.locator('[data-action=restore-history]').click();expect(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key)).records).toHaveLength(0);
 });
 test(`${locale} unreadable files and stale reads cannot replace a newer selection`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.name));await page.goto(route);
  await page.evaluate(()=>{window.originalSyntheticText=File.prototype.text;File.prototype.text=function(){return Promise.reject(new Error('Unreadable'));};});await select(page,backup([record]));await expect(page.locator('#msp-restore-status')).not.toBeEmpty();await expect(page.locator('[data-action=restore-history]')).toBeDisabled();
  await page.evaluate(()=>{File.prototype.text=function(){if(this.name==='slow.json')return new Promise(resolve=>window.finishSyntheticRead=resolve);return window.originalSyntheticText.call(this);};});await select(page,backup([record]),'slow.json');await select(page,backup([]),'empty.json');await expect(page.locator('#msp-restore-status')).toContainText('0');await page.evaluate(text=>window.finishSyntheticRead(text),backup([record]));await restore(page);expect(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key)).records).toHaveLength(0);expect(errors).toEqual([]);
 });
 test(`${locale} empty restore panel fits mobile and has visible labels`,async({page},info)=>{
  await page.setViewportSize({width:320,height:850});await page.goto(route);await page.evaluate(dark=>document.documentElement.dataset.theme=dark?'dark':'light',locale!=='en');
  await expect(page.locator('#msp-restore-file')).toHaveAccessibleName(/.+/);await expect(page.locator('#msp-restore-confirm')).toHaveAccessibleName(/.+/);await expect(page.locator('[data-action=restore-history]')).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.locator('.msp-restore').screenshot({path:info.outputPath('empty-restore-panel.png')});
  await select(page,'\ufeff'+backup([{...record,unexpected:'discard this field'}]));await expect(page.locator('#msp-restore-status')).toContainText('1');await restore(page);
  expect(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key)).records[0]).not.toHaveProperty('unexpected');
 });

}

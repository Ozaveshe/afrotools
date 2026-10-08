const {test,expect}=require('@playwright/test');const key='afrotools_sw_etims_progress_v1';const route='/sw/zana/mwongozo-wa-etims-kra/';
test('unreadable saved progress survives page load and checklist edits',async({page})=>{await page.addInitScript(k=>{localStorage.setItem(k,'{broken')},key);await page.goto(route);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('{broken');await page.locator('[data-check=scope]').check();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('{broken');await expect(page.locator('[data-status]')).toContainText('kipindi');});
test('blocked storage never claims that checklist progress was saved',async({page})=>{await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('synthetic')}});await page.goto(route);await page.locator('[data-check=scope]').check();await expect(page.locator('[data-progress-label]')).toHaveText('1/11');await expect(page.locator('[data-status]')).toContainText('kipindi');});
const backup={schema:'afrotools.etims-progress',version:1,locale:'sw',sourceReviewed:'2026-08-09',completed:['onboard']};
async function upload(page,data=backup){await page.locator('[data-import]').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))})}
test('failed reset preserves current progress and saved bytes',async({page})=>{await page.goto(route);await page.locator('[data-check=scope]').check();const saved=await page.evaluate(k=>localStorage.getItem(k),key);await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('synthetic')}});await page.locator('[data-reset]').click();await expect(page.locator('[data-check=scope]')).toBeChecked();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);});
test('cancelled and failed replacements leave the original progress intact',async({page})=>{
  await page.goto(route);
  await page.locator('[data-check=scope]').check();
  const saved=await page.evaluate(k=>localStorage.getItem(k),key);
  // File.text() finishes after setInputFiles returns. Finish the first dialog
  // before adding a handler for the next import's confirmation.
  const cancelled=page.waitForEvent('dialog').then(dialog=>dialog.dismiss());
  await upload(page);
  await cancelled;
  await expect(page.locator('[data-check=scope]')).toBeChecked();
  await expect(page.locator('[data-check=onboard]')).not.toBeChecked();
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('synthetic')}});
  const accepted=page.waitForEvent('dialog').then(dialog=>dialog.accept());
  await upload(page);
  await accepted;
  await expect(page.locator('[data-status]')).toContainText('kipindi');
  await expect(page.locator('[data-check=scope]')).toBeChecked();
  await expect(page.locator('[data-check=onboard]')).not.toBeChecked();
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);
});
test('a slow import cannot undo a reset or a newer checkbox choice',async({page})=>{await page.goto(route);await page.evaluate(data=>{File.prototype.text=function(){return new Promise(resolve=>window.finishImport=()=>resolve(JSON.stringify(data))) }},backup);await upload(page);await page.locator('[data-reset]').click();await page.evaluate(()=>window.finishImport());await expect(page.locator('[data-progress-label]')).toHaveText('0/11');await upload(page);await page.locator('[data-check=scope]').check();await page.evaluate(()=>window.finishImport());await expect(page.locator('[data-check=scope]')).toBeChecked();await expect(page.locator('[data-check=onboard]')).not.toBeChecked();});
test('duplicate and unreadable imports preserve progress',async({page})=>{await page.goto(route);await page.locator('[data-check=scope]').check();await upload(page,{...backup,completed:['onboard','onboard']});await expect(page.locator('[data-status]')).toContainText('JSON haikubaliki');await expect(page.locator('[data-check=scope]')).toBeChecked();await page.evaluate(()=>{File.prototype.text=function(){return Promise.reject(Error('synthetic'))}});await upload(page);await expect(page.locator('[data-status]')).toContainText('haisomeki');await expect(page.locator('[data-check=scope]')).toBeChecked();});
test('explicit restore replaces corrupt bytes with a validated anonymous backup',async({page})=>{await page.addInitScript(k=>localStorage.setItem(k,'{broken'),key);await page.goto(route);page.once('dialog',d=>d.accept());await upload(page);await expect(page.locator('[data-check=onboard]')).toBeChecked();expect(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key))).toEqual(backup);});

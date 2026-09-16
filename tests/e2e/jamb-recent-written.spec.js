const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const bank=require('../../assets/js/lib/jamb-recent-written-bank');
test('recent revision deep links, solutions, saves and backups work on a small phone without overwriting SSCE',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:320,height:800});
 await page.goto('/tools/ssce-practice/');await page.getByLabel('Your written answer',{exact:true}).fill('Existing WAEC response');await page.getByRole('button',{name:'Save response on this device',exact:true}).click();
 await page.goto('/jamb/mathematics/recent-practice/');
 for(const q of bank.items){const topic=page.getByRole('link',{name:q.title,exact:true});const bounds=await topic.boundingBox();expect(bounds.height).toBeGreaterThanOrEqual(44);await topic.click();await expect(page.locator('#written-task')).toHaveValue(q.id);await expect(page.locator('.written-prompt')).toHaveText(q.prompt);await expect(page.locator('#written-editor details')).not.toHaveAttribute('open','');await page.locator('#written-editor summary').click();await expect(page.locator('#written-editor details')).toContainText(q.answer);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);}
 await page.getByLabel('Your written answer',{exact:true}).fill('190 / 1230 × 100 = 15.45%');await page.getByRole('button',{name:'Save response on this device',exact:true}).click();await page.reload();await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('190 / 1230 × 100 = 15.45%');
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download written-practice backup',exact:true}).click();const backup=JSON.parse(await fs.readFile(await (await downloaded).path(),'utf8'));expect(backup.bankId).toBe(bank.id);expect(backup.entries[bank.items[4].id].answer).toContain('15.45');
 await page.goto('/tools/ssce-practice/');await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('Existing WAEC response');expect(errors).toEqual([]);
});
test('topic navigation preserves unsaved drafts and wrong-bank imports leave them intact',async({page})=>{
 await page.goto('/jamb/mathematics/recent-practice/#written='+bank.items[0].id);await page.getByLabel('Your written answer',{exact:true}).fill('My counting draft');
 await page.getByRole('link',{name:bank.items[1].title,exact:true}).click();await page.getByRole('link',{name:bank.items[0].title,exact:true}).click();await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('My counting draft');
 await page.locator('#written-import').setInputFiles({name:'wrong-bank.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,bankId:'ssce-written-v1',entries:{}}))});await expect(page.locator('#written-status')).toContainText('Backup not opened');await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('My counting draft');
});

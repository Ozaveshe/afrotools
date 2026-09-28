const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const bank=require('../../assets/js/lib/ssce-written-bank');
const configs=[
 {locale:'en',route:'/tools/ssce-practice/',save:'Save response on this device',backup:'Download written-practice backup'},
 {locale:'fr',route:'/fr/tools/pratique-waec-neco/',save:'Enregistrer la réponse sur cet appareil',backup:'Télécharger la sauvegarde des réponses rédigées'},
 {locale:'sw',route:'/sw/zana/mazoezi-waec-neco/',save:'Hifadhi jibu kwenye kifaa hiki',backup:'Pakua nakala ya majibu ya kuandika'}
];
const ids=['neco-2023-english-p2-q5','neco-2023-english-p2-q6'];
async function layout(page){expect(await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth)).toBeLessThanOrEqual(1);}

for(const c of configs)for(const width of [320,390])test(`${c.locale}: complete NECO reading tasks, optional guide and existing saved responses at ${width}px`,async({page},info)=>{
 const errors=[],responseRequests=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if((request.postData()||'').includes('NECO_READING_SYNTHETIC'))responseRequests.push(request.url());});
 await page.setViewportSize({width,height:844});
 await page.goto(c.route+'#written='+ids[0]);
 const editor=page.locator('#written-editor'),answer=page.locator('#written-answer');
 await expect(page.locator('#written-task')).toHaveValue(ids[0]);
 await expect(editor.locator('h3')).toBeFocused();
 await expect(editor.locator('.practice-passage p')).toHaveCount(6);
 await expect(editor.locator('.practice-passage p').last()).toContainText('If he relaxes, things would get worse');
 await expect(editor.locator('.written-prompt')).toHaveAttribute('lang','en');
 await expect(editor.locator('.written-prompt')).toHaveText(bank.items.find(q=>q.id===ids[0]).prompt);
 await expect(editor.locator('textarea')).toHaveCount(1);await expect(editor.locator('input[type=checkbox]')).toHaveCount(3);
 await expect(editor.locator('details')).not.toHaveAttribute('open','');
 const summary=editor.locator('summary');await summary.focus();await page.keyboard.press('Enter');
 await expect(editor.locator('details')).toHaveAttribute('open','');
 const guide=editor.locator('details > p');await expect(guide).toHaveAttribute('lang','en');
 await expect(guide).toContainText('do not keep “the” before “infancy”');
 expect(await guide.evaluate(el=>getComputedStyle(el).whiteSpace)).toBe('pre-wrap');
 expect((await guide.textContent()).split('\n').filter(line=>/^\([a-h]\)/.test(line)).length).toBe(14);
 await guide.scrollIntoViewIfNeeded();await layout(page);
 if(width===320)await editor.locator('details').screenshot({path:info.outputPath(`neco-q5-guide-${c.locale}-320.png`)});
 await answer.fill('NECO_READING_SYNTHETIC '+c.locale+' prior answer <img src="/must-not-request">');
 await editor.locator('input[type=checkbox]').nth(0).check();await editor.locator('input[type=checkbox]').nth(2).check();
 await page.getByRole('button',{name:c.save,exact:true}).click();await page.reload();
 await expect(answer).toHaveValue('NECO_READING_SYNTHETIC '+c.locale+' prior answer <img src="/must-not-request">');
 await expect(editor.locator('input[type=checkbox]').nth(0)).toBeChecked();await expect(editor.locator('input[type=checkbox]').nth(1)).not.toBeChecked();await expect(editor.locator('input[type=checkbox]').nth(2)).toBeChecked();
 await expect(editor.locator('details')).not.toHaveAttribute('open','');
 await page.locator('#written-task').selectOption(ids[1]);
 await expect(editor.locator('.practice-passage p')).toHaveCount(7);
 await expect(editor.locator('.practice-passage p').nth(5)).toContainText('appointed and trained');
 await expect(editor.locator('.practice-passage p').last()).toContainText('counting of votes and release of the results');
 await expect(editor.locator('.written-prompt')).toContainText('In six sentences, one for each');
 await expect(editor.locator('details')).not.toHaveAttribute('open','');await editor.locator('summary').click();
 await expect(editor.locator('details')).toContainText('Any six distinct, passage-supported functions');
 await expect(editor.locator('details')).toContainText('need not match this model');
 await layout(page);if(width===320)await editor.locator('details').screenshot({path:info.outputPath(`neco-q6-guide-${c.locale}-320.png`)});
 await answer.fill('NECO_READING_SYNTHETIC '+c.locale+' summary.');await page.getByRole('button',{name:c.save,exact:true}).click();
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:c.backup,exact:true}).click();
 const backup=JSON.parse(await fs.readFile(await (await downloaded).path(),'utf8'));
 expect(backup.version).toBe(1);expect(backup.bankId).toBe('ssce-written-v1');expect(Object.keys(backup.entries).sort()).toEqual(ids);
 expect(backup.entries[ids[0]].checks).toEqual([true,false,true]);expect(backup.entries[ids[1]].checks).toEqual([false,false,false]);
 expect(await editor.locator('img').count()).toBe(0);expect(errors).toEqual([]);expect(responseRequests).toEqual([]);
});

test('existing NECO backups import across locales and loaded passages support local offline work',async({page,context})=>{
 const errors=[],sent=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(request.method()!=='GET'&&request.method()!=='HEAD')sent.push({url:request.url(),body:request.postData()});});
 await page.setViewportSize({width:320,height:844});await page.goto(configs[1].route+'#written='+ids[0]);
 const old={version:1,bankId:'ssce-written-v1',entries:{
  [ids[0]]:{answer:'NECO_READING_SYNTHETIC old Q5 response',checks:[true,false,true]},
  [ids[1]]:{answer:'NECO_READING_SYNTHETIC old Q6 response',checks:[false,true,false]}
 }};
 await page.locator('#written-import').setInputFiles({name:'old-neco-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});
 await expect(page.locator('#written-answer')).toHaveValue(old.entries[ids[0]].answer);
 await page.getByRole('button',{name:configs[1].save,exact:true}).click();
 await page.locator('#written-task').selectOption(ids[1]);await expect(page.locator('#written-answer')).toHaveValue(old.entries[ids[1]].answer);
 await page.getByRole('button',{name:configs[1].save,exact:true}).click();
 await page.goto(configs[2].route+'#written='+ids[1]);await expect(page.locator('#written-answer')).toHaveValue(old.entries[ids[1]].answer);
 await expect(page.locator('#written-editor input[type=checkbox]').nth(1)).toBeChecked();
 await page.locator('#written-import').setInputFiles({name:'malformed.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
 await expect(page.locator('#written-answer')).toHaveValue(old.entries[ids[1]].answer);
 await context.setOffline(true);
 await page.locator('#written-task').selectOption(ids[0]);await expect(page.locator('.practice-passage p')).toHaveCount(6);
 await page.locator('#written-answer').fill('NECO_READING_SYNTHETIC offline revision');await page.getByRole('button',{name:configs[2].save,exact:true}).click();
 await page.locator('#written-task').selectOption(ids[1]);await expect(page.locator('.practice-passage p')).toHaveCount(7);
 await page.locator('#written-task').selectOption(ids[0]);await expect(page.locator('#written-answer')).toHaveValue('NECO_READING_SYNTHETIC offline revision');
 await page.locator('.written-explanation summary').focus();await page.keyboard.press('Enter');await expect(page.locator('.written-explanation')).toHaveAttribute('open','');
 await layout(page);expect(errors).toEqual([]);expect(sent.filter(r=>(r.body||'').includes('NECO_READING_SYNTHETIC'))).toEqual([]);
 // This proves offline work in an already loaded page, not uncached offline navigation.
 await context.setOffline(false);
});

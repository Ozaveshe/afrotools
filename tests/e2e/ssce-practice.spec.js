const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
test('practice explains on demand, resumes and exports at mobile width',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.goto('/tools/ssce-practice/');
 await page.getByRole('button',{name:'Start practice',exact:true}).click();
 await page.getByRole('button',{name:'Check answer',exact:true}).click();await expect(page.locator('#practice-status')).toContainText('Choose an answer');
 await page.getByRole('radio',{name:'C. 150',exact:true}).check();await page.getByRole('button',{name:'Check answer',exact:true}).click();
 await expect(page.locator('.practice-feedback')).toHaveText('Correct.');await expect(page.locator('.practice-explanation')).not.toHaveAttribute('open','');
 await page.getByText('Show explanation',{exact:true}).click();await expect(page.locator('.practice-explanation')).toContainText('240 − 90 = 150');
 await page.getByRole('button',{name:'Save progress on this device',exact:true}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download practice report',exact:true}).click();const report=await download;expect(report.suggestedFilename()).toBe('afrotools-ssce-report.txt');
 const reportText=await fs.readFile(await report.path(),'utf8');expect(reportText).toContain('Your answer: 150');expect(reportText).toContain('Correct answer: 150');expect(reportText).toContain('240 − 90 = 150');
 await page.reload();await page.getByRole('button',{name:'Resume saved practice',exact:true}).click();await expect(page.locator('.practice-feedback')).toHaveText('Correct.');
 await page.getByRole('button',{name:'Next question',exact:true}).click();await expect(page.locator('#practice-session h2')).toHaveText('Question 2 of 24');
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('downloaded backup restores actual progress and unavailable storage keeps downloads working',async({page})=>{
 await page.goto('/tools/ssce-practice/');await page.getByRole('button',{name:'Start practice',exact:true}).click();
 await page.getByRole('radio',{name:'C. 150',exact:true}).press('Space');await page.getByRole('button',{name:'Check answer',exact:true}).press('Enter');await page.getByRole('button',{name:'Next question',exact:true}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download progress backup',exact:true}).click();const backup=await download;const bytes=await fs.readFile(await backup.path());
 const data=JSON.parse(bytes.toString('utf8'));expect(data.index).toBe(1);expect(data.answers.m1).toBe(2);
 await page.reload();await page.locator('#practice-import').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:bytes});await expect(page.locator('#practice-session h2')).toHaveText('Question 2 of 24');
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage is full','QuotaExceededError');};});
 await page.getByRole('button',{name:'Save progress on this device',exact:true}).click();await expect(page.locator('#practice-status')).not.toContainText('Progress saved');
 const fallback=page.waitForEvent('download');await page.getByRole('button',{name:'Download progress backup',exact:true}).click();expect((await fallback).suggestedFilename()).toBe('afrotools-ssce-progress.json');
});
test('complete topic, retry misses and schedule revision in the study day',async({page})=>{
 await page.goto('/tools/ssce-practice/');await page.getByLabel('Subject',{exact:true}).selectOption('English');await page.getByLabel('Topic',{exact:true}).selectOption('Writing decisions');await page.getByRole('button',{name:'Start practice',exact:true}).click();
 await page.getByRole('radio').first().check();await page.getByRole('button',{name:'Check answer',exact:true}).click();await page.getByRole('button',{name:'Next question',exact:true}).click();await page.getByRole('radio').nth(2).check();await page.getByRole('button',{name:'Check answer',exact:true}).click();await page.getByRole('button',{name:'See results',exact:true}).click();
 await expect(page.locator('.practice-score')).toContainText('1 correct out of 2');
 const schedule=page.getByRole('button',{name:'Save a revision session for tomorrow',exact:true});await schedule.click();await schedule.click();
 await expect(page.locator('#practice-status')).toContainText('Revision saved');
 await page.getByRole('button',{name:'Retry missed questions',exact:true}).click();await expect(page.locator('#practice-session h2')).toHaveText('Question 1 of 1');
 await page.goto('/tools/education-hub/#daily-study');await page.getByText('Coming up (1)',{exact:true}).click();await page.getByRole('button',{name:'Start session',exact:true}).click();await expect(page.getByRole('link',{name:'Open WAEC/NECO practice',exact:true})).toHaveAttribute('href','/tools/ssce-practice/');
});
test('passages are complete and failed saves preserve existing data',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('afrotools.sscePractice.v1','broken-backup'));
 await page.goto('/tools/ssce-practice/');await page.getByRole('button',{name:'Resume saved practice',exact:true}).click();await expect(page.locator('#practice-status')).toContainText('kept unchanged');
 await page.getByLabel('Subject',{exact:true}).selectOption('English');await page.getByRole('button',{name:'Start practice',exact:true}).click();await expect(page.locator('.practice-passage')).toContainText('a dependable plan would keep it open');
 await page.getByRole('button',{name:'Save progress on this device',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('afrotools.sscePractice.v1'))).toBe('broken-backup');
 const backup=JSON.stringify({version:1,bankId:'ssce-foundations-2026-09',ids:['missing'],index:0,answers:{}});
 await page.locator('#practice-import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(backup)});await expect(page.locator('#practice-status')).toContainText('Backup not opened');await expect(page.locator('.practice-passage')).toBeVisible();
 await page.getByRole('radio').nth(1).check();await page.getByRole('button',{name:'Check answer',exact:true}).click();
 const reportEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Download practice report',exact:true}).click();const report=await reportEvent;
 const text=await fs.readFile(await report.path(),'utf8');expect(text).toContain('a dependable plan would keep it open.');expect(text).toContain('B. To give students access after lessons');
});

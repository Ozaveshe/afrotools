const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
test('2022 subpart has an optional explanation and survives save and reload on mobile',async({page})=>{
 await page.setViewportSize({width:320,height:800});await page.goto('/tools/ssce-practice/');
 await expect(page.locator('h1')).toContainText('WAEC and NECO Mathematics');
 await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content',/^WAEC & NECO/);
 await page.getByLabel('Collection',{exact:true}).selectOption('WAEC 2022 Mathematics companion');
 await expect(page.locator('#written-editor')).toContainText('2022 · Paper 2 · Question 1(b)');
 await expect(page.locator('#written-editor details')).not.toHaveAttribute('open','');
 await page.getByText('Show worked solution',{exact:true}).click();
 await expect(page.locator('#written-editor details')).toContainText('17k = 68');
 await page.getByLabel('Your written answer',{exact:true}).fill('12; checked using 16 as the larger value.');
 await page.getByRole('button',{name:'Save response on this device',exact:true}).click();await page.reload();
 await page.getByLabel('Collection',{exact:true}).selectOption('WAEC 2022 Mathematics companion');
 await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('12; checked using 16 as the larger value.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});
test('large valid backups and dark enlarged-text diagrams remain usable',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('aft_theme','dark'));
 await page.setViewportSize({width:390,height:844});await page.goto('/tools/ssce-practice/#written-practice');
 const bank=require('../../assets/js/lib/ssce-written-bank.js');const entries={};for(const q of bank.items)entries[q.id]={answer:'x'.repeat(20000),checks:q.checks.map(()=>false)};
 const buffer=Buffer.from(JSON.stringify({version:1,bankId:bank.id,entries}));expect(buffer.length).toBeGreaterThan(500000);
 await page.locator('#written-import').setInputFiles({name:'full-backup.json',mimeType:'application/json',buffer});await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('x'.repeat(20000));
 await page.getByLabel('Collection',{exact:true}).selectOption('WAEC 2023 Mathematics companion');await page.getByLabel('Written task',{exact:true}).selectOption('waec-2023-mathematics-p2-q13');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.addStyleTag({content:'html{font-size:200%!important}'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);await page.locator('.written-diagram').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('written-dark-large-text.png')});
});
for(const width of [320,390,1280])test('written solution, save and export at '+width,async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await page.goto('/tools/ssce-practice/#written-practice');
 await expect(page.getByLabel('Written task',{exact:true})).toHaveValue('written-m1');
 await page.getByLabel('Your written answer',{exact:true}).fill('45; 1.68 × 10¹');
 await expect(page.locator('#written-editor details')).not.toHaveAttribute('open','');await page.getByText('Show worked solution',{exact:true}).click();await expect(page.locator('#written-editor details')).toContainText('32 + 12 + 1 = 45');
 await page.getByLabel('I used powers of 4 for the place values.',{exact:true}).check();await page.getByRole('button',{name:'Save response on this device',exact:true}).click();await expect(page.locator('#written-status')).toContainText('Response saved');await page.reload();
 await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('45; 1.68 × 10¹');await expect(page.getByLabel('I used powers of 4 for the place values.',{exact:true})).toBeChecked();
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download written-practice report',exact:true}).click();const file=await downloaded;const text=await fs.readFile(await file.path(),'utf8');expect(text).toContain('45; 1.68 × 10¹');expect(text).toContain('not automatically graded');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);expect(errors).toEqual([]);await page.screenshot({path:info.outputPath('written-'+width+'.png'),fullPage:true});
});
test('WAEC companions preserve provenance and unsaved work between tasks',async({page})=>{
 await page.goto('/tools/ssce-practice/#written-practice');await page.getByLabel('Collection',{exact:true}).selectOption('WAEC 2023 writing companion');await expect(page.locator('#written-editor')).toContainText('2023 · Paper 2 · Question 1');await expect(page.locator('#written-editor a')).toHaveAttribute('href',/Engl240mq1.html$/);
 await page.getByLabel('Your written answer',{exact:true}).fill('Synthetic sports report draft.');await page.getByLabel('Written task',{exact:true}).selectOption('waec-2023-english-p2-q2');await page.getByLabel('Your written answer',{exact:true}).fill('Synthetic letter draft.');await page.getByRole('button',{name:'Save response on this device',exact:true}).click();
 await page.getByLabel('Written task',{exact:true}).selectOption('waec-2023-english-p2-q1');await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('Synthetic sports report draft.');await page.getByRole('button',{name:'Save response on this device',exact:true}).click();
 await page.getByText('Show writing guide',{exact:true}).click();await expect(page.locator('#written-editor details')).toContainText('There is no single model answer');
});
test('blocked storage preserves the response and permits backup export',async({page})=>{
 await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='afrotools.ssceWritten.v1')throw Error('Storage is unavailable');return original.call(this,k,v);};});
 await page.goto('/tools/ssce-practice/#written-practice');await page.getByLabel('Your written answer',{exact:true}).fill('Synthetic unsaved answer');await page.getByRole('button',{name:'Save response on this device',exact:true}).click();await expect(page.locator('#written-status')).toContainText('Storage is unavailable');await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('Synthetic unsaved answer');
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download written-practice backup',exact:true}).click();const file=await downloaded;const backup=JSON.parse(await fs.readFile(await file.path(),'utf8'));expect(backup.entries['written-m1'].answer).toBe('Synthetic unsaved answer');
});
test('import validates before replacing anything and restores a fresh task',async({page})=>{
 await page.goto('/tools/ssce-practice/#written-practice');await page.locator('#written-import').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,bankId:'ssce-written-v1',entries:{'written-m1':{answer:'Imported synthetic answer',checks:[true,false]}}}))});await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('Imported synthetic answer');
 await page.locator('#written-import').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"entries":{}}')});await expect(page.locator('#written-status')).toContainText('Backup not opened');await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('Imported synthetic answer');
 await page.getByRole('button',{name:'Save response on this device',exact:true}).click();await page.reload();await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('Imported synthetic answer');
});
test('every companion renders complete briefs and accessible geometry at mobile width',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/tools/ssce-practice/#written-practice');await page.getByLabel('Collection',{exact:true}).selectOption('WAEC 2023 Mathematics companion');
 for(const number of [1,2,3,5,7,8,9,11,13]){
  await page.getByLabel('Written task',{exact:true}).selectOption('waec-2023-mathematics-p2-q'+number);
  await expect(page.locator('.written-prompt')).not.toContainText('Use WAEC Question');await expect(page.locator('#written-editor')).toContainText('Question '+number);
  if([3,13].includes(number)){const figure=page.locator('.written-diagram');await expect(figure).toHaveAttribute('role','img');expect((await figure.getAttribute('aria-label')).length).toBeGreaterThan(100);const rect=await figure.boundingBox();expect(rect.width).toBeLessThanOrEqual(390);await figure.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('geometry-'+number+'.png')});}
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});
test('new 2022 tasks show optional complete solutions on small screens',async({page})=>{
 await page.setViewportSize({width:320,height:800});await page.goto('/tools/ssce-practice/');await page.getByLabel('Collection',{exact:true}).selectOption('WAEC 2022 Mathematics companion');
 const bank=require('../../assets/js/lib/ssce-written-bank');
 for(const num of ['6','8ab','9','10','12a','13']){const q=bank.items.find(q=>q.id==='waec-2022-mathematics-p2-q'+num);await page.getByLabel('Written task',{exact:true}).selectOption(q.id);await expect(page.locator('.written-prompt')).toContainText(q.prompt);await expect(page.locator('#written-editor details')).not.toHaveAttribute('open','');await page.getByText('Show worked solution',{exact:true}).click();for(const step of q.steps)await expect(page.locator('#written-editor details')).toContainText(step);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);}
});

test('NECO starter shows exact source numbers and saves a worked response at mobile width',async({page})=>{
 await page.setViewportSize({width:320,height:800});await page.goto('/tools/ssce-practice/');
 await page.locator('#written-collection').selectOption('NECO 2023 Mathematics starter');
 for(const [id,number,answer] of [['percentage',1,'90.'],['walking-time',5,'2/3 hour.'],['compound-interest',9,'₦432.59.']]){
  await page.locator('#written-task').selectOption('neco-2023-mathematics-'+id);
  await expect(page.locator('#written-editor')).toContainText('Paper III · Question '+number);
  await expect(page.locator('.written-explanation')).not.toHaveAttribute('open','');
  await page.getByRole('button',{name:'Save response on this device',exact:true}).click();
  await page.getByText('Show worked solution',{exact:true}).click();await expect(page.locator('.written-explanation')).toContainText(answer);
 }
 await page.getByLabel('Your written answer',{exact:true}).fill('1200 × 1.08^4 − 1200 = 432.59');
 await page.getByRole('button',{name:'Save response on this device',exact:true}).click();
 await page.reload();await page.locator('#written-collection').selectOption('NECO 2023 Mathematics starter');await page.locator('#written-task').selectOption('neco-2023-mathematics-compound-interest');
 await expect(page.getByLabel('Your written answer',{exact:true})).toHaveValue('1200 × 1.08^4 − 1200 = 432.59');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

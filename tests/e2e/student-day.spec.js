const {test,expect}=require('@playwright/test');
for(const width of [390,1440])test(`daily student journey persists across tools at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/tools/education-hub/#daily-study');
 const day=page.locator('[data-student-day]');await day.getByLabel('Subject or topic').fill('Mathematics: fractions');await day.getByRole('button',{name:'Add session',exact:true}).click();
 await expect(day.locator('.sd-task')).toHaveCount(1);await day.getByRole('button',{name:'Start session',exact:true}).click();await expect(day.locator('.sd-focus')).toContainText('Continue: Mathematics');
 await page.goto('/tools/study-planner/#daily-study');await expect(page.locator('.sd-focus')).toContainText('Mathematics: fractions');await page.getByRole('button',{name:'Finish this session'}).click();await page.reload();
 await expect(day.locator('.sd-summary')).toContainText('1 completed');await day.getByText('Completed sessions (1)',{exact:true}).click();await day.getByRole('button',{name:'Undo completion'}).click();
 await day.getByText('Move date',{exact:true}).click();await day.getByLabel('New date for Mathematics: fractions').fill('2099-01-02');await day.getByRole('button',{name:'Move session',exact:true}).click();await expect(day.locator('.sd-summary')).toContainText('0 sessions ready');
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.goto('/tools/education-hub/#daily-study');await day.getByText('Coming up (1)',{exact:true}).click();await expect(day.locator('.sd-task')).toContainText('2099-01-02');
});
test('weekly timetable imports without duplicate sessions and keeps completion',async({page})=>{
 await page.goto('/tools/study-planner/?exam=jamb');const save=page.getByRole('button',{name:'Save sessions to my study day'});await save.click();await expect(page.locator('#studentPlanSaveStatus')).toContainText('Sessions saved');const count=await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools.studentDay.v1')).tasks.length);expect(count).toBeGreaterThan(0);await save.click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools.studentDay.v1')).tasks.length)).toBe(count);
 await page.locator('.sp-tab[data-tab="setup"]').click();await page.locator('#hoursPerDay').fill('0');await page.locator('.sp-tab[data-tab="timetable"]').click();await save.click();
 await expect(page.locator('#studentPlanSaveStatus')).toContainText('Sessions not saved');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools.studentDay.v1')).tasks.length)).toBe(count);
});

test('saved flashcard review returns to its deck and completes the daily session',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{
  if(!localStorage.getItem('afro_flashcards'))localStorage.setItem('afro_flashcards',JSON.stringify({decks:[{name:'Fractions',cards:[{front:'One half plus one quarter?',back:'Three quarters',mastered:false,reviewCount:1}]}],activeDeck:0}));
 });
 await page.goto('/tools/flashcard-maker/');
 await page.getByRole('tab',{name:'Progress',exact:true}).click();
 const schedule=page.getByRole('button',{name:'Schedule tomorrow’s review'});await schedule.click();await schedule.click();
 await expect(page.locator('#reviewPackStatus')).toContainText('Review saved');
 await page.goto('/tools/education-hub/#daily-study');
 await page.getByText('Coming up (1)',{exact:true}).click();await page.getByRole('button',{name:'Start session',exact:true}).click();
 await page.getByRole('link',{name:'Review this deck',exact:true}).click();
 await expect(page.locator('#panel-study')).toHaveClass(/active/);
 await page.getByRole('tab',{name:'Progress',exact:true}).click();
 await page.getByRole('button',{name:'Complete my study session'}).click();
 await expect(page.locator('#reviewPackStatus')).toContainText('Study session completed');
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.goto('/tools/education-hub/#daily-study');await expect(page.locator('.sd-summary')).toContainText('1 completed');
});

test('corrupt study storage is preserved and reported',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('afrotools.studentDay.v1','broken backup'));
 await page.goto('/tools/education-hub/#daily-study');
 await expect(page.locator('.sd-status')).toContainText('could not be loaded');
 await expect(page.locator('.sd-summary')).toContainText('Storage unavailable');
 await expect(page.getByRole('button',{name:'Add session',exact:true})).toBeDisabled();
 expect(await page.evaluate(()=>localStorage.getItem('afrotools.studentDay.v1'))).toBe('broken backup');
});

test('backup import merges without duplicates and rejects invalid dates',async({page})=>{
 await page.goto('/tools/education-hub/#daily-study');
 const day=page.locator('[data-student-day]');
 await day.getByLabel('Subject or topic').fill('English');await day.getByRole('button',{name:'Add session',exact:true}).click();
 const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools.studentDay.v1')));
 const incoming={...original,tasks:[...original.tasks,{id:'backup-session',subject:'Biology',date:'2099-01-01',minutes:25,doneAt:null}]};
 await day.getByLabel('Restore study backup').setInputFiles({name:'study.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
 await expect(day.locator('.sd-status')).toContainText('Backup imported');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools.studentDay.v1')).tasks.length)).toBe(2);
 incoming.tasks[1].date='2099-02-30';
 await day.getByLabel('Restore study backup').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
 await expect(day.locator('.sd-status')).toContainText('Backup not imported');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools.studentDay.v1')).tasks[1].date)).toBe('2099-01-01');
});

test('starting a session reports storage failure without losing the plan',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/tools/education-hub/#daily-study');
 const day=page.locator('[data-student-day]');await day.getByLabel('Subject or topic').fill('English');await day.getByRole('button',{name:'Add session',exact:true}).click();
 await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='afrotools.studentDay.v1')throw new Error('Storage full');return original.call(this,k,v);};});
 await day.getByRole('button',{name:'Start session',exact:true}).click();
 await expect(day.locator('.sd-status')).toContainText('Could not save');await expect(day.locator('.sd-focus')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools.studentDay.v1')).activeId)).toBeNull();expect(errors).toEqual([]);
});

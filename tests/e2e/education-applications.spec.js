const {test,expect}=require('@playwright/test');
test('scholarship shortlist imports once and progress follows the student to the Hub',async({page})=>{
 const writes=[];page.on('request',request=>{if(request.method()!=='GET')writes.push(request.postData()||'');});
 await page.setViewportSize({width:390,height:900});await page.goto('/tools/scholarship-finder/#my-applications');
 await page.locator('.sch-card [data-sch-save]').first().click();
 const tracker=page.locator('[data-education-applications]');await tracker.getByRole('button',{name:'Track my saved scholarships'}).click();
 await expect(tracker.locator('.ea-item')).toHaveCount(1);await tracker.getByRole('button',{name:'Track my saved scholarships'}).click();await expect(tracker.locator('.ea-item')).toHaveCount(1);
 await tracker.locator('.ea-item>summary').click();
 await tracker.getByLabel('Application status',{exact:true}).selectOption('Preparing');
 await tracker.getByLabel('Next action',{exact:true}).fill('Collect synthetic transcript fixture');
 await tracker.getByLabel('Add a required document or task').fill('Transcript');
 await tracker.getByRole('button',{name:'Save application',exact:true}).click();
 await page.goto('/tools/education-hub/#my-applications');await tracker.locator('.ea-item>summary').click();
 await expect(tracker.getByLabel('Next action',{exact:true})).toHaveValue('Collect synthetic transcript fixture');
 await tracker.getByLabel('Transcript',{exact:true}).check();await tracker.getByRole('button',{name:'Save application',exact:true}).click();
 await page.reload();await tracker.locator('.ea-item>summary').click();await expect(tracker.getByLabel('Transcript',{exact:true})).toBeChecked();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(writes.join(' ')).not.toContain('Collect synthetic transcript fixture');
});
test('manual applications validate deadline provenance, archive reversibly, and export a backup',async({page})=>{
 await page.goto('/tools/education-hub/#my-applications');const tracker=page.locator('[data-education-applications]');
 await tracker.getByLabel('New application name').fill('Engineering intake');await tracker.getByRole('button',{name:'Add application',exact:true}).click();await tracker.locator('.ea-item>summary').click();
 await tracker.getByLabel('Confirmed application deadline').fill('2027-01-20');await tracker.getByRole('button',{name:'Save application',exact:true}).click();await expect(tracker.locator('.sd-status')).toContainText('Add the official source');
 await tracker.getByLabel('Official source URL').fill('https://example.org/admissions');await tracker.getByLabel('Date you checked the official source').fill('2026-01-01');await tracker.getByRole('button',{name:'Save application',exact:true}).click();
 await tracker.locator('.ea-item>summary').click();await tracker.getByRole('button',{name:'Archive application',exact:true}).click();await expect(tracker.locator('.sd-summary')).toContainText('0 active');
 await tracker.getByText('Archived applications (1)',{exact:true}).click();await tracker.locator('.ea-item>summary').click();await tracker.getByRole('button',{name:'Restore application',exact:true}).click();await expect(tracker.locator('.sd-summary')).toContainText('1 active');
 const downloadPromise=page.waitForEvent('download');await tracker.getByRole('button',{name:'Download applications backup'}).click();const download=await downloadPromise;const stream=await download.createReadStream();let text='';for await(const part of stream)text+=part;expect(JSON.parse(text).items[0].deadline).toBe('2027-01-20');
});

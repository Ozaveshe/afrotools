const {test,expect}=require('@playwright/test');
const id='mathematics-2022-myschool-64266',manifest=require('../../ops/nigeria-exams/jamb-math-2022-curated-batch-03.json');
const pool=require('../../ops/jamb/source-pool.json'),ledger=require('../../data/jamb/review-ledger.json');
const {assessQuestion}=require('../../scripts/lib/jamb-content-trust');
const expectedIds=pool.questions.filter(q=>q.subject==='mathematics'&&q.year===2022&&assessQuestion(q,ledger).state==='eligible').map(q=>q.id).sort();
for(const width of [320,390])test(`real reviewed angle guide and scoped 2022 CBT answer flow at ${width}px`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width,height:900});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/jamb/mathematics/2022/');const card=page.locator('[data-reviewed-question="'+id+'"]');await expect(card.locator('.qcard-text')).toHaveText(manifest.items[0].question);await expect(card.locator('details')).not.toHaveAttribute('open','');await card.locator('summary').click();await expect(card.getByText(manifest.items[0].explanation,{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.goto('/jamb/cbt/?subject=mathematics&year=2022');
 await page.locator('#start-btn').click();await expect(page.locator('#cbt-shell')).toBeVisible();
 const session=await page.evaluate(()=>{const s=AfroJAMB.CBT.getState();return {year:s.year,questions:s.questions};});
 expect(session.year).toBe(2022);expect(session.questions.map(q=>q.id).sort()).toEqual(expectedIds);expect(new Set(session.questions.map(q=>q.id)).size).toBe(expectedIds.length);
 expect(session.questions.every(q=>q.subject==='mathematics'&&q.year===2022)).toBe(true);
 expect(session.questions.some(q=>q.id===id)).toBe(true);
 let targetSeen=false;
 for(let i=0;i<session.questions.length;i++){
  const q=await page.evaluate(()=>AfroJAMB.CBT.getCurrentQuestion().question);
  if(q.id===id){
   targetSeen=true;expect(q.answer).toBe('A');expect(q.num).toBeNull();expect(q.options).toEqual(manifest.items[0].options);
   await expect(page.locator('#cbt-q-text')).toHaveText(manifest.items[0].question);
   await expect(page.locator('#cbt-options [role="radio"]')).toHaveCount(4);
   for(const letter of ['A','B','C','D'])await expect(page.getByRole('radio',{name:'Option '+letter+': '+manifest.items[0].options[letter],exact:true})).toBeVisible();
  }
  await page.getByRole('radio',{name:'Option '+q.answer+': '+q.options[q.answer],exact:true}).click();
  if(q.id===id)expect(await page.evaluate(()=>AfroJAMB.CBT.getCurrentQuestion().selectedAnswer)).toBe('A');
  if(i<session.questions.length-1)await page.locator('#cbt-next').click();
 }
 expect(targetSeen).toBe(true);
 await page.locator('#cbt-submit-top').click();await page.locator('#confirm-submit-btn').click();
 await expect(page.locator('#result-aggregate')).toHaveText(`${expectedIds.length}/${expectedIds.length}`);await expect(page.locator('#result-score-detail')).toHaveText('100% correct in this practice selection');
 const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('afrojamb-collection-history'))[0]);
 expect(history).toMatchObject({year:2022,subject:'mathematics',correct:expectedIds.length,graded:expectedIds.length,percent:100});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});

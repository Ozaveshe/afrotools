const {test,expect}=require('@playwright/test');
const manifest=require('../../ops/nigeria-exams/jamb-math-2021-curated-batch-03.json');
const targetIds=manifest.items.map(i=>'mathematics-2021-myschool-'+i.sourceItem);
for(const width of [320,390])test(`four real 2021 Mathematics items complete scoped CBT at ${width}px`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width,height:900});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/jamb/mathematics/2021/');
 for(const item of manifest.items){
  const card=page.locator('[data-reviewed-question="mathematics-2021-myschool-'+item.sourceItem+'"]');
  await expect(card.locator('.qcard-text')).toHaveText(item.question);await expect(card.locator('details')).not.toHaveAttribute('open','');
  await card.locator('summary').click();await expect(card.getByText(item.explanation,{exact:true})).toBeVisible();await card.locator('summary').click();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.goto('/jamb/cbt/?subject=mathematics&year=2021');await page.locator('#start-btn').click();await expect(page.locator('#cbt-shell')).toBeVisible();
 const session=await page.evaluate(()=>{const s=AfroJAMB.CBT.getState();return {year:s.year,questions:s.questions};});
 expect(session.year).toBe(2021);expect(session.questions).toHaveLength(9);expect(new Set(session.questions.map(q=>q.id)).size).toBe(9);
 expect(session.questions.every(q=>q.subject==='mathematics'&&q.year===2021)).toBe(true);
 const seen=[];
 for(let i=0;i<session.questions.length;i++){
  const q=await page.evaluate(()=>AfroJAMB.CBT.getCurrentQuestion().question),item=manifest.items.find(x=>'mathematics-2021-myschool-'+x.sourceItem===q.id);
  if(item){seen.push(q.id);expect(q.answer).toBe(item.answer);expect(q.num).toBeNull();expect(q.options).toEqual(item.options);await expect(page.locator('#cbt-q-text')).toHaveText(item.question);await expect(page.locator('#cbt-options [role="radio"]')).toHaveCount(4);for(const letter of ['A','B','C','D'])await expect(page.getByRole('radio',{name:'Option '+letter+': '+item.options[letter],exact:true})).toBeVisible();}
  await page.getByRole('radio',{name:'Option '+q.answer+': '+q.options[q.answer],exact:true}).click();expect(await page.evaluate(()=>AfroJAMB.CBT.getCurrentQuestion().selectedAnswer)).toBe(q.answer);
  if(i<session.questions.length-1)await page.locator('#cbt-next').click();
 }
 expect(seen.sort()).toEqual([...targetIds].sort());await page.locator('#cbt-submit-top').click();await page.locator('#confirm-submit-btn').click();
 await expect(page.locator('#result-aggregate')).toHaveText('9/9');await expect(page.locator('#result-score-detail')).toHaveText('100% correct in this practice selection');
 const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('afrojamb-collection-history'))[0]);expect(history).toMatchObject({year:2021,subject:'mathematics',correct:9,graded:9,percent:100});
 for(const item of manifest.items){const card=page.locator('#review-list .rev-card').filter({has:page.locator('.rev-q').filter({hasText:item.question})});await expect(card).toHaveCount(1);await expect(card.locator('details')).not.toHaveAttribute('open','');await card.locator('summary').click();await expect(card.locator('.reviewed-explanation')).toHaveText(item.explanation);await card.locator('summary').click();}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});

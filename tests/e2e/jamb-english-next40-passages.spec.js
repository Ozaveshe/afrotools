const {test,expect}=require('@playwright/test');
const {renderYear}=require('../../scripts/build-jamb-reviewed-pages');
const batch=require('../../ops/jamb/review-candidates/english/english-2018-002.json');

for(const width of [320,390])test(`Next English cohort retains full passage context at ${width}px`,async({page})=>{
 const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:'2026-09-12',evidence:'Unpublished candidate rendering fixture only'};
 const ledger={sources:{[batch.source_id]:batch.source},questions:Object.fromEntries(batch.records.map(r=>[r.id,{source_id:batch.source_id,content_sha256:r.content_sha256,question_review:review,answer_review:review,explanation_review:review}]))};
 const html=renderYear('english','2018',batch.records.filter(r=>r.candidate.year===2018).map(r=>r.candidate),ledger,['2018']).html;
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.context().addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));
 await page.setViewportSize({width,height:900});
 await page.route('**/jamb/english/2018/',r=>r.fulfill({contentType:'text/html',body:html}));
 await page.goto('/jamb/english/2018/');
 await expect(page.locator('[data-reviewed-question]')).toHaveCount(19);
 await expect(page.locator('[data-reviewed-question] blockquote')).toHaveCount(10);
 await expect(page.locator('[data-reviewed-question] details[open]')).toHaveCount(0);
 for(const r of batch.records.filter(r=>r.candidate.passage)){
  const card=page.locator('[data-reviewed-question="'+r.id+'"]');
  await expect(card.locator('blockquote')).toHaveText(r.candidate.passage);
  await expect(card.locator('blockquote')).toBeVisible();
  await card.locator('summary').focus();await card.locator('summary').press('Enter');
  await expect(card.getByText(r.candidate.explanation,{exact:true})).toBeVisible();
  await card.locator('summary').press('Enter');
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(errors).toEqual([]);
});

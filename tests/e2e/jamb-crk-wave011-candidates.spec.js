const {test,expect}=require('@playwright/test');
const {renderYear}=require('../../scripts/build-jamb-reviewed-pages');
const batch=require('../../ops/jamb/review-candidates/crk/crk-wave011.json');
for(const width of [320,390])test(`CRK wave011 answer disclosures at ${width}px`,async({page})=>{
 const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:'2026-09-12',evidence:'Unpublished candidate rendering fixture only'};
 const ledger={sources:{[batch.source_id]:batch.source},questions:Object.fromEntries(batch.records.map(r=>[r.id,{source_id:batch.source_id,content_sha256:r.content_sha256,question_review:review,answer_review:review,explanation_review:review}]))};
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.context().addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));
 await page.setViewportSize({width,height:900});
 for(const year of [1990,1992,1991]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  if(!records.length)continue;
  const html=renderYear('crk',String(year),records.map(r=>r.candidate),ledger,[String(year)]).html;
  await page.route(`**/jamb/crk/${year}/`,route=>route.fulfill({contentType:'text/html',body:html}));
  await page.goto(`/jamb/crk/${year}/`);
  await expect(page.locator('[data-reviewed-question]')).toHaveCount(records.length);
  await expect(page.locator('[data-reviewed-question] details[open]')).toHaveCount(0);
  for(const r of records){
   const card=page.locator('[data-reviewed-question="'+r.id+'"]');
   if(r.candidate.passage){await expect(card.locator('blockquote')).toHaveText(r.candidate.passage);await expect(card.locator('blockquote')).toBeVisible();}
   await card.locator('summary').focus();await card.locator('summary').press('Enter');
   await expect(card.getByText(r.candidate.explanation,{exact:true})).toBeVisible();
   await card.locator('summary').press('Enter');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 expect(errors).toEqual([]);
});

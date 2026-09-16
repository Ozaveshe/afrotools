const {test,expect}=require('@playwright/test');
const batch=require('../../ops/jamb/verification/english-2019-publishable-900.json');

for(const width of [320,1280])test(`all new 2019 English questions teach on demand at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('/jamb/english/2019/');expect(response.status()).toBe(200);
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://afrotools.com/jamb/english/2019/');
 await expect(page.locator('[data-reviewed-question]')).toHaveCount(62);
 for(const record of batch.records){
  const q=record.after,card=page.locator('[data-reviewed-question="'+q.id+'"]');
  await expect(card.locator('.qcard-text')).toHaveText(q.question);
  await expect(card.locator('details')).not.toHaveAttribute('open','');
  await card.locator('summary').click();
  await expect(card.getByText(q.ai_explanation,{exact:true})).toBeVisible();
  await expect(card.locator('details strong')).toHaveText(q.answer+': '+q.options[q.answer]);
  await card.locator('summary').click();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(errors).toEqual([]);
});

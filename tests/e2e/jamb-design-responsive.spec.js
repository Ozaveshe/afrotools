const { test, expect } = require('@playwright/test');
for (const width of [320,390,768,1440]) {
 test(`JAMB cards and study controls fit ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:900});
  await page.goto('/jamb/');
  await expect(page.locator('.jb-tool-icon svg')).toHaveCount(17);
  await expect(page.locator('#subj-grid a')).toHaveCount(11);
  const cards = await page.locator('.jb-tool-grid > .jb-tool').evaluateAll(els=>els.map(el=>{
   const card=el.getBoundingClientRect(),icon=el.querySelector('.jb-tool-icon').getBoundingClientRect(),name=el.querySelector('.jb-tool-name').getBoundingClientRect();
   return {width:icon.width,height:icon.height,stacked:name.top>=icon.bottom,inside:icon.left>=card.left&&icon.right<=card.right,overflow:el.scrollWidth>el.clientWidth+1};
  }));
  for(const card of cards) expect(card).toEqual({width:44,height:44,stacked:true,inside:true,overflow:false});
  for(const route of ['/jamb/','/jamb/cbt/','/jamb/past-questions/','/jamb/study-plan/','/jamb/history/']) {
   await page.goto(route);
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await page.goto('/jamb/cbt/');
  await expect(page.locator('.mc-emoji svg')).toHaveCount(3);
  await page.locator('.mode-card[data-mode="subject"]').click();
  await expect(page.locator('input[value="subject"]')).toBeChecked();
 });
}


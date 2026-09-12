const {test,expect}=require('@playwright/test');
const bank=require('../../data/jamb/pools/practice-pool.json');
test('a delayed Biology diagram leaves other verified diagrams usable',async({page})=>{
  const figures=bank.questions.filter(q=>q.subject==='biology'&&q.image);
  const first=figures[0];
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**'+first.image,async route=>{await gate;await route.continue();});
  try {
    await page.goto('/jamb/biology/');
    const blocked=page.locator('[data-reviewed-question="'+first.id+'"]');
    await expect(blocked.locator('details')).toBeHidden();
    const other=figures.find(q=>q.image!==first.image);
    const ready=page.locator('[data-reviewed-question="'+other.id+'"]');
    await expect(ready.locator('img')).toBeVisible({timeout:30000});
    await expect(ready.locator('details')).toBeVisible();
    await expect(blocked.locator('details')).toBeHidden();
    release();
    await expect(blocked.locator('img')).toBeVisible({timeout:30000});
    await expect(blocked.locator('details')).toBeVisible();
  } finally {release();}
});

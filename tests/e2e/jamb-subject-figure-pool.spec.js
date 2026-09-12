const {test,expect}=require('@playwright/test');
const biology=require('../../data/jamb/pools/biology.json');
const illustrated=biology.questions.find(q=>q.image);

for(const route of ['/jamb/biology/',`/jamb/biology/${illustrated.year}/`]) {
  test(`diagram verification downloads only its subject bank on ${route}`,async({page})=>{
    const requests=[];
    page.on('request',r=>{if(r.url().includes('/data/jamb/pools/'))requests.push(new URL(r.url()).pathname);});
    await page.route('**/data/jamb/pools/practice-pool.json',r=>r.abort());
    await page.goto(route);
    const card=page.locator(`[data-reviewed-question="${illustrated.id}"]`);
    await expect(card.locator('img')).toBeVisible();
    await expect(card.locator('details')).toBeVisible();
    expect(requests).toContain('/data/jamb/pools/biology.json');
    expect(requests).not.toContain('/data/jamb/pools/practice-pool.json');
  });
}

test('a corrupted subject publication keeps diagram answers hidden',async({page})=>{
  await page.route('**/data/jamb/pools/biology.json',async route=>{
    const altered=structuredClone(biology);
    altered.questions.find(q=>q.id===illustrated.id).answer='INVALID';
    await route.fulfill({json:altered});
  });
  await page.goto(`/jamb/biology/${illustrated.year}/`);
  const card=page.locator(`[data-reviewed-question="${illustrated.id}"]`);
  await expect(card.locator('[data-reviewed-figure]')).toContainText('reviewed bank is unavailable');
  await expect(card.locator('img')).toHaveCount(0);
  await expect(card.locator('details')).toBeHidden();
});

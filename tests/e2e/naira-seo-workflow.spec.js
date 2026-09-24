const { test, expect } = require('@playwright/test');
test('Naira search landing reaches the converter and matches its reference example', async ({ page }) => {
  await page.setViewportSize({width:375,height:812});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/tools/naira-to-words/');
  await expect(page.locator('#amount')).toBeEnabled();
  await page.getByRole('link',{name:'Convert an amount',exact:true}).click();
  await expect.poll(async()=>{const box=await page.locator('#amount').boundingBox();return box.y>=70 && box.y+box.height<812;}).toBe(true);
  await page.locator('#amount').fill('100000');
  await expect(page.locator('#result')).toContainText('One Hundred Thousand Naira Only');
  await expect(page.getByRole('row').filter({hasText:'NGN 100,000'})).toContainText('One Hundred Thousand Naira Only');
  await page.locator('#amount').fill('250000.50');
  await expect(page.locator('#result')).toContainText('Two Hundred and Fifty Thousand Naira and Fifty Kobo Only');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

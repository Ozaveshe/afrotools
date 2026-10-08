const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test.use({trace:'off',video:'off',screenshot:'off'});
async function fill(row,name='Synthetic item') {
 await row.locator('.js-name').fill(name);
 for(const [cls,value] of [['cost','100'],['price','50'],['sold','5']])await row.locator('.js-'+cls).fill(value);
}
for(const [locale,route] of [['en','/tools/market-stall-profit/'],['fr','/fr/tools/profit-stand-marche/'],['sw','/sw/zana/faida-ya-kibanda-sokoni/']]) {
 test(`${locale} CSV preserves numeric losses and literal formula-like names`,async({page})=>{
  await page.goto(route);await fill(page.locator('.msp-item').first(),'=Synthetic');await page.locator('.msp-submit').click();
  const pending=page.waitForEvent('download');await page.locator('[data-action=csv]').click();
  const csv=fs.readFileSync(await(await pending).path(),'utf8');
  expect(csv).toContain('"\'=Synthetic"');expect(csv).toContain('"-250"');expect(csv).not.toContain('"\'-250"');
 });
 test(`${locale} removing a populated row invalidates the displayed result`,async({page})=>{
  await page.goto(route);await fill(page.locator('.msp-item').first());await page.locator('[data-action=add-item]').click();await fill(page.locator('.msp-item').nth(1),'Synthetic second');await page.locator('.msp-submit').click();
  await expect(page.locator('[data-results]')).toBeVisible();await page.locator('.msp-item').nth(1).locator('[data-action=remove-row]').click();await expect(page.locator('[data-results]')).toBeHidden();await expect(page.locator('[data-error]')).toBeVisible();
 });
 test(`${locale} invalid submission identifies and focuses the first field`,async({page})=>{
  await page.setViewportSize({width:320,height:850});await page.goto(route);await page.evaluate(dark=>document.documentElement.dataset.theme=dark?'dark':'light',locale!=='en');await fill(page.locator('.msp-item').first());await page.locator('.js-price').first().fill('-1');await page.locator('.msp-submit').click();
  await expect(page.locator('.js-price').first()).toBeFocused();await expect(page.locator('.js-price').first()).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('.js-price').first()).toHaveAttribute('aria-describedby','msp-validation-error');
  await expect(page.locator('.js-price').first()).toHaveCSS('border-top-color',locale==='en'?'rgb(180, 35, 24)':'rgb(255, 180, 169)');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.locator('.js-price').first().fill('50');await expect(page.locator('.js-price').first()).toBeFocused();await expect(page.locator('.js-price').first()).not.toHaveAttribute('aria-invalid','true');
  for(const input of await page.locator('.msp-item').first().locator('input').all())await input.fill('');
  await page.locator('[data-action=add-item]').click();await fill(page.locator('.msp-item').nth(1));await page.locator('.js-price').nth(1).fill('-1');await page.locator('.msp-submit').click();
  await expect(page.locator('.js-price').nth(1)).toBeFocused();await expect(page.locator('.js-price').nth(1)).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('.js-price').first()).not.toHaveAttribute('aria-invalid','true');
  await page.locator('.js-price').nth(1).fill('50');await page.locator('.msp-submit').click();await expect(page.locator('[data-results]')).toBeVisible();await expect(page.locator('[aria-invalid=true]')).toHaveCount(0);

 });
}

const { test, expect } = require('@playwright/test');

for (const width of [1440, 390]) {
  test(`operator queues, export and evidence at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width, height:900});
    const errors=[];
    page.on('pageerror', error=>errors.push(error.message));
    await page.goto('/mc-7a2f9x.html');
    await expect(page.locator('#snapshot')).toContainText('Snapshot generated');
    await expect(page.locator('#pro-list article')).toHaveCount(require('../../admin/data/operator-dashboard.json').pro.length);
    await page.locator('#pro-search').fill('AfroPayroll');
    await expect(page.locator('#pro-list article')).toHaveCount(1);
    await page.locator('#pro-state').selectOption('preview');
    await expect(page.locator('#pro-list article')).toHaveCount(0);
    await page.locator('#pro-search').fill('');
    await page.locator('#image-search').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#image-status')).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/operator-${width}.png`,fullPage:true});
    expect(errors).toEqual([]);
  });
}

test('image filters, batch prompts and CSV use audit data; untrusted text is inert', async ({page})=>{
  await page.route('**/admin/data/operator-dashboard.json',async route=>{
    const response=await route.fetch(); const data=await response.json();
    data.images={available:true,generated_at:'2026-09-08',rows:[
      {id:'review-me',path:'assets/img/logo-mark.svg',family:'brand',status:'unassigned',placements:[],text_status:'unknown',locale_reuse:'review'},
      {id:'placed',path:'assets/img/logo-mark.svg',family:'brand',status:'approved',placements:[{path:'index.html',kind:'img',locale:'en'}],locale_reuse:'safe'}
    ]};
    data.batch={available:true,generated_at:'2026-09-08',rows:[{id:'task-1',priority:1,name:'<script>throw Error(1)</script>',path:'future.webp',route:'javascript:alert(1)',status:'planned',prompt:'=malicious formula',alt:'Synthetic fixture'}]};
    await route.fulfill({json:data});
  });
  await page.goto('/mc-7a2f9x.html');
  await expect(page.locator('#image-count')).toContainText('2 matches');
  await page.locator('#image-status').selectOption('unassigned');
  await expect(page.locator('#image-count')).toContainText('1 matches');
  await page.locator('#image-status').selectOption('');
  await page.locator('#image-locale').selectOption('en');
  await expect(page.locator('#image-count')).toContainText('1 matches');
  await page.locator('#image-locale').selectOption('');
  await page.locator('#image-view').selectOption('batch');
  await expect(page.locator('#image-count')).toContainText('1 matches');
  await expect(page.locator('#image-table a[href^="javascript:"]')).toHaveCount(0);
  await page.getByText('Generation prompt and alt text').click();
  await expect(page.locator('#image-table')).toContainText('=malicious formula');
  await page.locator('[data-task="task-1"]').selectOption('in progress');
  await expect(page.locator('#action-status')).toContainText('saved on this device');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#export-images').click();
  const download=await downloadPromise;
  const fs=require('node:fs');
  const csv=fs.readFileSync(await download.path(),'utf8');
  expect(csv).toContain("'=malicious formula");
  expect(csv).toContain('in progress');
  expect(csv).not.toContain('review-me');
  await page.reload();
  await expect(page.locator('#image-count')).toContainText('2 matches');
  await page.locator('#image-view').selectOption('batch');
  await expect(page.locator('[data-task="task-1"]')).toHaveValue('in progress');
});

test('missing snapshot exposes recovery without throwing on controls', async ({page})=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/admin/data/operator-dashboard.json',route=>route.fulfill({status:404,body:'missing'}));
  await page.goto('/mc-7a2f9x.html');
  await expect(page.locator('#snapshot')).toContainText('Snapshot unavailable');
  await page.locator('#image-search').fill('anything');
  await page.locator('#pro-search').fill('anything');
  await expect(page.locator('#export-images')).toBeDisabled();
  expect(errors).toEqual([]);
});

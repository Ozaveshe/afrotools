const { test, expect } = require('@playwright/test');
 test.beforeEach(async ({page}) => { await page.request.post('/api/operator-dashboard/login',{headers:{Origin:'http://127.0.0.1:4189'},form:{credential:'synthetic-operator-test-only'}}); });

async function openView(page,id){
  if(await page.locator('#menu-toggle').isVisible())await page.locator('#menu-toggle').click();
  await page.locator('.sidebar nav [data-view="'+id+'"]').click();
}

for (const width of [1440, 390]) {
  test(`daily intelligence, launcher and focus at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});await page.goto('/mc-7a2f9x.html');
    await expect(page.locator('#engine-status')).toContainText('Operational summary');
    await expect(page.locator('#morning-list')).toContainText('awaiting review');
    await page.locator('#inbox-expand').click();await expect(page.locator('#morning-list')).toContainText('Pro apps need completion');
    await page.locator('#focus-input').fill('Verify next Pro workflow');await page.getByRole('button',{name:'Add focus task',exact:true}).click();
    await page.reload();await expect(page.locator('#focus-list')).toContainText('Verify next Pro workflow');
    await page.locator('[data-focus-check]').check();await expect(page.locator('[data-focus-check]')).toBeChecked();
    await page.keyboard.press('Control+k');await expect(page.locator('#command-dialog')).toBeVisible();
    await page.locator('#command-search').fill('Automation');await page.locator('#command-results a').click();
    await expect(page.locator('#automations-title')).toBeVisible();await page.locator('#automation-filter').selectOption('ready');
    await expect(page.locator('#automation-table tbody tr')).toHaveCount(1);await expect(page.locator('#automation-table')).toContainText('Morning content batch');
    await page.locator('#automation-filter').selectOption('completed');await expect(page.locator('#automation-table')).toContainText('Completed · no change');
    await openView(page,'work');await expect(page.locator('#work-table')).toContainText('3 outside main');
    await page.locator('#work-filter').selectOption('older');await expect(page.locator('#work-table')).toContainText('older-workspace');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.locator('#afro-theme-fallback-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
    await expect(page.locator('#work-search')).toHaveCSS('background-color','rgb(11, 21, 36)');
    await page.screenshot({path:'test-results/command-work-dark-'+width+'.png',fullPage:true});
    if(width===390){await page.locator('#menu-toggle').click();await page.keyboard.press('Escape');await expect(page.locator('#menu-toggle')).toBeFocused();}
  });
  test(`operator queues, export and evidence at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width, height:900});
    const errors=[];
    page.on('pageerror', error=>errors.push(error.message));
    await page.goto('/mc-7a2f9x.html');
    await expect(page.locator('#snapshot')).toContainText('Snapshot generated');
    await page.screenshot({path:'test-results/command-overview-'+width+'.png',fullPage:true});
    await openView(page,'pro');
    await expect(page.locator('#pro-list article')).toHaveCount(require('../../admin/data/operator-dashboard.json').pro.length);
    await page.locator('#pro-search').fill('AfroPayroll');
    await expect(page.locator('#pro-list article')).toHaveCount(1);
    await page.locator('#pro-state').selectOption('preview');
    await expect(page.locator('#pro-list article')).toHaveCount(0);
    await page.locator('#pro-search').fill('');
    await openView(page,'images');
    await page.locator('#image-search').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#image-status')).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/operator-${width}.png`,fullPage:true});
    expect(errors).toEqual([]);
  });
}

test('unavailable operational summary does not show zero healthy counts',async({page})=>{
  await page.route('**/api/operator-dashboard/operations.json',route=>route.fulfill({status:503,json:{available:false}}));
  await page.goto('/mc-7a2f9x.html');await expect(page.locator('#engine-status')).toContainText('unavailable');
  await expect(page.locator('#engine-metrics .metric').first().locator('strong')).toHaveText('—');
  await expect(page.locator('#morning-list')).toContainText('Refresh operational evidence');
});

test('image filters, batch prompts and CSV use audit data; untrusted text is inert', async ({page})=>{
  await page.route('**/api/operator-dashboard/snapshot.json',async route=>{
    const response=await route.fetch(); const data=await response.json();
    data.images={available:true,generated_at:'2026-09-08',rows:[
      {id:'review-me',path:'assets/img/logo-mark.svg',family:'brand',status:'unassigned',placements:[],text_status:'unknown',locale_reuse:'review'},
      {id:'placed',path:'assets/img/logo-mark.svg',family:'brand',status:'approved',placements:[{path:'index.html',kind:'img',locale:'en'}],locale_reuse:'safe'}
    ]};
    data.batch={available:true,generated_at:'2026-09-08',rows:[{id:'task-1',priority:1,name:'<script>throw Error(1)</script>',path:'future.webp',route:'javascript:alert(1)',status:'planned',prompt:'=malicious formula',alt:'Synthetic fixture'}]};
    await route.fulfill({json:data});
  });
  await page.goto('/mc-7a2f9x.html');
  await openView(page,'images');
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
  await page.route('**/api/operator-dashboard/snapshot.json',route=>route.fulfill({status:404,body:'missing'}));
  await page.goto('/mc-7a2f9x.html');
  await expect(page.locator('#snapshot')).toContainText('Snapshot unavailable');
  await openView(page,'images');
  await page.locator('#image-search').fill('anything');
  await expect(page.locator('#export-images')).toBeDisabled();
  await openView(page,'pro');
  await page.locator('#pro-search').fill('anything');
  await expect(page.locator('#export-images')).toBeDisabled();
  expect(errors).toEqual([]);
});

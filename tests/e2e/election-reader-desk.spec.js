
const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
  await page.route('**/data/government/election-surveys.json',route=>route.fulfill({contentType:'application/json',body:'{"schemaVersion":1,"surveys":[]}'}));
  await page.clock.install({time:new Date('2026-10-01T12:00:00Z')});
  await page.route('**/api/election-monitor',route=>route.fulfill({status:503,contentType:'application/json',body:'{"status":"unavailable","sources":[]}'}));
});
test('Nigeria opens real roster evidence without invented polls; exports preserve provenance',async({page})=>{
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/tools/africa-election-tracker/');
  await expect(page.locator('#briefCountry')).toBeEnabled();
  await page.locator('.et-country-file h3 a[data-country-code="NG"]').click();
  await expect(page.locator('#briefCountry')).toHaveValue('Nigeria');
  await expect(page.locator('#countryDeskContent')).toContainText('FALEGAN OPEYEMI DAVID');
  await page.locator('.et-contestant').first().locator('summary').click();
  await expect(page.locator('.et-contestant').first()).toContainText('No individually sourced evidence');
  await expect(page.locator('#countrySurveys')).toContainText('No source-reviewed polling');
  await page.locator('#briefCountry').selectOption('Cabo Verde');
  await expect(page.locator('#briefStream')).toContainText('Cabo Verde court admits sixth presidential bid');
  await page.locator('#briefQuery').fill('not-a-real-headline');
  await expect(page.locator('#briefStream')).toContainText('coverage gap');
  const csvDownload=page.waitForEvent('download');
  await page.locator('#exportElectionCsv').click();
  expect((await csvDownload).suggestedFilename()).toBe('africa-election-calendar.csv');
  expect(errors).toEqual([]);
});
test('country workspace reflows at 360px and keeps country navigation keyboard reachable',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await page.goto('/tools/africa-election-tracker/#country-NG');
  await expect(page.locator('#briefCountry')).toHaveValue('Nigeria');
  await expect(page.locator('.et-contestant').first()).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  expect(overflow).toBe(false);
  await page.screenshot({path:'test-results/election-reader-mobile.png',fullPage:true});
});
test('failed live JSON retains dated published snapshot and honest monitor state',async({page})=>{
  await page.route('**/data/government/africa-election-tracker.json',route=>route.fulfill({status:503,body:'unavailable'}));
  await page.goto('/tools/africa-election-tracker/');
  await expect(page.locator('#errorBox')).toContainText('published snapshot');
  await expect(page.locator('#briefStatus')).toContainText('Interactive briefing unavailable');
  await expect(page.locator('#electionList')).toContainText('Nigeria');
  await expect(page.locator('#briefCountry')).toBeDisabled();
});

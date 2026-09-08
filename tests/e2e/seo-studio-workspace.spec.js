const { test, expect } = require('@playwright/test');
const fs = require('fs');
const engine = require('../../netlify/functions/_shared/seo-audit-engine.js');
const report = engine.analyzeHtml({ html: '<html lang="en"><head><title>Example shop in Lagos</title></head><body><h1>Shop</h1></body></html>', url: 'https://example.com/' });
report.fetchedAt = '2026-09-08T12:00:00.000Z';
const csv = (clicks) => Buffer.from('Top pages,Clicks,Impressions,CTR,Position\nhttps://example.com/,' + clicks + ',100,1%,8');
async function setup(page, pro = true) {
  await page.route('**/assets/js/afro-auth.js*', route => route.fulfill({ contentType: 'application/javascript', body: `window.AfroAuth={getUser:()=>(${pro ? '{id:"seo-fixture",tier:"pro"}' : 'null'}),getSessionToken:()=>"synthetic-test-token",onReady:fn=>fn(),getSupabase:()=>null};` }));
  await page.route('**/api/profile', route => route.fulfill({ json: { profile: { id: 'seo-fixture', tier: pro ? 'pro' : 'free' } } }));
  await page.route('**/api/seo-audit', route => route.fulfill({ json: report }));
  await page.route(/https:\/\/(?!example\.com)/, route => route.fulfill({ status: 200, body: '' }));
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.goto('/pro/apps/seo-studio/');
  await expect(page.locator('html')).toHaveAttribute('data-pro-gate', pro ? 'unlocked' : 'locked');
}
for (const width of [390, 1440]) {
  test(`AC-6 project workflow, local imports and legacy tools at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors = [], payloads = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', req => { if (req.postData()) payloads.push(req.postData()); });
    await setup(page);
    await page.getByText('Create a project or restore a backup', { exact: true }).click();
    await page.getByLabel('Project name', { exact: true }).fill('Lagos test shop');
    await page.locator('#createProjectForm').getByLabel('Website URL', { exact: true }).fill('https://example.com/');
    await page.getByRole('button', { name: 'Create project', exact: true }).click();
    await expect(page.locator('#projectNameDisplay')).toHaveText('Lagos test shop');
    await page.getByRole('button', { name: 'Run audit', exact: true }).click();
    await expect(page.locator('#metricPages')).toHaveText('1');
    const tablePosition = await page.locator('#projectPagesRows').evaluate(node => {
      const wrap = node.closest('.asp-table-wrap');
      return { scrollLeft: wrap.scrollLeft, cellLeft: node.querySelector('td').getBoundingClientRect().left, wrapLeft: wrap.getBoundingClientRect().left, display: getComputedStyle(wrap).display, justify: getComputedStyle(wrap).justifyContent, tableMargin: getComputedStyle(node.closest('table')).marginLeft };
    });
    expect(tablePosition.scrollLeft).toBe(0);
    expect(tablePosition.cellLeft, JSON.stringify(tablePosition)).toBeGreaterThanOrEqual(tablePosition.wrapLeft);
    await expect(page.locator('#fixRows')).toContainText('Meta description');
    await page.locator('#fixRows select').first().selectOption('done');
    await expect(page.locator('#fixRows select').first()).toBeFocused();
    await expect(page.locator('#metricDone')).toHaveText('1');
    await expect(page.locator('#metricVerified')).toHaveText('0');
    await page.locator('#previousFile').setInputFiles({ name: 'previous.csv', mimeType: 'text/csv', buffer: csv(15) });
    await page.locator('#currentFile').setInputFiles({ name: 'current.csv', mimeType: 'text/csv', buffer: csv(10) });
    for (const [id, value] of Object.entries({ previousStart: '2026-07-01', previousEnd: '2026-07-28', currentStart: '2026-08-01', currentEnd: '2026-08-28', searchFilters: 'Web; Nigeria; all devices' })) await page.locator('#' + id).fill(value);
    await page.getByRole('button', { name: 'Compare exports locally' }).click();
    await expect(page.locator('#searchTotals')).toContainText('15 → 10');
    await expect(page.locator('#searchRows')).toContainText('Change -5');
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const accessibility = await page.evaluate(async () => window.axe.run('#seoProjects', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
    expect(accessibility.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    expect(payloads.every(data => !data.includes('Top pages') && !data.includes('Nigeria'))).toBeTruthy();
    await page.reload();
    await expect(page.locator('#metricDone')).toHaveText('1');
    await expect(page.locator('#searchTotals')).toContainText('15 → 10');
    const reportDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export progress report' }).click();
    const file = await reportDownload;
    expect(fs.readFileSync(await file.path(), 'utf8')).toContain('Search Console export comparison');
    await page.getByLabel('Page title', { exact: true }).fill('A better page title');
    await expect(page.locator('#serpPreview')).toContainText('A better page title');
    await page.getByLabel('Business name', { exact: true }).fill('Synthetic shop');
    await expect(page.locator('#schemaOutput')).toContainText('Synthetic shop');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect(errors).toEqual([]);
    await page.locator('#projectOverview').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`workspace-${width}.png`), fullPage: false });
  });
}
test('AC-6 real Pro gate locks signed-out workspace', async ({ page }) => {
  await setup(page, false);
  await expect(page.locator('#afro-pro-lock')).toBeVisible();
});
test('NFR-3 new workspace controls have no serious accessibility findings', async ({ page }) => {
  await setup(page);
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const results = await page.evaluate(async () => window.axe.run('#seoProjects', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
  expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
});
test('AC-4 backup download, delete and validated restore preserve the project', async ({ page }) => {
  await setup(page);
  await page.getByText('Create a project or restore a backup', { exact: true }).click();
  await page.locator('#newProjectName').fill('Backup fixture');
  await page.locator('#newProjectUrl').fill('https://example.com/');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  const backup = fs.readFileSync(await (await pending).path());
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete selected project' }).click();
  await expect(page.locator('#projectDashboard')).toBeHidden();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#restoreProjects').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backup });
  await expect(page.locator('#projectNameDisplay')).toHaveText('Backup fixture');
  await page.locator('#restoreProjects').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.locator('#projectStatus')).toContainText('not valid JSON');
  await expect(page.locator('#projectNameDisplay')).toHaveText('Backup fixture');
});

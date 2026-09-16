const fs = require('node:fs');
const {test, expect} = require('@playwright/test');
const pdfParse = require('pdf-parse');
const routes = ['/tools/cv-builder/', '/fr/tools/generateur-cv/', '/sw/zana/mjenzi-cv/'];
for (const route of routes) test('ATS PDF preserves accented text on ' + route, async ({page, baseURL}) => {
  await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.fulfill({status:204}));
  await page.goto(route);
  await page.waitForFunction(() => window.CVExportAtsPlainPdf);
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(() => window.CVExportAtsPlainPdf.exportAtsPdf('Élodie François Łukasz Đorđe Ŋɔ̃ Ḥasan\nCompétences — gestion de projets\nUjuzi wa mawasiliano'));
  const download = await downloadPromise;
  const parsed = await pdfParse(new Uint8Array(fs.readFileSync(await download.path())));
  expect(parsed.text).toContain('Élodie François');
  expect(parsed.text).toContain('Compétences — gestion de projets');
  expect(parsed.text).toContain('Ujuzi wa mawasiliano');
  const downloads = [];
  page.on('download', download => downloads.push(download));
  await page.evaluate(() => window.CVExportAtsPlainPdf.exportAtsPdf('名字'));
  await expect(page.locator('.cv-toast')).toContainText(route.startsWith('/fr') ? 'Exportez en DOCX ou TXT' : route.startsWith('/sw') ? 'Hamisha kama DOCX au TXT' : 'Export DOCX or TXT');
  expect(downloads).toHaveLength(0);
  for (const width of [320, 390]) {
    await page.setViewportSize({width, height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

const letterRoutes = ['/tools/cover-letter-generator/app.html', '/fr/tools/generateur-lettre-motivation/app.html', '/sw/zana/barua-ombi/'];
const letter = 'Élodie François Łukasz Đorđe Ŋɔ̃ Ḥasan\n\nMadame, Monsieur,\n\nJe vous présente ma candidature au poste de responsable de projet chez Exemple. Mes compétences en gestion, ma maîtrise des coûts et mon expérience répondent aux besoins de cette équipe.\n\nAsha Mwang’ombe — ujuzi wa mawasiliano na usimamizi wa miradi.\n\nCordialement,\nÉlodie François';
for (const route of letterRoutes) test('Embedded-font cover-letter exports on ' + route, async ({page, baseURL}) => {
  const requests = [];
  page.on('request', request => requests.push(request));
  await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.fulfill({status:204}));
  await page.goto(route);
  await page.locator('#letterText').fill(letter);
  await page.locator('#exportReviewConfirm').check();
  const pending = page.waitForEvent('download');
  await page.locator('[data-action=pdf]').first().click();
  const download = await pending;
  const parsed = await pdfParse(new Uint8Array(fs.readFileSync(await download.path())));
  expect(parsed.text.replace(/\s+/g, ' ').trim()).toBe(letter.replace(/\s+/g, ' ').trim());
  for (const format of ['txt', 'json', 'word']) {
    const next = page.waitForEvent('download');
    await page.locator('[data-action=' + format + ']').click();
    const result = await next;
    const contents = fs.readFileSync(await result.path(), 'utf8');
    expect(format === 'json' ? JSON.parse(contents).letterText : contents).toContain('Élodie François Łukasz Đorđe Ŋɔ̃ Ḥasan');
  }
  await page.locator('#letterText').fill(letter + '\n名字');
  await page.locator('#exportReviewConfirm').check();
  const unexpected = [];
  page.on('download', value => unexpected.push(value));
  await page.locator('[data-action=pdf]').first().click();
  await expect(page.locator('#toast')).toContainText(route.startsWith('/fr') ? 'Exportez en Word ou TXT' : route.startsWith('/sw') ? 'Hamisha kama Word au TXT' : 'Export Word or TXT');
  expect(unexpected).toHaveLength(0);
  expect(requests.every(request => !decodeURIComponent(request.url()).includes('Élodie') && !(request.postData() || '').includes('Élodie'))).toBe(true);
  for (const width of [320, 390]) {
    await page.setViewportSize({width, height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
test('font loading failure has a local fallback and retry succeeds', async ({page, baseURL}) => {
  await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.fulfill({status:204}));
  await page.route('**/NotoSans-*.ttf', request => request.fulfill({status:503}));
  await page.goto('/tools/cv-builder/');
  await page.waitForFunction(() => window.CVExportAtsPlainPdf);
  await page.evaluate(() => window.CVExportAtsPlainPdf.exportAtsPdf('Élodie François'));
  await expect(page.locator('.cv-toast')).toContainText('Try again or export DOCX or TXT');
  await page.unroute('**/NotoSans-*.ttf');
  const pending = page.waitForEvent('download');
  await page.evaluate(() => window.CVExportAtsPlainPdf.exportAtsPdf('Élodie François'));
  const parsed = await pdfParse(new Uint8Array(fs.readFileSync(await (await pending).path())));
  expect(parsed.text).toContain('Élodie François');
});
test('cover-letter edits during font loading require a fresh review', async ({page, baseURL}) => {
  await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.fulfill({status:204}));
  let resume;
  const held = new Promise(resolve => { resume = resolve; });
  await page.route('**/NotoSans-*.ttf', async request => { await held; await request.continue(); });
  await page.goto('/tools/cover-letter-generator/app.html');
  await page.locator('#letterText').fill(letter);
  await page.locator('#exportReviewConfirm').check();
  const fontRequest = page.waitForRequest('**/NotoSans-Regular.ttf');
  const downloads = [];
  page.on('download', value => downloads.push(value));
  await page.locator('[data-action=pdf]').first().click();
  await fontRequest;
  await page.locator('#letterText').fill(letter + '\nAdditional verified experience.');
  resume();
  await expect(page.locator('#toast')).toHaveText('Letter changed. Review the final preview again before export.');
  expect(downloads).toHaveLength(0);
});
for (const route of routes) test('native CV headings and stale export cancellation on ' + route, async ({page, baseURL}) => {
  await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.fulfill({status:204}));
  let resume;
  const held = new Promise(resolve => { resume = resolve; });
  await page.route('**/NotoSans-*.ttf', async request => { await held; await request.continue(); });
  await page.goto(route);
  await page.waitForFunction(() => window.CVExportUpgrade && window.CVExportUpgrade.buildAtsPlainText && window.CVApp);
  const fontRequest = page.waitForRequest('**/NotoSans-Regular.ttf');
  const downloads = [];
  page.on('download', value => downloads.push(value));
  await page.evaluate(() => { window.__pendingCareerExport = window.CVExportAtsPlainPdf.exportAtsPdf(); });
  await fontRequest;
  await page.evaluate(() => { window.CVApp.updateData('fn', 'Élodie'); window.CVApp.updateData('ln', 'François'); });
  resume();
  await page.evaluate(() => window.__pendingCareerExport);
  expect(downloads).toHaveLength(0);
  await expect(page.locator('.cv-toast')).toContainText(route.startsWith('/fr') ? 'Le CV a changé.' : route.startsWith('/sw') ? 'CV imebadilika.' : 'CV changed.');
  const expected = await page.evaluate(() => window.CVExportUpgrade.buildAtsPlainText());
  expect(expected.split('\n')).toContain(route.startsWith('/fr') ? 'Références' : route.startsWith('/sw') ? 'Wadhamini' : 'References');
  const pending = page.waitForEvent('download');
  await page.evaluate(() => window.CVExportAtsPlainPdf.exportAtsPdf());
  const result = await pending;
  const parsed = await pdfParse(new Uint8Array(fs.readFileSync(await result.path())));
  expect(parsed.text.replace(/\s+/g, ' ').trim()).toBe(expected.replace(/\s+/g, ' ').trim());
});
for (const route of routes) test('native guidance when PDF helper is unavailable on ' + route, async ({page, baseURL}) => {
  await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.fulfill({status:204}));
  await page.route('**/career-document-pdf.js', request => request.abort());
  await page.goto(route);
  await page.waitForFunction(() => window.CVExportAtsPlainPdf);
  await page.evaluate(() => window.CVExportAtsPlainPdf.exportAtsPdf('Élodie François'));
  await expect(page.locator('.cv-toast')).toContainText(route.startsWith('/fr') ? 'PDF indisponible. Exportez en DOCX ou TXT.' : route.startsWith('/sw') ? 'PDF haipatikani. Hamisha kama DOCX au TXT.' : 'PDF unavailable. Export DOCX or TXT.');
});

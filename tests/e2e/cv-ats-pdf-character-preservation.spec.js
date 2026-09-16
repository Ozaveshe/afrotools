const fs = require('node:fs');
const {test, expect} = require('@playwright/test');
const pdfParse = require('pdf-parse');
const routes = ['/tools/cv-builder/', '/fr/tools/generateur-cv/', '/sw/zana/mjenzi-cv/'];
for (const route of routes) test('ATS PDF preserves accented text on ' + route, async ({page, baseURL}) => {
  await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.fulfill({status:204}));
  await page.goto(route);
  await page.waitForFunction(() => window.CVExportAtsPlainPdf);
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(() => window.CVExportAtsPlainPdf.exportAtsPdf('Élodie François\nCompétences — gestion de projets\nUjuzi wa mawasiliano'));
  const download = await downloadPromise;
  const parsed = await pdfParse(new Uint8Array(fs.readFileSync(await download.path())));
  expect(parsed.text).toContain('Élodie François');
  expect(parsed.text).toContain('Compétences — gestion de projets');
  expect(parsed.text).toContain('Ujuzi wa mawasiliano');
  const downloads = [];
  page.on('download', download => downloads.push(download));
  await page.evaluate(() => window.CVExportAtsPlainPdf.exportAtsPdf('名字'));
  await expect(page.locator('body')).toContainText(route.startsWith('/fr') ? 'Exportez en DOCX ou TXT' : route.startsWith('/sw') ? 'Hamisha kama DOCX au TXT' : 'Export DOCX or TXT');
  expect(downloads).toHaveLength(0);
  for (const width of [320, 390]) {
    await page.setViewportSize({width, height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

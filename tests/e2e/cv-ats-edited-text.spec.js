const fs = require('node:fs');
const {test, expect} = require('@playwright/test');
const pdfParse = require('pdf-parse');
const routes = [
  {path:'/tools/cv-builder/', title:'ATS Plain Version', empty:'Add text before exporting.'},
  {path:'/fr/tools/generateur-cv/', title:'Version simple pour ATS', empty:'Ajoutez du texte avant l’exportation.'},
  {path:'/sw/zana/mjenzi-cv/', title:'Toleo rahisi la ATS', empty:'Ongeza maandishi kabla ya kuhamisha.'}
];
const edited = 'Élodie François Łukasz\n\nMON TEXTE FINAL — compétences vérifiées\nCe contenu a été modifié dans l’éditeur ATS.\nAsha Mwang’ombe — ujuzi wa mawasiliano.';
async function localOnly(page, baseURL) {
  await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.fulfill({status:204}));
}
for (const route of routes) test('edited ATS text drives keyboard TXT/PDF downloads: ' + route.path, async ({page, baseURL}) => {
  const sent = [];
  page.on('request', request => sent.push(request));
  await localOnly(page, baseURL);
  await page.goto(route.path);
  await page.waitForFunction(() => window.CVExportUpgrade && window.CVExportUpgrade.openAtsModal && window.CVAtsPlainMode);
  await page.evaluate(() => { window.CVApp.updateData('fn','Synthetic original'); window.CVExportUpgrade.openAtsModal(); });
  const dialog = page.getByRole('dialog', {name:route.title, exact:true});
  await expect(dialog).toBeVisible();
  const editor = dialog.locator('[data-export-ats-text]');
  await expect(editor).toHaveAccessibleName(/.+/);
  await editor.fill(edited);
  for (const format of ['txt', 'pdf']) {
    const pending = page.waitForEvent('download');
    const button = dialog.locator(format === 'txt' ? '[data-export-download-ats]' : '[data-export-download-ats-pdf]');
    await button.focus();
    await button.press('Enter');
    const bytes = fs.readFileSync(await (await pending).path());
    const text = format === 'txt' ? bytes.toString('utf8') : (await pdfParse(new Uint8Array(bytes))).text;
    expect(text.replace(/\s+/g,' ').trim()).toBe(edited.replace(/\s+/g,' ').trim());
    expect(text).not.toContain('Synthetic original');
  }
  expect(await page.evaluate(() => window.CVApp.getState().data.fn)).toBe('Synthetic original');
  expect(sent.every(request => !decodeURIComponent(request.url()).includes('Élodie') && !(request.postData() || '').includes('Élodie'))).toBe(true);
  const unexpected = [];
  page.on('download', value => unexpected.push(value));
  await editor.fill('');
  await dialog.locator('[data-export-download-ats]').click();
  await dialog.locator('[data-export-download-ats-pdf]').click();
  await expect(page.locator('body')).toContainText(route.empty);
  expect(unexpected).toHaveLength(0);
});
test('editing ATS textarea while fonts load cancels the old PDF', async ({page, baseURL}) => {
  await localOnly(page, baseURL);
  let resume;
  const held = new Promise(resolve => { resume = resolve; });
  await page.route('**/NotoSans-*.ttf', async request => { await held; await request.continue(); });
  await page.goto('/tools/cv-builder/');
  await page.waitForFunction(() => window.CVExportUpgrade && window.CVExportUpgrade.openAtsModal && window.CVAtsPlainMode);
  await page.evaluate(() => {
    window.CVExportUpgrade.openAtsModal();
    const original = window.CVExportAtsPlainPdf.exportAtsPdf;
    window.CVExportAtsPlainPdf.exportAtsPdf = text => (window.__editedPdfPending = original(text));
  });
  const editor = page.locator('[data-export-ats-text]');
  await editor.fill(edited);
  const downloads = [];
  page.on('download', value => downloads.push(value));
  const pending = page.waitForRequest('**/NotoSans-Regular.ttf');
  await page.locator('[data-export-download-ats-pdf]').click();
  await pending;
  await editor.fill(edited + '\nLatest edited evidence.');
  resume();
  await page.evaluate(() => window.__editedPdfPending);
  expect(downloads).toHaveLength(0);
  await expect(page.locator('body')).toContainText('CV changed. Review it and export again.');
});

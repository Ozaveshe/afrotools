const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.describe.configure({ timeout: 120000 });

async function open(page, baseURL) {
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin
    ? route.continue() : route.fulfill({ status: 204, body: '' }));
  await page.goto('/tools/cv-builder/');
  await page.waitForFunction(() => window.CVApplicationPack && window.CVJobTracker && window.CVExportAtsPlainPdf);
  await page.locator('[data-cv-entry="start"]').click();
  await page.evaluate(() => {
    Object.assign(CVApp.getState().data, { fn: 'Élodie Łukasz', title: 'Revenue', summary: 'Synthetic summary', email: 'fixture@example.test', skills: { h: 'Analysis' }, exps: [{ t: 'Revenue', c: 'Global Compact', d: 'Verified 20 % result.' }] });
    CVApp.renderAll();
  });
  await page.locator('[data-pack-role]').fill('Revenue');
  await page.locator('[data-pack-company]').fill('Global Compact');
}
async function download(page, locator) {
  const pending = page.waitForEvent('download');
  await locator.click();
  return fs.readFileSync(await (await pending).path());
}

test('English application pack save immediately refreshes list and CSV without resetting status', async ({ page, baseURL }) => {
  await open(page, baseURL);
  await page.locator('[data-pack-generate-all]').click();
  await page.locator('[data-pack-save]').click();
  await expect(page.locator('[data-job-card]')).toHaveCount(1);
  await expect(page.locator('[data-job-card]')).toContainText('Revenue');
  const id = await page.locator('[data-job-card]').getAttribute('data-job-card');
  let csv = (await download(page, page.locator('[data-tracker-export]'))).toString('utf8');
  expect(csv.includes('Revenue')).toBe(true);
  expect(csv.includes('"saved"')).toBe(true);
  await page.locator('[data-card-status]').selectOption('applied');
  await page.locator('[data-pack-text=coverLetter]').fill('Edited synthetic letter — Élodie Łukasz.');
  await page.locator('[data-pack-save]').click();
  await expect(page.locator('[data-job-card]')).toHaveCount(1);
  await expect(page.locator('[data-card-status]')).toHaveValue('applied');
  expect(await page.locator('[data-job-card]').getAttribute('data-job-card')).toBe(id);
  csv = (await download(page, page.locator('[data-tracker-export]'))).toString('utf8');
  expect(csv.includes('"applied"')).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('afro_cv_job_pipeline'))[0].applicationPack.coverLetter.includes('Élodie Łukasz'))).toBe(true);
  await page.locator('[data-card-edit]').click();
  await page.locator('[data-job-field=notes]').fill('Synthetic edited note');
  await page.locator('[data-tracker-form] button[type=submit]').click();
  expect(await page.evaluate(() => !!JSON.parse(localStorage.getItem('afro_cv_job_pipeline'))[0].applicationPack)).toBe(true);
  const stable = await page.evaluate(async () => {
    let count = 0;
    const observer = new MutationObserver(records => { count += records.length; });
    observer.observe(document.querySelector('.cv-toolbar-right'), { childList: true, subtree: true, characterData: true });
    await new Promise(resolve => setTimeout(resolve, 350)); observer.disconnect();
    return { count, labels: ['analyze', 'chat'].map(action => document.querySelector(`[data-action="${action}"]`).textContent) };
  });
  expect(stable.count).toBeLessThan(20);
  expect(stable.labels).toEqual(['Improve CV', 'Guidance']);
  await page.reload();
  await expect(page.locator('[data-job-card]')).toHaveCount(1);
  await expect(page.locator('[data-card-status]')).toHaveValue('applied');
});

test('English standalone pack guards empty exports and preserves Unicode in actual PDF bytes', async ({ page, baseURL }) => {
  await open(page, baseURL);
  const unexpected = [];
  page.on('download', value => unexpected.push(value));
  for (const format of ['txt', 'doc', 'pdf']) {
    await page.locator(`[data-pack-export=${format}]`).click();
    await expect(page.locator('[data-pack-status]')).toHaveText('Generate or write at least one asset before exporting.');
  }
  expect(unexpected).toHaveLength(0);
  const authored = 'Élodie François Łukasz Đorđe Ŋɔ̃ Ḥasan\nVerified synthetic letter — 20 %.';
  await page.locator('[data-pack-text=coverLetter]').fill(authored);
  const bytes = await download(page, page.locator('[data-pack-export=pdf]'));
  const parsed = (await pdfParse(new Uint8Array(bytes))).text;
  expect(parsed.includes(authored)).toBe(true);
  expect(parsed.includes('[object Promise]')).toBe(false);
  await page.locator('[data-pack-text=coverLetter]').fill('名字');
  const count = unexpected.length;
  await page.locator('[data-pack-export=pdf]').click();
  await expect(page.locator('[data-pack-status]')).toContainText('Export DOCX or TXT');
  expect(unexpected).toHaveLength(count);
  expect((await download(page, page.locator('[data-pack-export=txt]'))).toString('utf8').includes('名字')).toBe(true);
  const beforeZip = unexpected.length;
  await page.locator('[data-pack-download]').click();
  await expect(page.locator('.cv-toast')).toContainText('Export DOCX or TXT', { timeout: 45000 });
  expect(unexpected).toHaveLength(beforeZip);
  expect((await page.locator('.cv-toast').textContent()).includes('CAREER_PDF_')).toBe(false);
});

test('English standalone pack retries font failure and refuses edits during asynchronous PDF export', async ({ page, baseURL }) => {
  await open(page, baseURL);
  await page.locator('[data-pack-text=coverLetter]').fill('Élodie Łukasz — synthetic letter.');
  await page.route('**/NotoSans-*.ttf', route => route.fulfill({ status: 503, body: '' }));
  await page.locator('[data-pack-export=pdf]').click();
  await expect(page.locator('[data-pack-status]')).toContainText('Try again or export DOCX or TXT');
  await page.unroute('**/NotoSans-*.ttf');
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/NotoSans-*.ttf', async route => { await held; await route.continue(); });
  const pendingFont = page.waitForRequest('**/NotoSans-Regular.ttf');
  const unexpected = [];
  page.on('download', value => unexpected.push(value));
  await page.locator('[data-pack-export=pdf]').click();
  await pendingFont;
  await page.locator('[data-pack-text=coverLetter]').fill('Edited Élodie Łukasz — synthetic letter.');
  release();
  await expect(page.locator('[data-pack-status]')).toHaveText('Application pack changed. Review it and export again.');
  expect(unexpected).toHaveLength(0);
  const parsed = (await pdfParse(new Uint8Array(await download(page, page.locator('[data-pack-export=pdf]'))))).text;
  expect(parsed.includes('Edited Élodie Łukasz')).toBe(true);
});

test('English ZIP refuses mixed CV and pack revisions while fonts load', async ({ page, baseURL }) => {
  await open(page, baseURL);
  await page.locator('[data-pack-generate-all]').click();
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/NotoSans-*.ttf', async route => { await held; await route.continue(); });
  const pendingFont = page.waitForRequest('**/NotoSans-Regular.ttf');
  const unexpected = [];
  page.on('download', value => unexpected.push(value));
  await page.locator('[data-pack-download]').click();
  await pendingFont;
  await page.locator('[data-pack-text=coverLetter]').fill('Edited synthetic letter — Élodie Łukasz.');
  release();
  await expect(page.locator('.cv-toast')).toHaveText('CV or application pack changed. Review it and export again.');
  expect(unexpected).toHaveLength(0);
  const JSZip = require('jszip'), zip = await JSZip.loadAsync(await download(page, page.locator('[data-pack-download]')));
  const cover = Object.values(zip.files).find(file => /-cover-letter\.pdf$/.test(file.name));
  expect((await pdfParse(await cover.async('uint8array'))).text.includes('Edited synthetic letter — Élodie Łukasz.')).toBe(true);
});

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const JSZip = require('jszip');
const pdfParse = require('pdf-parse');
const { PDFDocument } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const countryCopy = require('../../data/localization/fr-cv-country-rules-copy.json');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.describe.configure({ timeout: 180000 });
const marker = 'CV_SYNTHETIC_PRIVATE_20261005';

test('French country guidance stays native on mobile and hides sensitive fields without changing their values', async ({ page, baseURL }) => {
  const signals = await open(page, baseURL);
  const before = await page.evaluate(() => {
    CVApp.updateData('idNumber', 'SYNTHETIC-ID-ONLY');
    CVApp.updateData('dob', '2000-01-02');
    const d = CVApp.getState().data;
    return JSON.stringify([d.fn, d.ln, d.title, d.summary, d.exps, d.idNumber, d.dob]);
  });
  const country = page.locator('.cv-country-sel').filter({ visible: true }).first();
  const panel = page.locator('.cv-country-advisor');
  async function expand() {
    const details = panel.locator('.cv-country-details');
    await expect(details).toBeAttached();
    if (!await details.evaluate(element => element.open)) await details.locator('summary').click();
  }
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const code of ['DZ', 'CM', 'NG', 'KE', 'ZA', 'INTL']) {
      await country.selectOption(code);
      await expect.poll(() => page.evaluate(() => CVApp.getState().country)).toBe(code);
      await expect(panel.locator('.cv-country-advisor-head')).toContainText(countryCopy.ui['Country Format Advisor']);
      await expect(panel.locator('summary')).toHaveText(countryCopy.ui['View country guidance and field controls']);
      await expand();
      const rule = await page.evaluate(id => ({ warning: CVCountryRules.get(id).warning,
        language: CVCountryRules.get(id).language }), code);
      expect(Object.values(countryCopy.displayValues.warning).includes(rule.warning)).toBe(true);
      expect(Object.values(countryCopy.displayValues.language).includes(rule.language)).toBe(true);
      await expect(panel.locator('.cv-country-warning')).toHaveText(rule.warning);
      await expect(panel.locator('.cv-country-advice-grid')).toContainText(rule.language);
      await expect(panel.locator('.cv-country-overrides')).toHaveAttribute('aria-label', countryCopy.ui['Manual country field overrides']);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
  }
  await country.selectOption('NG');await expand();
  await panel.locator('[data-country-override="photo"]').check();await expand();
  await expect(panel.locator('[data-country-safe]')).toHaveText('Masquer les champs sensibles');
  await panel.locator('[data-country-safe]').click();
  await expect.poll(() => page.evaluate(() => !CVApp.getState().data.showPhoto && !CVApp.getState().data.sp)).toBe(true);
  expect(await page.evaluate(value => {
    const d = CVApp.getState().data;
    return JSON.stringify([d.fn, d.ln, d.title, d.summary, d.exps, d.idNumber, d.dob]) === value;
  }, before)).toBe(true);
  expect(signals.errors).toHaveLength(0);expect(signals.leaks).toHaveLength(0);
});

async function open(page, baseURL) {
  const signals = { errors: [], leaks: [] };
  page.on('pageerror', () => signals.errors.push('pageerror'));
  page.on('console', message => { if (message.text().includes(marker)) signals.leaks.push('console'); });
  page.on('request', request => { if (request.url().includes(marker) || (request.postData() || '').includes(marker)) signals.leaks.push('request'); });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin
    ? route.continue() : route.fulfill({ status: 204, body: '' }));
  await page.goto('/fr/tools/generateur-cv/');
  await page.waitForFunction(() => window.CVApplicationPack && window.CVJobTracker && window.CVApplicationPackExport && window.CVExportAtsPlainPdf);
  await page.locator('[data-cv-entry="start"]').click();
  await page.evaluate(marker => {
    const state = CVApp.getState();
    state.country = 'GH'; state.template = 'global-compact';
    Object.assign(state.data, { fn: 'Élodie Łukasz', ln: 'Fixture', title: 'Revenue', summary: 'Global Compact\nYear 1 — ' + marker,
      email: 'fixture@example.test', phone: '0000000000', loc: 'Accra', skills: { h: 'Copy, Saved', s: 'Analyse', t: 'SQL' },
      exps: [{ t: 'Revenue', c: 'Global Compact', s: '2024-01', cur: true, d: 'Résultat vérifié de 20 % — ' + marker }],
      edus: [{ deg: 'Maîtrise', sch: 'École test', y1: '2020', y2: '2023', d: 'Étude synthétique.' }] });
    CVApp.renderAll();
  }, marker);
  await page.locator('[data-pack-role]').fill('Revenue');
  await page.locator('[data-pack-company]').fill('Global Compact');
  await page.locator('[data-pack-jd]').fill('qualité analyse coordination');
  return signals;
}
async function download(page, locator) {
  const pending = page.waitForEvent('download');
  await locator.click();
  return fs.readFileSync(await (await pending).path());
}
async function clean(page, signals) {
  expect(signals.errors).toEqual([]);
  expect(signals.leaks).toEqual([]);
  expect(await page.locator('.email-gate-modal:visible,[data-email-gate]:visible,.pro-gate:visible').count()).toBe(0);
}

test('French CV completion: native pack prose, stored enums, tracker CSV and mobile keyboard controls', async ({ page, baseURL }) => {
  const signals = await open(page, baseURL);
  const pack = page.locator('.cv-application-pack-panel');
  await expect(pack.locator('[data-pack-role]')).toHaveAccessibleName('Intitulé du poste visé');
  await expect(pack.locator('[data-pack-text=coverLetter]')).toHaveAccessibleName('Lettre de motivation');
  await expect(pack.locator('[data-pack-status]')).toHaveAttribute('role', 'status');
  const tones = await pack.locator('[data-pack-tone] option').evaluateAll(options => options.map(option => ({ value: option.value, label: option.textContent })));
  expect(tones.map(tone => tone.value)).toEqual(['formal', 'confident', 'graduate', 'executive', 'diaspora']);
  expect(tones.map(tone => tone.label)).toEqual(['Formel', 'Assuré', 'Début de carrière', 'Direction', 'Diaspora / international']);
  for (const tone of tones) {
    await pack.locator('[data-pack-tone]').selectOption(tone.value);
    await pack.locator('[data-pack-generate-all]').click();
    const values = await pack.locator('[data-pack-text]').evaluateAll(nodes => nodes.map(node => node.value));
    expect(values).toHaveLength(8);
    expect(values.every(value => !/Dear Hiring|I am applying|Kind regards|Subject:|I hope you|Thank you/.test(value))).toBe(true);
    expect(values[0].includes('Élodie Łukasz')).toBe(true);
    expect(values[0].includes('qualité')).toBe(true);
    expect(values[0].includes('Global Compact')).toBe(true);
    expect(values[3].includes('Year 1')).toBe(true);
  }
  await pack.locator('[data-pack-save]').click();
  await expect(page.locator('[data-job-card]')).toHaveCount(1);
  await expect(page.locator('[data-job-card]')).toContainText('Global Compact');
  const id = await page.locator('[data-job-card]').getAttribute('data-job-card');
  await page.locator('[data-card-status]').selectOption('applied');
  await pack.locator('[data-pack-save]').click();
  expect(await page.locator('[data-job-card]').getAttribute('data-job-card')).toBe(id);
  await expect(page.locator('[data-card-status]')).toHaveValue('applied');
  expect(await page.evaluate(() => {
    const lead = JSON.parse(localStorage.getItem('afro_cv_job_pipeline'))[0], saved = JSON.parse(localStorage.getItem('afro_cv_application_packs'))[0];
    return { status: lead.status, tone: saved.tone, role: lead.role, country: lead.country };
  })).toEqual({ status: 'applied', tone: 'diaspora', role: 'Revenue', country: 'GH' });
  await page.locator('[data-card-edit]').click();
  await expect(page.locator('[data-job-field=source]')).toHaveAccessibleName('Source');
  await expect(page.locator('#cv-job-source-list option[value="Company website"]')).toHaveText('Site de l’entreprise');
  await page.locator('[data-job-field=source]').fill('Company website');
  await page.locator('[data-job-field=notes]').fill('Global Compact, Revenue, Year 1');
  await page.locator('[data-tracker-form] button[type=submit]').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('afro_cv_job_pipeline'))[0].source)).toBe('Company website');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const first = pack.locator('[data-pack-tab=coverLetter]');
    await first.focus();
    await first.press('ArrowRight');
    await expect(pack.locator('[data-pack-tab=emailMessage]')).toBeFocused();
    await expect(pack.locator('[data-pack-tab=emailMessage]')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(pack.locator('[data-pack-tab=followupInterview]')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(first).toBeFocused();
    await expect(pack.locator('[data-pack-output=coverLetter]')).toHaveAttribute('role', 'tabpanel');
    const csv = (await download(page, page.locator('[data-tracker-export]'))).toString('utf8');
    expect(csv.split('\n')[0].startsWith('poste,entreprise,pays,')).toBe(true);
    expect(csv.includes('"Envoyée"')).toBe(true);
    expect(csv.includes('"Site de l’entreprise"')).toBe(true);
    expect(csv.includes('"oui","oui"')).toBe(true);
    expect(csv.includes('Global Compact, Revenue, Year 1')).toBe(true);
  }
  await clean(page, signals);
});

test('French CV completion: actual Unicode pack PDF DOC TXT ZIP and edited text remain native and local', async ({ page, baseURL }) => {
  const signals = await open(page, baseURL);
  const pack = page.locator('.cv-application-pack-panel');
  await pack.locator('[data-pack-tone]').selectOption('formal');
  await pack.locator('[data-pack-generate-all]').click();
  const authored = 'Lettre relue — Élodie Łukasz, Ŋɔ̃, Ḥasan.\nGlobal Compact / Revenue / Year 1 — ' + marker;
  const email = 'Objet : Courriel relu — Élodie Łukasz\nTexte rédigé — ' + marker;
  await pack.locator('[data-pack-text=coverLetter]').fill(authored);
  await pack.locator('[data-pack-tab=emailMessage]').click();
  await pack.locator('[data-pack-text=emailMessage]').fill(email);
  const text = (await download(page, pack.locator('[data-pack-export=txt]'))).toString('utf8');
  expect(text.includes('DOSSIER DE CANDIDATURE AFROTOOLS')).toBe(true);
  expect(text.includes('Ton : Formel')).toBe(true);
  expect(text.includes(authored)).toBe(true);
  expect(text.includes(email)).toBe(true);
  expect(text.includes('Subject:')).toBe(false);
  const doc = (await download(page, pack.locator('[data-pack-export=doc]'))).toString('utf8');
  expect(doc.includes(authored)).toBe(true);
  const pdf = (await pdfParse(new Uint8Array(await download(page, pack.locator('[data-pack-export=pdf]'))))).text;
  expect(pdf.includes(authored)).toBe(true);
  expect(pdf.includes(email)).toBe(true);
  const zip = await JSZip.loadAsync(await download(page, pack.locator('[data-pack-download]')));
  expect(Object.keys(zip.files)).toHaveLength(8);
  for (const file of Object.values(zip.files).filter(file => /\.pdf$/.test(file.name))) {
    const bytes = await file.async('uint8array');
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(0);
    if (/-cover-letter\.pdf$/.test(file.name)) expect((await pdfParse(bytes)).text.includes(authored)).toBe(true);
    if (/-ats-plain-cv\.pdf$/.test(file.name)) expect((await pdfParse(bytes)).text.includes('Élodie Łukasz')).toBe(true);
  }
  const entries = Object.values(zip.files);
  expect((await entries.find(file => /-application-email\.txt$/.test(file.name)).async('string')).includes(email)).toBe(true);
  expect((await entries.find(file => /-cover-letter\.txt$/.test(file.name)).async('string')).includes(authored)).toBe(true);
  const backup = JSON.parse(await entries.find(file => /-backup\.json$/.test(file.name)).async('string'));
  expect(backup.target.tone).toBe('formal');
  expect(backup.applicationPack.coverLetter === authored).toBe(true);
  const docx = await JSZip.loadAsync(await entries.find(file => /\.docx$/.test(file.name)).async('uint8array'));
  expect((await docx.file('word/document.xml').async('string')).includes('Élodie Łukasz')).toBe(true);
  await clean(page, signals);
});

test('French CV completion: empty pack and Unicode failure recover through native local text controls', async ({ page, baseURL }) => {
  const signals = await open(page, baseURL);
  const pack = page.locator('.cv-application-pack-panel'), unexpected = [];
  page.on('download', value => unexpected.push(value));
  for (const format of ['txt', 'doc', 'pdf']) {
    await pack.locator(`[data-pack-export=${format}]`).click();
    await expect(pack.locator('[data-pack-status]')).toHaveText('Générez ou rédigez au moins un document avant de l’exporter.');
  }
  expect(unexpected).toHaveLength(0);
  await pack.locator('[data-pack-text=coverLetter]').fill('名字 — ' + marker);
  await pack.locator('[data-pack-export=pdf]').click();
  await expect(pack.locator('[data-pack-status]')).toContainText('Exportez en DOCX ou TXT');
  expect(unexpected).toHaveLength(0);
  expect((await download(page, pack.locator('[data-pack-export=txt]'))).toString('utf8').includes('名字')).toBe(true);
  await pack.locator('[data-pack-text=coverLetter]').fill('Élodie Łukasz — document relu.');
  expect((await pdfParse(new Uint8Array(await download(page, pack.locator('[data-pack-export=pdf]'))))).text.includes('Élodie Łukasz')).toBe(true);
  await clean(page, signals);
});

test('French CV completion: native mobile DOCX import, invalid recovery and language choice preserve the draft', async ({ page, baseURL }) => {
  const signals = await open(page, baseURL);
  let parsers = 0;
  page.on('request', request => { if (request.url().includes('/mammoth/')) parsers++; });
  await page.setViewportSize({ width: 320, height: 844 });
  const pending = page.waitForEvent('download');
  await page.evaluate(() => CVDocxExport.exportDocx());
  const docx = fs.readFileSync(await (await pending).path());
  await page.evaluate(() => CVImportAssistant.open());
  await expect(page.locator('#cv-import-assistant-modal [role=dialog]')).toBeVisible();
  await expect(page.locator('#cv-import-title')).not.toHaveText('Review before anything changes');
  const before = await page.evaluate(() => JSON.stringify(CVApp.getState().data));
  await page.locator('[data-import-file]').setInputFiles({ name: 'synthetic.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: docx });
  await expect(page.locator('[data-import-text]')).toHaveValue(new RegExp(marker));
  expect(parsers).toBe(1);
  await page.locator('[data-import-parse]').click();
  await expect(page.locator('[data-import-review]')).toBeVisible();
  expect(await page.evaluate(before => JSON.stringify(CVApp.getState().data) === before, before)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#cv-import-assistant-modal')).not.toHaveClass(/open/);
  await page.evaluate(() => CVImportAssistant.open());
  await page.locator('[data-import-file]').setInputFiles({ name: 'invalid.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('invalid') });
  await expect(page.locator('[data-import-status]')).toContainText('Impossible de lire');
  expect(await page.evaluate(before => JSON.stringify(CVApp.getState().data) === before, before)).toBe(true);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  // The existing language selector belongs to the desktop toolbar context.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('.cv-lang-sel').selectOption('en');
  expect(await page.evaluate(() => t('summary'))).toBe('Professional Summary');
  await page.locator('.cv-lang-sel').selectOption('fr');
  expect(await page.evaluate(() => t('summary'))).toBe('Profil Professionnel');
  expect(await page.evaluate(before => JSON.stringify(CVApp.getState().data) === before, before)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await clean(page, signals);
});

for (let group = 0; group < 6; group++) test('French CV completion: all 30 templates export actual PDFs group ' + group, async ({ page, baseURL }) => {
  const signals = await open(page, baseURL);
  const ids = await page.evaluate(() => CVTemplateRegistry.all().map(row => row.id));
  expect(ids).toHaveLength(30);
  await page.evaluate(() => CVBuilderPolish.openExportPanel());
  for (const id of ids.slice(group * 5, group * 5 + 5)) {
    await page.evaluate(id => { CVApp.getState().template = id; CVApp.renderAll(); }, id);
    await page.locator('.cv-export-drawer-shell [data-cv-export-review]').check();
    const bytes = await download(page, page.locator('.cv-export-drawer-shell [data-cv-export=pdf]'));
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount(), id).toBeGreaterThan(0);
    expect(document.getPageCount(), id).toBeLessThanOrEqual(3);
    for (const pdfPage of document.getPages()) {
      expect(Math.abs(pdfPage.getWidth() - 595.28), id).toBeLessThan(1);
      expect(Math.abs(pdfPage.getHeight() - 841.89), id).toBeLessThan(1);
    }
    expect(await page.evaluate(() => document.querySelector('#cvpreview').textContent.includes('Élodie Łukasz')), id).toBe(true);
    const canvas = await page.evaluate(async () => {
      const canvas = await CVExportPdfQuality.renderPreviewCanvas({});
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let i = 0; i < data.length; i += 400) if (data[i] < 180 || data[i + 1] < 180 || data[i + 2] < 180) ink++;
      return { width: canvas.width, height: canvas.height, ink };
    });
    expect(canvas.width, id).toBeGreaterThanOrEqual(1190);
    // The raster crops to actual content; the enclosing parsed PDF is A4.
    expect(canvas.height, id).toBeGreaterThan(200);
    expect(canvas.ink, id).toBeGreaterThan(10);
  }
  await clean(page, signals);
});

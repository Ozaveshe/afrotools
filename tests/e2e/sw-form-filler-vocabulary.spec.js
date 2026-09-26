const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const { PDFDocument } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');

const route = '/sw/zana/kujaza-fomu-pdf/';
async function fixture(count) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([400, 500]);
  page.drawText('PUBLIC SYNTHETIC DOCUMENT', { x: 20, y: 470 });
  for (let i = 0; i < count; i++) {
    const field = pdf.getForm().createTextField(i === 0 ? 'Upload PDF' : 'Download PDF');
    field.addToPage(page, { x: 20, y: 410 - i * 50, width: 250, height: 25 });
  }
  return Buffer.from(await pdf.save());
}
async function load(page, count) {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.route('https://**/*', request => request.abort());
  await page.goto(route, { waitUntil: 'networkidle' });
  await expect(page.locator('#fileInput')).toHaveAttribute('aria-label', 'Chagua PDF yenye fomu');
  await expect(page.locator('#uploadZone')).toHaveAccessibleName('Chagua PDF yenye fomu');
  await expect(page.locator('.hero-badges')).toContainText('Kuunganisha thamani na ukurasa (hiari)');
  await page.locator('#uploadZone').focus();
  const chooser = page.waitForEvent('filechooser');
  await page.locator('#uploadZone').press('Enter');
  await (await chooser).setFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: await fixture(count) });
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#fieldCountBadge')).toHaveText('Sehemu ' + count);
  await expect(page.locator('.tip-item').first()).toHaveText('1. Pakia PDF yenye sehemu za fomu zinazojazwa');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function download(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#downloadBtn').click();
  return fs.readFileSync(await (await pending).path());
}

test('Swahili no-field PDF explains the unsupported form state with native count and help', async ({ page }, info) => {
  await load(page, 0);
  await expect(page.locator('#noFieldsMsg')).toContainText('Hakuna sehemu za fomu');
  await expect(page.locator('#downloadBtn')).toBeDisabled();
  await expect(page.locator('#downloadWrap')).toBeHidden();
  await expect(page.locator('#flattenRow')).toBeHidden();
  await expect(page.locator('.tips-grid')).not.toContainText('Pakia a PDF');
  await page.locator('#workspace').screenshot({ path: info.outputPath('sw-no-fields-320.png') });
});

for (const count of [1, 2]) test(`Swahili ${count}-field form retains source names and values through interactive and flattened exports`, async ({ page }, info) => {
  await load(page, count);
  await expect(page.locator('#flattenCheck')).toHaveAccessibleName('Unganisha thamani zilizojazwa na maudhui ya ukurasa');
  await expect(page.locator('.tip-item').nth(2)).toHaveText('3. Ukipenda, unganisha thamani zilizojazwa na maudhui ya ukurasa');
  await expect(page.locator('#pdf-form-field-0')).toHaveAccessibleName('Maandishi Upload PDF');
  await page.locator('#pdf-form-field-0').fill('Download PDF');
  if (count === 2) {
    await expect(page.locator('#pdf-form-field-1')).toHaveAccessibleName('Maandishi Download PDF');
    await page.locator('#pdf-form-field-1').fill('Upload PDF');
  }
  const interactive = await PDFDocument.load(await download(page));
  expect(interactive.getForm().getFields().map(field => field.getName())).toEqual(count === 1 ? ['Upload PDF'] : ['Upload PDF', 'Download PDF']);
  expect(interactive.getForm().getTextField('Upload PDF').getText()).toBe('Download PDF');
  if (count === 2) expect(interactive.getForm().getTextField('Download PDF').getText()).toBe('Upload PDF');
  await page.locator('#flattenCheck').check();
  const bytes = await download(page);
  const flattened = await PDFDocument.load(bytes);
  expect(flattened.getForm().getFields()).toHaveLength(0);
  expect(flattened.getPageCount()).toBe(1);
  const text = await page.evaluate(async bytes => {
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
    const text = (await (await pdf.getPage(1)).getTextContent()).items.map(item => item.str).join(' ');
    await pdf.destroy(); return text;
  }, [...bytes]);
  expect(text).toContain('PUBLIC SYNTHETIC DOCUMENT');
  expect(text).toContain('Download PDF');
  if (count === 2) expect(text).toContain('Upload PDF');
  expect(await page.locator('.pdg-overlay').count()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#workspace').screenshot({ path: info.outputPath(`sw-${count}-field-320.png`) });
});

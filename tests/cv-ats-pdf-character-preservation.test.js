const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const pdfParse = require('pdf-parse');
const source = fs.readFileSync('tools/cv-builder/js/cv-ats-plain-pdf-fix.js', 'utf8');
function exporter(lang) {
  const downloads = [], messages = [], events = [];
  const window = { CVExportUpgrade: {
    status: message => messages.push(message), toast: message => messages.push(message),
    downloadBlob: blob => downloads.push(blob), track: (...event) => events.push(event)
  }};
  vm.runInNewContext(source, {window, document: {readyState: 'complete', documentElement: {lang}}, Blob, Uint8Array, setTimeout: () => {}});
  return {api: window.CVExportAtsPlainPdf, downloads, messages, events};
}
for (const [locale, text] of Object.entries({
  en: 'Élodie François\nEXPERIENCE\nManaged £500 — improved costs by 20% (reviewed).',
  fr: 'Élodie François\nEXPÉRIENCE\nIngénieure à Niamey : œuvre, compétences, coût de 500 €.',
  sw: 'Élodie François\nUZOEFU\nMhandisi wa miradi — ujuzi wa usimamizi na mawasiliano.'
})) test(locale + ' ATS PDF preserves names and native text in parser output', async () => {
  const {api} = exporter(locale);
  const pdf = await pdfParse(api.buildPdf(text));
  for (const line of text.split('\n')) assert.ok(pdf.text.includes(line), 'Parsed PDF preserves the complete input line');
  assert.equal(pdf.numpages, 1);
});
test('decomposed accents normalize without losing the accented letter', async () => {
  const pdf = await pdfParse(exporter('fr').api.buildPdf('E\u0301lodie Franc\u0327ois'));
  assert.match(pdf.text, /Élodie François/);
});
for (const [locale, message] of Object.entries({en: /Export DOCX or TXT/, fr: /Exportez en DOCX ou TXT/, sw: /Hamisha kama DOCX au TXT/})) {
  test(locale + ' unsupported script prevents a corrupt download and offers local fallback', async () => {
    const fixture = exporter(locale);
    await fixture.api.exportAtsPdf('Synthetic CV\n名字');
    assert.equal(fixture.downloads.length, 0);
    assert.equal(fixture.events.length, 0);
    assert.match(fixture.messages.at(-1), message);
    assert.ok(fixture.messages.every(value => !value.includes('名字')));
  });
}
test('multipage PDF preserves late content and escaped punctuation', async () => {
  const input = Array.from({length: 120}, (_, i) => `Expérience ${i} : contrôle (qualité) \\ équipe`).join('\n');
  const fixture = exporter('fr');
  const pdf = await pdfParse(fixture.api.buildPdf(input));
  assert.ok(pdf.numpages >= 2);
  assert.ok(pdf.text.includes('Expérience 119 : contrôle (qualité) \\ équipe'));
  await fixture.api.exportAtsPdf('Élodie François');
  assert.equal(fixture.downloads.length, 1);
  assert.equal(fixture.events.length, 1);
});

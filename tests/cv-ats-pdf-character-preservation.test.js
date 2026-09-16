const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const pdfParse = require('pdf-parse');
const helper = require('../assets/js/pages/career-document-pdf');
const {jsPDF} = require('../assets/vendor/jspdf/jspdf.umd.min.js');
const fonts = ['Regular', 'Bold'].map(weight => fs.readFileSync('assets/fonts/noto-sans/NotoSans-' + weight + '.ttf').toString('base64'));
const source = fs.readFileSync('tools/cv-builder/js/cv-ats-plain-pdf-fix.js', 'utf8');
function exporter(lang) {
  const downloads = [], messages = [], events = [];
  const window = { CareerDocumentPdf: {message: helper.message, buildPdf: async text => new Uint8Array(helper.buildDocument(jsPDF, fonts, text, "cv").output("arraybuffer"))}, CVExportUpgrade: {
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
  const pdf = await pdfParse(await api.buildPdf(text));
  for (const line of text.split('\n')) assert.ok(pdf.text.includes(line), 'Parsed PDF preserves the complete input line');
  assert.equal(pdf.numpages, 1);
});
test('decomposed accents normalize without losing the accented letter', async () => {
  const pdf = await pdfParse(await exporter('fr').api.buildPdf('E\u0301lodie Franc\u0327ois'));
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
  const pdf = await pdfParse(await fixture.api.buildPdf(input));
  assert.ok(pdf.numpages >= 2);
  assert.ok(pdf.text.includes('Expérience 119 : contrôle (qualité) \\ équipe'));
  await fixture.api.exportAtsPdf('Élodie François');
  assert.equal(fixture.downloads.length, 1);
  assert.equal(fixture.events.length, 1);
});

test('embedded font sources match the recorded upstream bytes', () => {
  const crypto = require('node:crypto');
  const provenance = require('../assets/fonts/noto-sans/provenance.json');
  assert.equal(provenance.license, 'SIL Open Font License 1.1');
  for (const file of provenance.files) {
    const bytes = fs.readFileSync('assets/fonts/noto-sans/' + file.file);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), file.sha256);
    assert.ok(file.url.includes(provenance.commit));
  }
});
for (const kind of ['cv', 'cover-letter']) test(kind + ' preserves extended Latin and combining marks with measured long-word wrapping', async () => {
  const text = 'Élodie François Łukasz Đorđe Ŋɔ̃ Ḥasan\nCompétences — œuvre : coût 500 €\nAsha Mwang’ombe — ujuzi wa mawasiliano';
  const doc = helper.buildDocument(jsPDF, fonts, text, kind);
  const pdf = await pdfParse(new Uint8Array(doc.output('arraybuffer')));
  assert.ok(pdf.text.includes(text));
  const word = 'W'.repeat(200);
  const longPdf = await pdfParse(new Uint8Array(helper.buildDocument(jsPDF, fonts, word, kind).output('arraybuffer')));
  assert.equal(longPdf.text.replace(/\s/g, ''), word);
  assert.ok(longPdf.text.trim().split('\n').length > 1);
});
for (const [locale, headings] of Object.entries({en:['Summary','Experience','Education','Skills','Projects','Certifications','Languages','References'],fr:['Profil','Expérience professionnelle','Formation','Compétences','Projets','Certifications','Langues','Références'],sw:['Muhtasari','Uzoefu wa kazi','Elimu','Ujuzi','Miradi','Vyeti vya taaluma','Lugha','Wadhamini']})) {
  test(locale + ' CV builder localizes section labels without translating user content', async () => {
    const state = {data:{showProjs:true,showRefs:true,refs:[{n:'Synthetic referee',rel:'Former supervisor'}],fn:'Élodie',ln:'François',title:'References research',summary:'Synthetic profile',exps:[{t:'Engineer',c:'Example',s:'2020',cur:true,d:'Original evidence'}],edus:[{deg:'Degree',sch:'Example'}],skills:{h:'Analysis',s:'Communication',t:'Tools'},projs:[{n:'Project example',d:'Evidence'}],certs:[{n:'Certificate'}],langs:[{l:'Kiswahili',lv:'Fluent'}]}};
    const context = {window:{CVApp:{getState:()=>state}},document:{documentElement:{lang:locale},readyState:'loading',addEventListener(){}},setTimeout(){}};
    const owner = locale === 'fr' ? 'fr/tools/generateur-cv/js/cv-ats-plain-mode.js' : 'tools/cv-builder/js/cv-ats-plain-mode.js';
    vm.runInNewContext(fs.readFileSync(owner,'utf8'),context);
    const text = context.window.CVAtsPlainMode.buildText();
    for (const heading of headings) assert.ok(text.split('\n').includes(heading), heading);
    assert.ok(text.includes('References research'));
    assert.ok(text.includes('Élodie François'));
    const pdf = await pdfParse(new Uint8Array(helper.buildDocument(jsPDF,fonts,text,'cv').output('arraybuffer')));
    assert.equal(pdf.text.replace(/\s+/g,' ').trim(),text.replace(/\s+/g,' ').trim());
  });
}

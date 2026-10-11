'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const JSZip = require('jszip');

function runtime(locale, data) {
  const document = { readyState: 'loading', documentElement: { lang: locale }, addEventListener() {}, querySelector() { return null; } };
  const window = { document, CVTemplates: {}, CVApp: { esc: s => String(s || ''),
    getState: () => ({ data, country: 'INTL', template: 'ats-plain' }), fmtMonth: s => s } };
  const context = { window, document, CVApp: window.CVApp, Blob, Uint8Array, TextEncoder,
    fetch() { throw new Error('Unexpected network'); }, setTimeout() {} };
  vm.createContext(context);
  for (const name of ['cv-pdf-templates.js', 'cv-ats-plain-mode.js', 'cv-docx-export.js', 'cv-privacy-handoff.js', 'src/cv-application-pack.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../tools/cv-builder/js', name), 'utf8'), context);
  }
  return window;
}

for (const locale of ['en', 'fr', 'sw']) for (const populated of [false, true]) {
  test(locale + ' ' + (populated ? 'meaningful' : 'blank default') + ' rows survive local export correctly', async () => {
    const data = { fn: 'Synthetic', ln: 'Fixture', title: 'Synthetic role', summary: 'Authored summary',
      email: 'fixture@example.test', phoneCode: '+234', phone: populated ? '8000000000' : ' ',
      skills: populated ? { h: 'SQL' } : {}, exps: [], edus: [],
      certs: [{ n: populated ? 'Fixture certificate' : ' ' }], refs: [{ n: populated ? 'Fixture referee' : ' ' }],
      showRefs: true, langs: [{ l: populated ? 'Fixture language' : ' ', lv: 'Fluent' }], extras: {} };
    const before = JSON.stringify(data), w = runtime(locale, data);
    const text = w.CVAtsPlainMode.buildText(data);
    const blob = w.CVDocxExport.buildBlob();
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const xml = await zip.file('word/document.xml').async('string');
    const outputs = [text, xml, ...w.CVProductionTemplates.ids.map(id => w.CVTemplates[id](data, '#0062cc'))];
    for (const output of outputs) {
      assert.match(output, /Authored summary/);
      assert.equal(output.includes('+234'), populated);
      assert.equal(output.includes('Fixture language'), populated);
      if (!populated) assert.doesNotMatch(output, /Fluent/);
    }
    const handoff = w.CVPrivacyHandoff.buildPayload();
    assert.equal(handoff.phone, populated ? '+234 8000000000' : '');
    const pack = w.CVApplicationPack.generatePack(data, { role: 'Fixture role', company: 'Fixture company', tone: 'formal' });
    assert.equal(Object.keys(pack).length, 8);
    assert.ok(pack.coverLetter.endsWith(populated ? '+234 8000000000' : '[phone]'));
    assert.equal(JSON.stringify(data), before);
  });
}

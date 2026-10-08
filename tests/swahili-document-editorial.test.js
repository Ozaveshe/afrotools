const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const overrides = require('../data/localization/sw-document-pdf-lexicon-overrides.json').routes;
const lexicon = require('../data/localization/sw-document-pdf-lexicon.json').routes;
const { apps } = require('../scripts/build-swahili-document-pdf-parity.js');
const root = path.join(__dirname, '..');

test('contextual overrides survive the scoped generator and static page payload', () => {
  for (const [id, entries] of Object.entries(overrides)) {
    const app = apps.find((row) => row.id === id);
    assert.ok(app, `${id}: registered editorial route`);
    const html = fs.readFileSync(path.join(root, app.swahiliFile), 'utf8');
    const payload = JSON.parse(html.match(/id="sw-document-pdf-locale">([^<]+)/)[1]);
    assert.equal(payload.id, id);
    assert.deepEqual(payload.phraseOverrides, entries);
    const context = vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/pages/sw-document-pdf-localizer.js'), 'utf8'), context);
    const localizer = context.AfroTools.SwahiliDocumentPdfLocalizer;
    localizer.install({
      getElementById: () => ({ textContent: JSON.stringify(payload) }),
      readyState: 'loading',
      addEventListener() {}
    });
    for (const [phrase, translated] of Object.entries(entries)) {
      assert.equal(localizer.translate(phrase), translated, `${id}: runtime override for ${phrase}`);
      if (id === 'cv-builder' || id === 'invoice-generator') {
        assert.equal(lexicon[id][phrase], translated, `${id}: ${phrase}`);
      }
    }
    assert.doesNotMatch(html, /pdf-download-gate\.js|<email-gate-modal/);
  }
});

test('all 30 promoted CV template names and descriptions have contextual editorial ownership', () => {
  const context = vm.createContext({window: {}});
  for (const file of ['cv-template-registry', 'cv-template-registry-expanded', 'cv-template-registry-studio']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'tools/cv-builder/js', `${file}.js`), 'utf8'), context);
  }
  const templates = context.window.CVExpandedTemplateCatalog.all;
  assert.equal(templates.length, 30);
  for (const template of templates) {
    assert.ok(overrides['cv-builder'][template.description], `${template.id}: description owner`);
    assert.ok(overrides['cv-builder'][template.name] || lexicon['cv-builder'][template.name] !== template.name, `${template.id}: name owner`);
  }
  assert.doesNotMatch(overrides['cv-builder']['Choose from 30 premium CV templates'], /malipo/);
  assert.match(overrides['cv-builder']['Cross-market applications, simple recruiter review, and clean professional CVs.'], /Maombi ya kazi/);
});

test('scoped dictionaries preserve currencies and statutory identifiers', () => {
  const invoice = fs.readFileSync(path.join(root, 'sw/zana/kizalishaji-ankara/index.html'), 'utf8');
  for (const code of ['GHS', 'SDG', 'NGN', 'KES', 'TZS', 'UGX']) assert.match(invoice, new RegExp(`value="${code}"`));
  for (const [source, translated] of Object.entries(overrides['cv-builder'])) {
    for (const token of ['NYSC', 'NSS', 'HSE', 'M&E', 'QA']) {
      if (source.includes(token)) assert.ok(translated.includes(token), `${token} remains in ${source}`);
    }
  }
});

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { localizeSource, translateValue } = require('../scripts/build-french-cv-runtime');
const { localizeRouteOwnedRuntimeLiterals } = require('../scripts/build-french-document-pdf-parity');
const copy = require('../data/localization/fr-document-pdf-lexicon-overrides.json');
const root = path.resolve(__dirname, '..');

test('invoice labels retain currency identifiers and protect form-derived preview values', () => {
  const html = '<select id="currency"><option value="GHS">SGH - Ghana</option><option value="SDG">ODD - Soudan</option></select><div id="pCompany">Nom</div><tbody id="pItems"></tbody>';
  const output = localizeRouteOwnedRuntimeLiterals(html, { id: 'invoice-generator' });
  assert.match(output, /value="GHS">GHS - Ghana/);
  assert.match(output, /value="SDG">SDG - Soudan/);
  assert.match(output, /id="pCompany" translate="no"/);
  assert.match(output, /id="pItems" translate="no"/);
  assert.equal(copy.routes['invoice-generator']['Line Items'], 'Lignes de facture');
  const page = fs.readFileSync(path.join(root, 'fr/tools/generateur-factures/index.html'), 'utf8');
  const currencySelect = page.match(/<select\b[^>]*id="currency"[^>]*>([\s\S]*?)<\/select>/)[1];
  for (const option of currencySelect.matchAll(/<option\b[^>]*value="([A-Z]{3})"[^>]*>([^<]+)<\/option>/g)) {
    assert.match(option[2], new RegExp('^' + option[1] + '\\s*[-–—]'), option[1]);
  }
});

test('CV runtime localizes contextual copy while retaining object keys and template ids', () => {
  const input = 'var record = {"Global Compact": "Global Compact", id: "global-compact", country: "GH"};';
  const output = localizeSource(input, 'fixture.js').output;
  const context = vm.createContext({});
  vm.runInContext(output, context);
  assert.equal(context.record['Global Compact'], 'Compact international');
  assert.equal(context.record.id, 'global-compact');
  assert.equal(context.record.country, 'GH');
  assert.match(translateValue('<button>Use template</button>'), />Utiliser ce modèle</);
  assert.equal(translateValue(' export-ready templates. Use filters for role type, market, ATS safety, and application style.'), ' modèles prêts à l’exportation. Filtrez-les par type de poste, marché, compatibilité ATS et style de candidature.');
  const csv = localizeSource('var headers = ["job_title", "company", "status"]; var lead = {company: "Revenue", status: "saved"};', 'cv-job-tracker.js').output;
  const csvContext = vm.createContext({});
  vm.runInContext(csv, csvContext);
  assert.deepEqual(Array.from(csvContext.headers), ['poste', 'entreprise', 'statut']);
  assert.equal(csvContext.lead.company, 'Revenue');
  assert.equal(csvContext.lead.status, 'saved');
});

function catalog(prefix) {
  const context = vm.createContext({ CVTemplates: new Proxy({}, { get: () => () => '' }) });
  context.window = context;
  for (const file of ['cv-template-registry.js', 'cv-template-registry-studio.js', 'cv-template-registry-expanded.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, prefix, file), 'utf8'), context);
  }
  return JSON.parse(JSON.stringify(context.CVExpandedTemplateCatalog.all));
}

test('all 30 French template descriptions are localized with equivalent renderer and ATS behavior', () => {
  const en = catalog('tools/cv-builder/js');
  const fr = catalog('fr/tools/generateur-cv/js');
  assert.equal(en.length, 30);
  assert.equal(fr.length, en.length);
  const behavioralFields = ['id', 'rendererId', 'layoutType', 'printClass', 'countryFit', 'filters', 'atsSafety', 'atsFriendly', 'photoSupport', 'status', 'exportReady'];
  for (let index = 0; index < en.length; index += 1) {
    for (const field of behavioralFields) assert.deepEqual(fr[index][field], en[index][field], `${en[index].id}: ${field}`);
    assert.equal(fr[index].name, copy.routes['cv-builder'][en[index].name], en[index].id + ': name');
    assert.equal(fr[index].bestFor, copy.routes['cv-builder'][en[index].bestFor], en[index].id + ': bestFor');
    assert.doesNotMatch(fr[index].name + ' ' + fr[index].bestFor, /Pacte mondial|sécurisé ATS/);
  }
});

test('CV exports keep label-like user text literal instead of rewriting Blob parts', () => {
  function NativeBlob(parts) { this.parts = parts; }
  const context = { Blob: NativeBlob, __AFROTOOLS_FR_DOCUMENT_PDF__: { id: 'cv-builder' } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/pages/fr-document-pdf-export-localization.js'), 'utf8'), { window: context });
  assert.equal(context.Blob, NativeBlob);
  assert.deepEqual(new context.Blob(['Revenue\nYear 1\nGlobal Compact']).parts, ['Revenue\nYear 1\nGlobal Compact']);
});

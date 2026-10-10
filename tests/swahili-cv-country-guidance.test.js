const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const owner = require('../data/localization/sw-document-pdf-lexicon-overrides.json');
const { ROUTE_OVERRIDES, normalizeTranslation } = require('../scripts/build-swahili-document-pdf-lexicon');
const copy = owner.routes['cv-builder'];
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = { window: {}, document: { readyState: 'loading', addEventListener() {} },
  COUNTRY_NORMS: {}, PHONE_CODES: [], setTimeout() {} };
vm.runInNewContext(read('tools/cv-builder/js/cv-country-rules.js'), context);
const rules = context.window.CVCountryRules;

function localizer() {
  const state = { data: { fn: 'Other African', title: 'State of origin', summary: 'References' } };
  const ctx = { module: { exports: {} }, CVApp: { getState: () => state } };
  vm.runInNewContext(read('assets/js/pages/sw-document-pdf-localizer.js'), ctx);
  const api = ctx.module.exports;
  api.install({ readyState: 'loading', addEventListener() {}, getElementById: () => ({
    textContent: JSON.stringify({ id: 'cv-builder', phraseOverrides: copy })
  }) });
  return { api, state };
}

test('every effective country profile has complete route-owned Swahili guidance including semicolon sentences', () => {
  const { api } = localizer();
  const seen = new Set();
  assert.equal(Object.keys(rules.rules).length, 56);
  for (const [id, row] of Object.entries(rules.rules)) {
    for (const field of ['length', 'originLabel', 'references', 'language', 'term', 'notes', 'warning']) {
      const source = row[field];
      if (source === 'CV') continue;
      assert.ok(Object.hasOwn(copy, source), `${id}/${field}: missing complete phrase`);
      assert.equal(ROUTE_OVERRIDES['cv-builder'][source], copy[source]);
      assert.equal(normalizeTranslation(copy[source]), copy[source], `${id}/${field}: normalizer changes meaning`);
      assert.equal(api.translate(source), copy[source]);
      if (source !== 'Resume / CV') assert.notEqual(copy[source], source);
      seen.add(source);
    }
  }
  assert.ok([...seen].filter(text => text.includes(';')).length >= 39);
});

test('country privacy qualifications, educational acronyms and hiding language survive translation', () => {
  const { api } = localizer();
  assert.match(api.translate(rules.get('NG').warning), /^Usiongeze NIN.*pasipoti.*benki/);
  assert.match(api.translate(rules.get('NG').notes), /LGA.*NYSC.*hiari/);
  assert.match(api.translate(rules.get('KE').notes), /KCSE\/KCPE.*isipokuwa.*waziwazi/);
  assert.match(api.translate(rules.get('ZA').warning), /umri.*hali ya ndoa.*jinsia.*rangi.*picha.*namba.*sheria/);
  assert.match(api.translate(rules.get('INTL').warning), /Mahitaji hutofautiana.*maelekezo ya tangazo.*zisizohusiana na kazi/);
  assert.equal(api.translate('State of origin'), 'Jimbo la asili');
  assert.equal(api.translate('Other African'), 'Nchi nyingine ya Afrika');
  assert.equal(api.translate('Hide risky fields'), 'Ficha sehemu za taarifa nyeti');
  assert.doesNotMatch(api.translate(rules.get('EG').notes), /ndani ya kifaa/);
  assert.match(api.translate(rules.get('EG').notes), /waajiri wa eneo husika/);
  assert.deepEqual(owner.countryGuidanceReview, { status: 'editorial-draft', nativeEditor: null,
    independentReviewer: null, countryFactReview: 'pending' });
});

test('hydrated country labels and accessible controls have exact copy without changing CV authored values', () => {
  const { api, state } = localizer();
  const before = JSON.stringify(state);
  const fields = ['Country Format Advisor', 'View country guidance and field controls',
    'Manual country field overrides', 'Include photo in this CV', 'Show personal detail fields',
    'Show state / region of origin field', 'Show national ID field', 'Hide risky fields',
    ...Object.values(rules.fieldLabels)];
  for (const source of fields) {
    assert.ok(Object.hasOwn(copy, source), source);
    assert.equal(api.translate(source), copy[source]);
    assert.notEqual(copy[source], source);
  }
  for (const value of Object.values(state.data)) assert.equal(api.isCvUserText(value), true);
  assert.equal(JSON.stringify(state), before);
  // The localization dictionary owns display phrases only, never these keys.
  for (const key of ['common', 'optional', 'discouraged', 'avoid', 'requested', 'showPhoto',
    'nationalId', 'afro_cv_country_field_overrides', 'data-country-safe', 'data-country-override']) {
    assert.equal(Object.hasOwn(copy, key), false, key);
  }
});

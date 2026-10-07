'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const acorn = require('acorn');
const { localizeSource, localizeCountryAdvice } = require('../scripts/build-french-cv-runtime');
const copy = require('../data/localization/fr-cv-country-rules-copy.json');
const root = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(root, 'tools/cv-builder/js', filename), 'utf8');
const source = read('cv-country-rules.js');
const localized = () => localizeSource(source, 'cv-country-rules.js').output;
const plain = value => JSON.parse(JSON.stringify(value));
const displayKeys = Object.keys(copy.displayValues).concat('name');

// This is a Node adapter for the module's data and event contracts. It makes
// no browser, keyboard, layout, deployment or factual-country claim.
function loadRules(script) {
  const handlers = {};
  const controls = ['photo', 'personal', 'origin', 'nationalId'].map(key => ({
    dataset: { countryOverride: key }, checked: false,
    addEventListener(type, handler) { handlers[key] = handler.bind(this); }
  }));
  const safe = { addEventListener(type, handler) { handlers.safe = handler; } };
  const panel = {
    innerHTML: '',
    querySelectorAll() { return controls; },
    querySelector() { return safe; }
  };
  const storage = new Map();
  const state = { country: 'NG', data: {
    name: 'Nationality', summary: 'Photo', nationalId: 'synthetic-id',
    nationality: 'Other African', origin: 'State of origin',
    showPhoto: true, sp: true
  } };
  const events = {};
  const updates = [];
  const toasts = [];
  const context = {
    COUNTRY_NORMS: {}, PHONE_CODES: [],
    document: {
      readyState: 'loading',
      addEventListener(type, handler) { events[type] = handler; },
      querySelector(selector) { return selector === '.cv-country-advisor' ? panel : {}; }
    },
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { storage.set(key, value); }
    },
    setTimeout() {},
    CVApp: {
      getState() { return state; },
      esc(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
      updateData(key, value) { updates.push([key, value]); state.data[key] = value; },
      renderEditor() {}, renderPreview() {},
      showToast(value) { toasts.push(value); }
    }
  };
  context.window = context;
  vm.runInNewContext(script, context);
  return { context, rules: context.CVCountryRules, state, storage, panel, controls, handlers, events, updates, toasts };
}

test('country-copy review is explicitly pending and covers 54 countries plus both fallbacks', () => {
  assert.equal(copy.schemaVersion, 1);
  assert.equal(copy.locale, 'fr');
  assert.equal(copy.review.nativeHuman, 'pending');
  assert.equal(copy.review.countryFacts, 'not-reviewed');
  assert.equal(Object.keys(copy.profiles).filter(code => /^[A-Z]{2}$/.test(code)).length, 54);
  assert.equal(Object.keys(copy.profiles).length, 56);
  assert.ok(copy.profiles.INTL && copy.profiles.OTHER);
});

test('every effective profile has maintained native display copy and unchanged policy values', () => {
  const english = loadRules(source).rules.rules;
  const french = loadRules(localized()).rules.rules;
  assert.deepEqual(Object.keys(french).sort(), Object.keys(english).sort());
  for (const code of Object.keys(english)) {
    assert.equal(french[code].name, copy.profiles[code][1], code);
    for (const key of Object.keys(copy.displayValues)) {
      assert.equal(french[code][key], copy.displayValues[key][english[code][key]], `${code}.${key}`);
    }
    const policies = rule => Object.fromEntries(Object.entries(plain(rule)).filter(([key]) => !displayKeys.includes(key)));
    assert.deepEqual(policies(french[code]), policies(english[code]), code);
  }
  assert.equal(french.KE.nationalId, 'requested');
  assert.equal(french.NG.nationalId, 'avoid');
  assert.equal(french.ZA.photo, 'discouraged');
  assert.deepEqual(plain(french.NG.templates), ['lagos', 'abuja', 'panaf']);
});

test('country hydration supplies native names, help, origin labels and phone suggestions', () => {
  const french = loadRules(localized());
  const english = loadRules(source);
  for (const code of Object.keys(copy.profiles)) {
    french.context.COUNTRY_NORMS[code].custom = 'Photo';
  }
  french.rules.applyRules();
  for (const code of Object.keys(copy.profiles)) {
    const norm = french.context.COUNTRY_NORMS[code];
    const rule = french.rules.rules[code];
    assert.equal(norm.n, rule.name, code);
    assert.equal(norm.h, rule.notes, code);
    assert.equal(norm.soL, rule.originLabel, code);
    assert.equal(norm.custom, 'Photo');
    const phone = french.context.PHONE_CODES.find(entry => entry.country === code);
    assert.equal(phone.label, rule.dial + ' ' + rule.name);
    assert.equal(phone.code, english.rules.rules[code].dial);
    for (const key of ['f', 'photo', 'dob', 'mar', 'gen', 'nat', 'so', 'idField', 'dlField', 'milField', 'relField']) {
      assert.equal(norm[key], english.context.COUNTRY_NORMS[code][key], `${code}.${key}`);
    }
  }
});

test('all hydrated warnings and dynamic field controls use native presentation', () => {
  const french = loadRules(localized());
  for (const code of Object.keys(copy.profiles)) {
    french.state.country = code;
    french.rules.renderAdvisor();
    const rule = french.rules.rules[code];
    for (const key of ['name', 'length', 'references', 'language', 'notes', 'warning']) {
      assert.ok(french.panel.innerHTML.includes(french.context.CVApp.esc(rule[key])), `${code}.${key}`);
    }
    for (const label of ['Conseils de présentation selon le pays', 'Numéro d’identité nationale',
      'Masquer les champs sensibles', 'Les champs sensibles restent facultatifs.',
      'aria-label="Options des champs selon le pays"']) {
      assert.ok(french.panel.innerHTML.includes(label));
    }
    assert.doesNotMatch(french.panel.innerHTML, /Country Format Advisor|Hide risky fields|Only if requested|Changing country updates/);
  }
  assert.deepEqual(plain(french.rules.fieldLabels), {
    common: 'Souvent inclus', optional: 'Facultatif', discouraged: 'Déconseillé', avoid: 'À éviter', requested: 'Seulement sur demande'
  });
  assert.match(french.rules.rules.NG.warning, /NIN.*passeport.*bancaires/);
  assert.match(french.rules.rules.ZA.warning, /demande légale.*procédure légitime/);
  assert.match(french.rules.rules.INTL.warning, /sauf demande légale/);
});

test('actual override and hide handlers preserve authored values and canonical storage keys', () => {
  function exercise(script) {
    const runtime = loadRules(script);
    const authored = Object.fromEntries(Object.entries(runtime.state.data).filter(([key]) => !['showPhoto', 'sp'].includes(key)));
    runtime.rules.renderAdvisor();
    for (const control of runtime.controls) {
      control.checked = true;
      runtime.handlers[control.dataset.countryOverride]();
    }
    runtime.handlers.safe();
    assert.deepEqual(Object.fromEntries(Object.entries(runtime.state.data).filter(([key]) => !['showPhoto', 'sp'].includes(key))), authored);
    assert.equal(runtime.state.data.showPhoto, false);
    assert.equal(runtime.state.data.sp, false);
    assert.deepEqual(JSON.parse(runtime.storage.get('afro_cv_country_field_overrides')), {
      NG: { photo: false, personal: false, origin: false, nationalId: false }
    });
    return { updates: runtime.updates, storage: Array.from(runtime.storage), norm: plain(runtime.context.COUNTRY_NORMS.NG) };
  }
  const english = exercise(source);
  const french = exercise(localized());
  assert.deepEqual(french.updates, english.updates);
  assert.deepEqual(french.storage, english.storage);
  for (const key of ['n', 'h', 'soL']) { delete english.norm[key]; delete french.norm[key]; }
  assert.deepEqual(french.norm, english.norm);
});

test('country-change notifications retain policy behavior and use native privacy advice', () => {
  const french = loadRules(localized());
  // Initialization is scheduled rather than run by the adapter above. Use a
  // fresh adapter that queues and drains the module's actual setup callback.
  const queued = [];
  french.context.setTimeout = callback => queued.push(callback);
  french.events.DOMContentLoaded();
  queued.shift()();
  const change = value => french.events.change({ target: { value, classList: { contains: () => true } } });
  change('ZA');
  assert.equal(french.toasts[0], copy.ui['South Africa guidance: avoid unnecessary demographic information unless lawfully requested.']);
  change('INTL');
  assert.deepEqual(french.updates.slice(-2), [['showPhoto', false], ['sp', false]]);
  assert.equal(french.rules.get('unrecognized').code, 'OTHER');
});

test('compact advisor inserts the native summary without changing its controls or observer contract', () => {
  const created = [];
  const head = {};
  const content = {};
  const panel = {
    children: [head, content],
    classList: { add(value) { this.value = value; } },
    querySelector(selector) { return selector === '.cv-country-advisor-head' ? head : null; },
    appendChild(value) { created.push(value); }
  };
  let ready;
  const observed = [];
  const context = {
    document: {
      readyState: 'loading', body: {}, querySelector() { return panel; },
      addEventListener(type, handler) { ready = handler; },
      createElement(tag) { return { tag, children: [], appendChild(value) { this.children.push(value); } }; }
    },
    MutationObserver: function () { this.observe = (target, options) => observed.push(plain(options)); }
  };
  vm.runInNewContext(localizeSource(read('cv-country-advisor-compact.js'), 'cv-country-advisor-compact.js').output, context);
  ready();
  assert.equal(created[0].className, 'cv-country-details');
  assert.equal(created[0].children[0].tag, 'summary');
  assert.equal(created[0].children[0].textContent, copy.ui['View country guidance and field controls']);
  assert.equal(created[0].children[1].children[0], content);
  assert.deepEqual(observed, [{ childList: true, subtree: true }]);
});

test('compilation fails closed on source drift, missing profiles and missing native privacy or policy copy', () => {
  assert.throws(() => localizeSource(source.replace('National ID is sensitive.', 'National ID needs review.'), 'cv-country-rules.js'), /fingerprint changed/);
  assert.throws(() => localizeSource(read('cv-country-advisor-compact.js') + ' ', 'cv-country-advisor-compact.js'), /fingerprint changed/);
  for (const remove of [
    draft => delete draft.profiles.KE,
    draft => delete draft.displayValues.warning['National ID is sensitive. Share it only through a trusted employer process.'],
    draft => delete draft.displayValues.warning,
    draft => delete draft.ui['Only if requested'],
    draft => delete draft.ui['Hide risky fields'],
    draft => { draft.displayValues.language['French is commonly used.'] = ''; }
  ]) {
    const draft = plain(copy);
    remove(draft);
    assert.throws(() => localizeCountryAdvice(source, 'cv-country-rules.js', draft), /missing|incomplete/);
  }
  assert.equal(localizeCountryAdvice(source.replace(/\r?\n/g, '\r\n'), 'cv-country-rules.js').output.replace(/\r\n/g, '\n'), localized().replace(/\r\n/g, '\n'));
});

test('the localized AST changes only maintained presentation literals, retaining every identifier and control expression', () => {
  const pairs = new Map(Object.values(copy.profiles).map(([english, french]) => [english, french]));
  for (const table of [copy.ui, ...Object.values(copy.displayValues)]) {
    Object.entries(table).forEach(([english, french]) => pairs.set(english, french));
  }
  function compare(english, french) {
    if (english == null || typeof english !== 'object') { assert.equal(french, english); return; }
    assert.equal(french.type, english.type);
    if (english.type === 'Literal' && typeof english.value === 'string' && english.value !== french.value) {
      const expected = pairs.get(english.value) || english.value.replace(/>([^<>]+)</g, (match, text) => `>${pairs.get(text) || text}<`)
        .replace(/\b(aria-label)=("|')([^"']*)\2/g, (match, key, quote, value) => `${key}=${quote}${pairs.get(value) || value}${quote}`);
      assert.equal(french.value, expected);
      return;
    }
    for (const key of Object.keys(english).filter(key => !['start', 'end', 'raw'].includes(key))) {
      if (Array.isArray(english[key])) {
        assert.equal(french[key].length, english[key].length);
        english[key].forEach((node, index) => compare(node, french[key][index]));
      } else compare(english[key], french[key]);
    }
  }
  for (const filename of ['cv-country-rules.js', 'cv-country-advisor-compact.js']) {
    const original = read(filename);
    compare(acorn.parse(original, { ecmaVersion: 'latest' }), acorn.parse(localizeSource(original, filename).output, { ecmaVersion: 'latest' }));
  }
});

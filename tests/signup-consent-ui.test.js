'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}
function scripts(html) {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(text => text.trim());
}
function declaration(source, name) {
  const nodes = [];
  walk(acorn.parse(source, { ecmaVersion: 'latest' }), node => { if (node.type === 'FunctionDeclaration' && node.id.name === name) nodes.push(node); });
  assert.equal(nodes.length, 1, 'one actual owner function ' + name);
  return source.slice(nodes[0].start, nodes[0].end);
}
function htmlDeclaration(html, name) {
  const candidates = scripts(html).filter(source => source.includes('function ' + name + '('));
  assert.equal(candidates.length, 1);
  return declaration(candidates[0], name);
}
const plain = value => JSON.parse(JSON.stringify(value));
const control = value => ({ value: value || '', checked: false, disabled: false, dataset: {}, style: {}, classList: { add() {}, remove() {} }, addEventListener(type, handler) { this[type] = handler; } });

test('auth choices are optional/unchecked in native HTML and remain available without JavaScript', () => {
  const html = read('auth/index.html');
  for (const [id, name] of [['signupEmailDigest', 'email_digest_enabled'], ['signupEmailWeekly', 'email_weekly_enabled']]) {
    const tag = html.match(new RegExp('<input\\b[^>]*id="' + id + '"[^>]*>'));
    assert(tag);
    assert.match(tag[0], /type="checkbox"/);
    assert.match(tag[0], /value="true"/);
    assert.match(tag[0], new RegExp('name="' + name + '"'));
    assert.doesNotMatch(tag[0], /\b(?:checked|required|disabled)(?:\s|=|>)/);
  }
  assert.match(html, /Weekly emails require optional email updates/);
  assert.match(html, /<noscript><style>#signupForm\[hidden\]\{display:grid!important/,
    'the real no-JavaScript signup form must be visible, not just have valid controls');
});

test('auth dependency and actual submit callback send only explicit checkbox states', async () => {
  const html = read('auth/index.html'), source = scripts(html).find(text => text.includes("getElementById('signupForm').addEventListener('submit'"));
  const callbacks = [];
  walk(acorn.parse(source, { ecmaVersion: 'latest' }), node => {
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.property.name === 'addEventListener' && node.arguments[0].value === 'submit' && node.callee.object.type === 'CallExpression' && node.callee.object.arguments[0].value === 'signupForm') callbacks.push(node.arguments[1]);
  });
  assert.equal(callbacks.length, 1);
  const nodes = { signupName: control('Owned UI'), signupEmail: control('owned@example.invalid'), signupPassword: control('synthetic-password'), signupCountry: control('NG') };
  const digest = control(), weekly = control(), calls = [];
  const context = vm.createContext({ signupDigest: digest, signupWeekly: weekly,
    document: { getElementById: id => nodes[id] },
    getSignupCountry: () => ({ name: 'Nigeria', code: 'NG' }), setStatus() {},
    window: { AfroAuth: {} }, AfroAuth: { signup: async (...args) => { calls.push(args); return { ok: false, error: 'Owned signup withheld' }; } },
  });
  vm.runInContext(htmlDeclaration(html, 'syncSignupEmailChoices') + ';globalThis.callback=(' + source.slice(callbacks[0].start, callbacks[0].end) + ');', context);
  for (const enabled of [false, true]) {
    digest.checked = enabled;
    context.syncSignupEmailChoices();
    assert.equal(weekly.disabled, !enabled);
    weekly.checked = enabled;
    await context.callback({ preventDefault() {} });
    assert.deepEqual(plain(calls.at(-1)[4]), { email_digest_enabled: enabled, email_weekly_enabled: enabled });
  }
  digest.checked = false;
  context.syncSignupEmailChoices();
  assert.equal(weekly.checked, false);
});

test('modal actual render, dependency listener and submit callback retain explicit off/on choices', async () => {
  const source = read('assets/js/components/auth-modal.js'), nodes = {};
  for (const id of ['amName', 'amEmail', 'amPassword', 'amCountry', 'amSubmit', 'amError', 'amEmailDigest', 'amEmailWeekly']) nodes[id] = control();
  Object.assign(nodes.amName, { value: 'Owned modal' }); Object.assign(nodes.amEmail, { value: 'owned@example.invalid' }); Object.assign(nodes.amPassword, { value: 'synthetic-password' });
  const wrap = { innerHTML: '' }, calls = [];
  const overlay = { querySelector: selector => selector === '.am-card-wrap' ? wrap : nodes[selector.slice(1)] || null, querySelectorAll: () => [], appendChild() {} };
  const context = vm.createContext({ a: overlay, n: 'signup', o() {}, d() {}, s() {}, l() {}, t: null,
    document: { createElement: () => wrap }, AFRICAN_COUNTRIES: [], setTimeout() {},
    AfroAuth: { signup: async (...args) => { calls.push(args); return { ok: false, error: 'Owned signup withheld' }; } },
  });
  vm.runInContext(declaration(source, 'r') + ';' + declaration(source, 'i'), context);
  context.r();
  assert.match(wrap.innerHTML, /<legend>Optional emails<\/legend>/);
  assert.doesNotMatch(wrap.innerHTML.match(/<input[^>]*id="amEmailDigest"[^>]*>/)[0], /\bchecked\b/);
  assert.match(wrap.innerHTML.match(/<input[^>]*id="amEmailWeekly"[^>]*>/)[0], /\bdisabled\b/);
  assert.equal(typeof nodes.amEmailDigest.change, 'function');
  await context.i();
  assert.deepEqual(plain(calls.at(-1)[4]), { email_digest_enabled: false, email_weekly_enabled: false });
  nodes.amEmailDigest.checked = true; nodes.amEmailDigest.change();
  assert.equal(nodes.amEmailWeekly.disabled, false);
  nodes.amEmailWeekly.checked = true;
  await context.i();
  assert.deepEqual(plain(calls.at(-1)[4]), { email_digest_enabled: true, email_weekly_enabled: true });
  nodes.amEmailDigest.checked = false; nodes.amEmailDigest.change();
  assert.equal(nodes.amEmailWeekly.checked, false);
});

test('dashboard unknown preferences display off and unrelated save preserves every existing stored state', async () => {
  const html = read('dashboard/index.html');
  for (const flags of [{}, { email_digest_enabled: null, email_weekly_enabled: null }, { email_digest_enabled: true, email_weekly_enabled: false }, { email_digest_enabled: false, email_weekly_enabled: true }]) {
    const originalFlags = structuredClone(flags);
    const nodes = {}, payloads = [];
    for (const id of ['saveProfileBtn','editName','editCountry','editNewPassword','editConfirmPassword','editPhone','editCity','editBio','editJobTitle','editCompany','editIndustry','editCompanySize','editExperience','editLinkedIn','editWebsite','editEmailDigest','editEmailWeekly']) nodes[id] = control();
    nodes.editName.value = 'Owned settings'; nodes.editCountry.value = 'NG';
    const context = vm.createContext({ document: { getElementById: id => nodes[id] || null }, selectedInterests: [], COUNTRY_CURRENCY_MAP: { NG: 'NGN' },
      saveFullProfile: async payload => { payloads.push(payload); return { ok: false, error: 'Owned save withheld' }; }, showToast() {},
    });
    vm.runInContext(['hydrateEmailPreferences','appendEditedEmailPreferences','handleSaveProfile'].map(name => htmlDeclaration(html, name)).join('\n'), context);
    context.hydrateEmailPreferences(flags);
    assert.equal(nodes.editEmailDigest.checked, flags.email_digest_enabled === true);
    assert.equal(nodes.editEmailWeekly.checked, flags.email_weekly_enabled === true);
    await context.handleSaveProfile();
    assert.equal(Object.hasOwn(payloads[0], 'email_digest_enabled'), false);
    assert.equal(Object.hasOwn(payloads[0], 'email_weekly_enabled'), false);
    assert.deepEqual(flags, originalFlags, 'stored input remains unchanged');
    nodes.editEmailDigest.checked = true; nodes.editEmailDigest.dataset.emailConsentEdited = 'true';
    await context.handleSaveProfile();
    assert.equal(payloads[1].email_digest_enabled, true);
    assert.equal(Object.hasOwn(payloads[1], 'email_weekly_enabled'), false);
    delete nodes.editEmailDigest; delete nodes.editEmailWeekly;
    await context.handleSaveProfile();
    assert.equal(Object.hasOwn(payloads[2], 'email_digest_enabled'), false);
    assert.equal(Object.hasOwn(payloads[2], 'email_weekly_enabled'), false);
  }
});

test('dashboard partial API acknowledgement still requires full user-scoped fallback success', async () => {
  const html = read('dashboard/index.html');
  for (const fallbackSucceeds of [false, true]) {
    const directPayloads = [], apiPayloads = [];
    const context = vm.createContext({ currentUser: { id: 'owned-profile-fixture' }, extendedProfile: { email_digest_enabled: false },
      console: { log() {}, warn() {} }, withTimeout: async promise => promise,
      fetch: async (url, options) => {
        assert.equal(url, '/api/profile');
        apiPayloads.push(JSON.parse(options.body));
        return { status: 200, ok: true, json: async () => ({ synced: true, partial: true }) };
      },
      AfroAuth: { getSessionToken: () => 'owned-synthetic-session', getSupabase: () => ({
        from(table) { assert.equal(table, 'profiles'); return {
          upsert(payload, options) {
            directPayloads.push(plain(payload)); assert.equal(options.onConflict, 'id');
            return { select() { return { single: async () => fallbackSucceeds
              ? { data: { id: 'owned-profile-fixture', email_digest_enabled: false }, error: null }
              : { data: null, error: { message: 'Owned fallback withheld' } } }; } };
          },
        }; },
      }) },
    });
    vm.runInContext(htmlDeclaration(html, 'saveFullProfile'), context);
    const result = await context.saveFullProfile({ name: 'Owned settings', email_digest_enabled: false });
    assert.equal(result.ok, fallbackSucceeds);
    assert.equal(directPayloads.length, 1);
    assert.deepEqual(apiPayloads[0], { name: 'Owned settings', email_digest_enabled: false });
    assert.deepEqual(directPayloads[0], { id: 'owned-profile-fixture', name: 'Owned settings', email_digest_enabled: false });
  }
});

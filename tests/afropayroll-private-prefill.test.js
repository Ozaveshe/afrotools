'use strict';
// Actual maintained helper/engine execution. DOM seams do not certify native
// navigation, clipboard, storage inheritance, layout or downstream calculations.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const api = require('../assets/js/lib/payroll-private-prefill.js');
const helperSource = fs.readFileSync(path.join(root, 'assets/js/lib/payroll-private-prefill.js'), 'utf8');
const engineSource = fs.readFileSync(process.env.PAYROLL_ENGINE_INPUT || path.join(root, 'engines/src/afropayroll-os-engine.js'), 'utf8');
const engineContext = { window: {} }; vm.runInNewContext(engineSource, engineContext);
const engine = engineContext.window.AfroTools.engines.afropayrollOs;
const origin = 'https://example.invalid';
const values = { country: 'NG', salary: '250000', role: 'Synthetic role', currency: '', docType: '' };
function store() { const map = new Map(); return { map, getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) }; }
function prepare(id, overrides = {}, now = 1000) {
  const storage = store(), source = { ...values, country: api.ROUTES[id].country || 'NG', ...overrides };
  const launch = api.prepareLaunch(engine.getToolPath(id), source, storage, now, origin);
  return { storage, source, launch, location: { href: new URL(launch.url || '/', origin).href } };
}
for (const id of Object.keys(engine.TOOL_PATHS)) test('engine launch excludes private salary and role: ' + id, () => {
  const url = new URL(engine.buildPreFillUrl(id, values), origin);
  assert.equal(url.searchParams.has('salary'), false); assert.equal(url.searchParams.has('role'), false);
  assert.equal(url.href.includes(values.salary), false); assert.equal(url.href.includes(encodeURIComponent(values.role)), false);
  assert.equal(url.searchParams.get('country'), 'NG');
});
for (const id of Object.keys(engine.TOOL_PATHS)) test('private session roundtrip and single consumption: ' + id, () => {
  const f = prepare(id); assert.equal(f.launch.ok, true);
  const url = new URL(f.launch.url, origin); assert.equal(url.searchParams.get('payroll_prefill'), '1');
  assert.equal(url.href.includes(values.salary), false); assert.equal(url.searchParams.has('role'), false);
  const received = api.consume(f.location, f.storage, 1001); assert.equal(received.ok, true);
  assert.deepEqual(received.payload.values, f.source); assert.equal(received.payload.expiresAt - received.payload.createdAt, 1200000);
  assert.equal(f.storage.map.size, 0); assert.equal(api.consume(f.location, f.storage, 1002).ok, false);
});
test('unknown, external and prefix-confusion routes never receive a payload', () => {
  for (const target of ['https://other.invalid/tools/staff-cost/', '/tools/staff-cost/evil', '/tools/unknown/', '//other.invalid/tools/staff-cost/']) {
    const storage = store(); assert.equal(api.prepareLaunch(target, values, storage, 1000, origin).ok, false); assert.equal(storage.map.size, 0);
  }
});
test('private handoff cleans hostile or legacy query/hash fields rather than forwarding them', () => {
  const storage = store(); const launch = api.prepareLaunch('/tools/staff-cost/?salary=private&role=private&q=private#private', values, storage, 1000, origin);
  assert.equal(launch.ok, true); assert.equal(launch.url, '/tools/staff-cost/?payroll_prefill=1');
});
test('fixed scheme and public country mismatches fail before storage', () => {
  for (const target of ['/tools/ke-nssf/', '/tools/gh-ssnit/', '/tools/za-gepf/', '/tools/za-uif/', '/tools/staff-cost/?country=KE']) {
    const storage = store(); assert.equal(api.prepareLaunch(target, values, storage, 1000, origin).ok, false); assert.equal(storage.map.size, 0);
  }
});
test('destination mismatch, country mismatch and invalid record shapes cannot be consumed', () => {
  const changes = [p => { p.targetPath = '/tools/social-security/'; }, p => { p.values.country = 'XX'; }, p => { p.version = 2; }, p => { p.type = 'other'; }, p => { p.values.salary = -1; }, p => { p.values.role = {}; }, p => { p.expiresAt += 1; }, p => { p.createdAt = 2000; p.expiresAt = 2000 + api.TTL; }];
  for (const change of changes) { const f = prepare('staff-cost'); const payload = JSON.parse(f.storage.getItem(api.KEY)); change(payload); f.storage.setItem(api.KEY, JSON.stringify(payload)); assert.equal(api.consume(f.location, f.storage, 1001).ok, false); assert.equal(f.storage.map.size, 0); }
  for (const raw of ['null', '[]', '7', '{broken', 'x'.repeat(9000)]) { const f = prepare('staff-cost'); f.storage.setItem(api.KEY, raw); assert.equal(api.consume(f.location, f.storage, 1001).ok, false); }
  const f = prepare('staff-cost'); f.location.href += '&country=KE'; assert.equal(api.consume(f.location, f.storage, 1001).ok, false);
});
test('expiry is enforced at boundary and ordinary direct visits do not consume a private draft', () => {
  const f = prepare('staff-cost'); assert.equal(api.consume({ href: origin + '/tools/staff-cost/' }, f.storage, 1001).ok, false); assert.equal(f.storage.map.size, 1);
  assert.equal(api.consume(f.location, f.storage, 1000 + api.TTL).ok, false); assert.equal(f.storage.map.size, 0);
});
test('a private marker on a URL containing legacy salary or role does not certify private arrival', () => {
  for (const key of ['salary', 'role', 'q']) { const f = prepare('staff-cost'); f.location.href += '&' + key + '=synthetic'; assert.equal(api.consume(f.location, f.storage, 1001).ok, false); }
});
test('invalid source types, nonfinite or negative pay are not silently coerced', () => {
  for (const change of [{ salary: -1 }, { salary: '-1' }, { salary: 'Infinity' }, { salary: '1e309' }, { role: {} }, { role: null }, { role: 'x'.repeat(201) }, { currency: 'usd' }, { country: 'XX' }, { docType: 'unknown' }]) {
    const f = prepare('staff-cost', change); assert.equal(f.launch.ok, false); assert.equal(f.storage.map.size, 0);
  }
  for (const salary of ['', '0', '250000.50']) assert.equal(prepare('staff-cost', { salary }).launch.ok, true);
});
test('storage failures fail honestly with a safe non-private manual URL', () => {
  const storage = { setItem() { throw Error('blocked'); } };
  const result = api.prepareLaunch('/tools/staff-cost/?salary=private&role=private', values, storage, 1000, origin);
  assert.equal(result.ok, false); assert.equal(result.url, '/tools/staff-cost/'); assert.match(result.reason, /unavailable/);
  assert.equal(api.consume({ href: origin + '/tools/staff-cost/?payroll_prefill=1' }, { getItem() { throw Error('blocked'); }, removeItem() {} }).ok, false);
});

function browserFixture(id, { editedRole = '', payloadValues = {}, target = null, now = 1001 } = {}) {
  const f = prepare(id, payloadValues), elements = new Map(), actions = { input: 0, change: 0, submit: 0, network: 0 };
  class Element {
    constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.children = []; this.listeners = {}; this.attrs = {}; this.style = {}; this.value = ''; this.options = []; this.textContent = ''; }
    set id(value) { this._id = value; elements.set(value, this); } get id() { return this._id; }
    setAttribute(key, value) { this.attrs[key] = value; }
    appendChild(node) { this.children.push(node); }
    insertBefore(node) { this.children.unshift(node); }
    addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
    dispatchEvent(event) { if (event.type in actions) actions[event.type]++; for (const callback of this.listeners[event.type] || []) callback(event); }
    click() { this.dispatchEvent(new Event('click')); }
    getClientRects() { return this.hidden ? [] : [{}]; }
    remove() { elements.delete(this.id); }
  }
  const body = new Element('body'), main = new Element('main');
  const html = fs.readFileSync(path.join(root, 'tools', id, 'index.html'), 'utf8');
  for (const match of html.matchAll(/<(input|select)\b[^>]*\bid="([^"]+)"[^>]*>/g)) { const element = new Element(match[1]); element.id = match[2]; }
  // The real payslip owner creates #role dynamically. Its precise field contract
  // is exercised here; native route QA separately checks the rendered controller.
  if (id === 'payslip-generator') { const role = new Element('input'); role.id = 'role'; role.value = editedRole; }
  for (const countryId of ['country', 'lc-country', 'dg-hero-country', 'lla-hero-country']) if (elements.has(countryId)) elements.get(countryId).options = [{ value: '' }, { value: 'NG' }, { value: 'KE' }];
  const location = new URL(target || f.location.href);
  const document = { readyState: 'complete', body, getElementById: key => elements.get(key) || null, querySelector: selector => selector === 'main' ? main : null, createElement: tag => new Element(tag) };
  const fakeDate = class extends Date { static now() { return now; } };
  const window = { document, location, sessionStorage: f.storage, Event, navigator: {}, fetch() { actions.network++; throw Error('unexpected network'); } };
  vm.runInNewContext(helperSource, { window, URL, Date: fakeDate });
  const section = elements.get('apo-private-context');
  return { ...f, elements, actions, window, section, buttons: () => section.children.filter(e => e.tagName === 'BUTTON'), text: () => section.children.map(e => e.textContent).join(' ') };
}
for (const id of Object.keys(engine.TOOL_PATHS)) test('actual bridge receives full context without applying or calculating: ' + id, () => {
  const f = browserFixture(id); assert.ok(f.section); assert.match(f.text(), /Gross pay: 250000 \(pay period not recorded\)/); assert.match(f.text(), /Synthetic role/);
  assert.equal(f.section.attrs['data-clarity-mask'], 'true'); assert.equal(f.actions.input, 0); assert.equal(f.actions.change, 0); assert.equal(f.actions.submit, 0); assert.equal(f.actions.network, 0);
  assert.equal(f.buttons().some(b => /Apply.*salary|Apply.*gross|Apply.*pension|Apply.*basic/i.test(b.textContent)), false);
  assert.equal(f.storage.map.size, 0);
});
test('explicit role application preserves an unchanged draft until clicked, and later edits win', () => {
  const f = browserFixture('payslip-generator', { editedRole: 'Existing draft' }); const role = f.elements.get('role');
  assert.equal(role.value, 'Existing draft'); f.buttons().find(b => b.textContent === 'Apply role').click(); assert.equal(role.value, values.role);
  assert.equal(f.actions.input, 1); assert.equal(f.actions.change, 1); assert.equal(f.actions.submit, 0);
  const g = browserFixture('payslip-generator'); g.elements.get('role').value = 'Typed after arrival'; g.buttons().find(b => b.textContent === 'Apply role').click(); assert.equal(g.elements.get('role').value, 'Typed after arrival'); assert.match(g.text(), /entry was kept/);
});
test('explicit exact country apply has no automatic submit; missing or hidden fields are honest', () => {
  const f = browserFixture('social-security'); assert.equal(f.elements.get('country').value, ''); f.buttons().find(b => b.textContent === 'Apply country').click(); assert.equal(f.elements.get('country').value, 'NG'); assert.equal(f.actions.submit, 0);
  const g = browserFixture('payslip-generator'); g.elements.get('role').hidden = true; g.buttons().find(b => b.textContent === 'Apply role').click(); assert.equal(g.elements.get('role').value, ''); assert.match(g.text(), /form step/);
});
test('unavailable exact select value never falls back to a partial or different country', () => {
  const field = { value: '', disabled: false, tagName: 'SELECT', options: [{ value: 'NGA' }], getClientRects: () => [{}] };
  assert.equal(api.applyField(field, 'NG', '', 'country').ok, false); assert.equal(field.value, '');
});
test('destination labels contain literal source text rather than injected HTML', () => {
  const f = browserFixture('payslip-generator', { payloadValues: { role: '<img src=x onerror=alert(1)>' } }); assert.match(f.text(), /<img src=x/); assert.equal(f.section.children.some(e => e.tagName === 'IMG'), false);
});
test('document continuation stays exact-target, same-country and retains original expiry', () => {
  const f = browserFixture('doc-generator', { payloadValues: { docType: 'offer-letter' } });
  const next = f.window.AfroTools.payrollPrivatePrefill.continueDocument('generate?country=NG&type=offer-letter');
  assert.equal(next.ok, true); assert.equal(new URL(next.url, origin).pathname, '/tools/doc-generator/generate');
  const payload = JSON.parse(f.storage.getItem(api.KEY)); assert.equal(payload.targetPath, '/tools/doc-generator/generate'); assert.equal(payload.expiresAt, 1000 + api.TTL);
  assert.equal(api.consume({ href: origin + next.url }, f.storage, 1002).ok, true);
  assert.equal(f.window.AfroTools.payrollPrivatePrefill.continueDocument('generate?country=KE').ok, false);
  assert.equal(f.window.AfroTools.payrollPrivatePrefill.continueDocument('/tools/staff-cost/').ok, false);
});
test('all17 maintained landing pages and actual document form load the owned bridge once', () => {
  for (const id of Object.keys(engine.TOOL_PATHS)) {
    const html = fs.readFileSync(path.join(root, 'tools', id, 'index.html'), 'utf8');
    assert.equal((html.match(/src="\/assets\/js\/lib\/payroll-private-prefill\.js"/g) || []).length, 1, id);
  }
  const actualDocument = fs.readFileSync(path.join(root, 'tools/doc-generator/generate.html'), 'utf8'); assert.equal((actualDocument.match(/src="\/assets\/js\/lib\/payroll-private-prefill\.js"/g) || []).length, 1);
  assert.ok(actualDocument.includes('dg-ee-title')); assert.ok(actualDocument.includes('dg-f-pay-freq'));
});
test('helper country validation exactly preserves the existing setup country set', () => {
  const html = fs.readFileSync(path.join(root, 'tools/afropayroll-os/flow.html'), 'utf8'); const codes = [...html.slice(html.indexOf('var COUNTRY_GROUPS'), html.indexOf('function populateCountryOptions')).matchAll(/code: '([A-Z]{2})'/g)].map(m => m[1]);
  assert.deepEqual([...api.COUNTRIES].sort(), codes.sort());
});
test('actual flow Open prepares only on activation, same-tab URL stays private and checklist draft is unchanged', async () => {
  const fixtureSource = fs.readFileSync(path.join(root, 'tests/afropayroll-guided-flow-state.test.js'), 'utf8');
  const start = fixtureSource.indexOf('async function fixture('), end = fixtureSource.indexOf('\nconst saved =', start);
  assert.ok(start >= 0 && end > start);
  const html = fs.readFileSync(path.join(root, 'tools/afropayroll-os/flow.html'), 'utf8');
  const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.includes('function showComplete('));
  let context;
  const instrumentedVM = { ...vm, createContext: value => {
    context = value;
    value.localStorage.setItem('apo_prefill', JSON.stringify({ salary: values.salary, role: values.role }));
    value.localStorage.setItem('unrelated-local-draft', 'preserve');
    return vm.createContext(value);
  } };
  const actualFixture = vm.runInNewContext('(' + fixtureSource.slice(start, end) + ')', { html, script, engineSource, vm: instrumentedVM, URLSearchParams, Event, assert });
  const f = await actualFixture({ country: 'NG', salary: values.salary });
  assert.equal(f.store.has('apo_prefill'), false); assert.equal(f.store.get('unrelated-local-draft'), 'preserve');
  const storage = store(), navigations = [];
  context.window.AfroTools.payrollPrivatePrefill = { prepareLaunch: (url, source) => api.prepareLaunch(url, source, storage, 1000, origin) };
  context.window.location.assign = value => navigations.push(value);
  f.node('setup-role').value = values.role; f.click('apo-start-btn');
  const before = JSON.stringify(f.progress()); assert.equal(storage.map.size, 0); assert.equal(f.node('apo-btn-open').target, '_self');
  assert.equal(new URL(f.node('apo-btn-open').href, origin).searchParams.has('salary'), false);
  f.node('apo-btn-open').listeners.click[0].call(f.node('apo-btn-open'), { preventDefault() {} });
  assert.equal(navigations.length, 1); assert.equal(navigations[0].includes(values.salary), false); assert.equal(storage.map.size, 1);
  assert.equal(JSON.stringify(f.progress()), before); assert.equal(f.store.has('apo_prefill'), false);
  const received = api.consume({ href: new URL(navigations[0], origin).href }, storage, 1001); assert.equal(received.ok, true); assert.equal(received.payload.values.salary, values.salary); assert.equal(received.payload.values.role, values.role);
  context.window.AfroTools.payrollPrivatePrefill = { prepareLaunch: (url, source) => api.prepareLaunch(url, source, { setItem() { throw Error('blocked'); } }, 1000, origin) };
  f.node('apo-btn-open').listeners.click[0].call(f.node('apo-btn-open'), { preventDefault() {} });
  assert.equal(navigations.length, 1); assert.equal(f.node('apo-open-without-prefill').hidden, false); assert.match(f.node('apo-handoff-status').textContent, /unavailable/); assert.equal(JSON.stringify(f.progress()), before);
});

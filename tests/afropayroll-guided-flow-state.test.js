'use strict';
// Executes the complete maintained inline controller and served engine. The DOM is
// a narrow event/storage seam: native keyboard, layout and PDF files need browser QA.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(process.env.PAYROLL_FLOW_HTML || path.join(root, 'tools/afropayroll-os/flow.html'), 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.includes('function showComplete('));
const engineSource = fs.readFileSync(path.join(root, 'engines/afropayroll-os-engine.js'), 'utf8');

async function fixture(options = {}) {
  const nodes = new Map(), store = new Map(), pdf = [], shared = [];
  const document = { activeElement: null };
  class Element {
    constructor(tag = 'div', attrs = {}) { this.tagName = tag.toUpperCase(); this.attrs = attrs; this.id = attrs.id; this.value = ''; this.textContent = ''; this.style = {}; this.dataset = {}; this.listeners = {}; this.children = []; this.validity = { badInput: false }; this.classList = { add() {}, remove() {} }; if (this.id) nodes.set(this.id, this); }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    removeAttribute(k) { delete this.attrs[k]; }
    focus() { document.activeElement = this; }
    addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
    dispatch(type) { for (const callback of this.listeners[type] || []) callback({ target: this }); }
    appendChild(child) { this.children.push(child); }
    set innerHTML(value) {
      this._html = value; this.children = [];
      for (const match of value.matchAll(/<(button|input)\b([^>]*)>/g)) {
        const attrs = Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
        const child = new Element(match[1], attrs); child.dataset.step = attrs['data-step']; this.children.push(child);
      }
    }
    get innerHTML() { return this._html || ''; }
    querySelectorAll(selector) { return selector === '.apo-step-dot' ? this.children.filter(n => (n.attrs.class || '').includes('apo-step-dot')) : []; }
  }
  for (const match of html.matchAll(/<([\w-]+)\b([^>]*\bid="[^"]+"[^>]*)>/g)) {
    const attrs = Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
    new Element(match[1], attrs);
  }
  document.getElementById = id => nodes.get(id) || null;
  document.querySelectorAll = () => [];
  document.createElement = tag => new Element(tag);
  if ('saved' in options) store.set('apo_journey_new-hire', JSON.stringify(options.saved));
  if ('savedRaw' in options) store.set('apo_journey_new-hire', options.savedRaw);
  const context = { document, URLSearchParams, localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) }, console: { warn() {} }, navigator: { share: data => shared.push(data) }, window: { innerWidth: 390, location: { search: options.resume ? '?resume=1' : '' }, addEventListener() {} } };
  vm.createContext(context); vm.runInContext(engineSource, context);
  context.window.AfroTools.pdf = { generate: payload => pdf.push(payload) };
  await vm.runInContext(script, context);
  const node = id => nodes.get(id);
  if ('country' in options) node('setup-country').value = options.country;
  else if (!options.resume) node('setup-country').value = 'NG';
  if ('salary' in options) node('setup-salary').value = options.salary;
  return { node, store, pdf, shared, document, engine: context.window.AfroTools.engines.afropayrollOs,
    click: id => { assert.ok(node(id), 'actual control ' + id); node(id).dispatch('click'); },
    progress: () => JSON.parse(store.get('apo_journey_new-hire') || '{}') };
}
const saved = overrides => ({ country: 'NG', currentStep: 4, totalSteps: 7, updatedAt: 1, carryData: { country: 'NG', salary: '250000', role: 'Synthetic role' }, stepStatuses: ['done', 'done', 'done', 'done', 'pending', 'pending', 'pending'], ...overrides });
function summary(f) { for (let i = 0; i < 7; i++) f.click('apo-next-btn'); }

test('Next alone retains seven pending steps and recoverable partial summary', async () => {
  const f = await fixture(); f.click('apo-start-btn'); summary(f);
  assert.doesNotMatch(f.node('apo-complete-title').textContent, /Complete!/);
  assert.match(f.node('apo-complete-desc').textContent, /7 pending/);
  assert.equal(f.progress().currentStep, 0); assert.equal(f.engine.getIncompleteJourneys().length, 1);
  f.click('apo-resume-checklist-btn'); assert.equal(f.node('apo-flow-layout').style.display, 'block');
  assert.equal(f.document.activeElement.id, 'apo-step-title');
});
test('only all explicitly done clears progress and hides unresolved recovery', async () => {
  const f = await fixture(); f.click('apo-start-btn'); for (let i = 0; i < 7; i++) f.click('apo-btn-done');
  assert.match(f.node('apo-complete-title').textContent, /Complete!/); assert.equal(f.store.has('apo_journey_new-hire'), false);
  assert.equal(f.node('apo-resume-checklist-btn').hidden, true);
  assert.equal(f.node('apo-resume-checklist-btn').style.display, 'none');
});
test('skipped steps remain resumable even when no pending steps remain', async () => {
  const f = await fixture({ resume: true, saved: saved({ stepStatuses: ['done', 'done', 'skipped', 'done', 'done', 'done', 'done'] }) });
  f.click('apo-start-btn'); summary(f);
  assert.doesNotMatch(f.node('apo-complete-title').textContent, /Complete!/); assert.equal(f.progress().currentStep, 2);
  assert.match(f.node('apo-resume-checklist-btn').textContent, /skipped/);
});
for (const country of ['', 'OTHER', 'ZZ']) test('reject unavailable country ' + JSON.stringify(country), async () => {
  const f = await fixture({ country }); f.click('apo-start-btn'); assert.notEqual(f.node('apo-flow-layout').style.display, 'block');
  assert.equal(f.document.activeElement.id, 'setup-country'); assert.equal(f.node('setup-country').getAttribute('aria-invalid'), 'true');
});
for (const salary of ['-1', 'Infinity', '1e309']) test('reject invalid optional pay ' + salary, async () => {
  const f = await fixture({ salary }); f.click('apo-start-btn'); assert.notEqual(f.node('apo-flow-layout').style.display, 'block');
  assert.equal(f.document.activeElement.id, 'setup-salary');
});
test('native badInput is rejected even when number input exposes an empty value', async () => {
  const f = await fixture({ salary: '' }); f.node('setup-salary').validity.badInput = true; f.click('apo-start-btn');
  assert.notEqual(f.node('apo-flow-layout').style.display, 'block');
});
for (const salary of ['', '0', '250000.50']) test('optional blank and finite nonnegative pay allowed ' + JSON.stringify(salary), async () => {
  const f = await fixture({ salary }); f.click('apo-start-btn'); assert.equal(f.node('apo-flow-layout').style.display, 'block');
  assert.equal(f.progress().carryData.salary, salary);
});
test('country change clears visible old pay, resets acknowledgements and owns carry URLs', async () => {
  const f = await fixture({ resume: true, saved: saved() });
  f.node('setup-country').value = 'KE'; f.node('setup-country').dispatch('change');
  assert.equal(f.node('setup-salary').value, ''); assert.match(f.node('apo-country-notice').textContent, /no currency conversion/);
  f.node('setup-salary').value = '12000'; f.click('apo-start-btn');
  assert.equal(f.progress().country, 'KE'); assert.equal(f.progress().carryData.country, 'KE');
  assert.equal(f.progress().carryData.salary, '12000'); assert.ok(f.progress().stepStatuses.every(s => s === 'pending'));
  assert.match(f.node('apo-btn-open').href, /country=KE/); assert.doesNotMatch(f.node('apo-btn-open').href, /country=NG/);
});
test('same country resume preserves explicit statuses but uses visible edits', async () => {
  const f = await fixture({ resume: true, saved: saved(), salary: '0' }); f.node('setup-role').value = 'Edited role'; f.click('apo-start-btn');
  assert.equal(f.progress().currentStep, 4); assert.equal(f.progress().stepStatuses.filter(s => s === 'done').length, 4);
  assert.equal(f.progress().carryData.salary, '0'); assert.equal(f.progress().carryData.role, 'Edited role');
});
test('switching back does not resurrect old acknowledgements or old pay', async () => {
  const f = await fixture({ resume: true, saved: saved() });
  for (const country of ['KE', 'NG']) { f.node('setup-country').value = country; f.node('setup-country').dispatch('change'); }
  f.click('apo-start-btn'); assert.ok(f.progress().stepStatuses.every(s => s === 'pending')); assert.equal(f.progress().carryData.salary, '');
});
for (const malformed of [null, [], 7, 'broken']) test('malformed stored shape recovers and saves ' + JSON.stringify(malformed), async () => {
  const f = await fixture({ resume: true, saved: malformed, country: 'NG' }); f.click('apo-start-btn');
  assert.equal(f.node('apo-flow-layout').style.display, 'block'); assert.equal(f.progress().country, 'NG'); assert.ok(f.progress().updatedAt);
});
test('missing resume record remains valid and legacy position does not invent done', async () => {
  for (const prior of [undefined, saved({ stepStatuses: undefined })]) {
    const f = await fixture({ resume: true, ...(prior ? { saved: prior } : {}), country: 'NG' }); f.click('apo-start-btn');
    assert.ok(f.progress().stepStatuses.every(s => s === 'pending'));
  }
});
test('corrupt JSON recovers to a fresh persistent journey without changing another journey', async () => {
  const f = await fixture({ resume: true, savedRaw: '{not JSON', country: 'NG' });
  f.store.set('apo_journey_monthly-payroll', 'untouched'); f.click('apo-start-btn');
  assert.equal(f.progress().country, 'NG'); assert.ok(f.progress().updatedAt);
  assert.equal(f.store.get('apo_journey_monthly-payroll'), 'untouched');
});
test('unknown statuses and negative current index recover safely', async () => {
  const f = await fixture({ resume: true, saved: saved({ currentStep: -3, stepStatuses: ['bad', null, {}, 'done', 'skipped', 'pending', 'pending'] }) });
  f.click('apo-start-btn'); assert.equal(f.progress().currentStep, 0); assert.deepEqual(f.progress().stepStatuses, ['pending', 'pending', 'pending', 'done', 'skipped', 'pending', 'pending']);
});
test('carry pay validation blocks done then accepts explicit zero', async () => {
  const f = await fixture(); f.click('apo-start-btn'); f.node('carry-salary').value = '-2'; f.click('apo-btn-done');
  assert.equal(f.progress().stepStatuses[0], 'pending'); assert.equal(f.document.activeElement.id, 'carry-salary');
  f.node('carry-salary').value = '0'; f.click('apo-btn-done'); assert.equal(f.progress().stepStatuses[0], 'done'); assert.equal(f.progress().carryData.salary, '0');
});
test('actual step controls are native buttons with current/status names and navigate without completion', async () => {
  const f = await fixture(); f.click('apo-start-btn'); const buttons = f.node('apo-step-dots').querySelectorAll('.apo-step-dot');
  assert.equal(buttons.length, 7); assert.ok(buttons.every(b => b.tagName === 'BUTTON' && b.getAttribute('type') === 'button'));
  assert.equal(buttons[0].getAttribute('aria-current'), 'step'); assert.match(buttons[2].getAttribute('aria-label'), /Step 3:.*pending/);
  buttons[2].dispatch('click'); assert.equal(f.progress().currentStep, 2); assert.ok(f.progress().stepStatuses.every(s => s === 'pending'));
  f.click('apo-prev-btn'); assert.equal(f.progress().currentStep, 1); assert.equal(f.document.activeElement.id, 'apo-step-title');
});
test('summary PDF payload and share remain truthful for partial checklist, role rendered as text', async () => {
  const f = await fixture(); f.node('setup-role').value = '<img src=x onerror=alert(1)>'; f.click('apo-start-btn'); summary(f);
  f.click('apo-download-btn'); f.click('apo-share-btn');
  assert.equal(f.pdf[0].sections[0].rows.filter(r => r.value === 'Pending').length, 7);
  assert.ok(f.pdf[0].sections[0].rows.some(r => r.label === 'Pending steps' && r.value === '7'));
  assert.match(f.shared[0].text, /0 of 7 marked done, 0 skipped, 7 pending/); assert.doesNotMatch(f.shared[0].text, /just completed/);
  assert.doesNotMatch(f.node('apo-summary-rows').innerHTML, /<img/);
});

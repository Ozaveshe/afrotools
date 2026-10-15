'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const ENGINE = fs.readFileSync(path.join(ROOT, 'tools/vaccine-schedule/vaccine-schedule-engine.js'), 'utf8');
const CONTROLLER = fs.readFileSync(path.join(ROOT, 'tools/vaccine-schedule/vaccine-schedule-vip.js'), 'utf8');
const EXPECTED = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/health-export-followon/expected.json'), 'utf8')).vaccine.textFiles;
const NOW = '2026-10-10T12:00:00Z';
class FixtureDate extends Date {
  constructor(...args) { super(...(args.length ? args : [NOW])); }
  static now() { return Date.parse(NOW); }
}

// Only DOM mechanics are modeled. The complete maintained engine/controller and
// existing browser-export fixtures are loaded above, and Blob consumption is real.
function harness(t, lang = 'en') {
  const events = new Map();
  const nodes = new Map();
  const created = [];
  const revoked = [];
  const delegated = [];
  const faults = { append: null, click: null };
  class Element {
    constructor(id) { this.id = id; this.value = ''; this.hidden = true; this.listeners = new Map(); this.children = []; }
    addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, []); this.listeners.get(name).push(fn); }
    dispatch(name) { for (const fn of this.listeners.get(name) || []) fn({ preventDefault() {} }); }
    setAttribute(name, value) { this[name] = value; }
    removeAttribute(name) { delete this[name]; }
    appendChild(child) { this.children.push(child); return child; }
    querySelector() { if (!this.strong) this.strong = new Element('strong'); return this.strong; }
    set textContent(value) { this.text = String(value); this.children = []; }
    get textContent() { return this.text || ''; }
    focus() {}
    scrollIntoView() {}
    click() {
      if (faults.click) { const error = faults.click; faults.click = null; throw error; }
      delegated.push({ url: this.href, filename: this.download });
    }
    remove() { this.removed = true; }
  }
  function get(id) { if (!nodes.has(id)) nodes.set(id, new Element(id)); return nodes.get(id); }
  const body = new Element('body');
  body.appendChild = child => {
    if (faults.append) { const error = faults.append; faults.append = null; throw error; }
    body.children.push(child);
    return child;
  };
  const context = vm.createContext({
    Blob, Set, Date: FixtureDate,
    URL: {
      createObjectURL(blob) { const url = URL.createObjectURL(blob); created.push(url); return url; },
      revokeObjectURL(url) { revoked.push(url); URL.revokeObjectURL(url); }
    },
    document: { getElementById: get, createElement: name => new Element(name), body, documentElement: { lang } },
    matchMedia: () => ({ matches: true }), print() {},
    setTimeout(fn) { fn(); },
    addEventListener(name, fn) { if (!events.has(name)) events.set(name, []); events.get(name).push(fn); }
  });
  context.window = context;
  vm.runInContext(ENGINE, context, { filename: 'vaccine-schedule-engine.js' });
  vm.runInContext(CONTROLLER, context, { filename: 'vaccine-schedule-vip.js' });
  function pagehide() { for (const fn of events.get('pagehide') || []) fn({ persisted: true }); }
  function submit(n) {
    const values = {
      country: ['NG', 'KE', 'GH', 'ZA', 'ET', 'OTHER'][n % 6],
      'age-band': ['newborn', 'infant', 'early-childhood', 'school-age', 'adolescent', 'adult'][n % 6],
      'record-status': ['routine', 'missed', 'unclear', 'no-record', 'reaction'][n % 5],
      'record-product': n % 2 ? '' : 'Download PDF — café <>&'
    };
    for (const [id, value] of Object.entries(values)) get(id).value = value;
    get('programme-form').dispatch('submit');
    assert.equal(get('handoff').hidden, false, 'actual engine/controller should render a valid handoff');
  }
  t.after(() => { pagehide(); for (const url of created) URL.revokeObjectURL(url); });
  return {
    nodes, created, revoked, delegated, faults, body, submit, pagehide,
    download() { get('download-button').dispatch('click'); },
    async consume(url) {
      await new Promise(resolve => setImmediate(resolve));
      const response = await fetch(url);
      return Buffer.from(await response.arrayBuffer());
    }
  };
}

for (const lang of ['en', 'fr']) {
  test(lang + ': overlapping exports preserve distinct exact briefs until document cleanup', async t => {
    const h = harness(t, lang);
    h.submit(0); h.download();
    h.submit(1); h.download();
    assert.equal(h.delegated.length, 2);
    assert.notEqual(h.delegated[0].url, h.delegated[1].url);
    assert.deepEqual(h.revoked, [], 'later export must not revoke a pending earlier download');
    for (let n = 0; n < 2; n++) {
      assert.equal(h.delegated[n].filename, 'vaccination-programme-visit-brief.txt');
      const body = await h.consume(h.delegated[n].url);
      assert.deepEqual(body, Buffer.from(EXPECTED[`${lang}-patched-${n}.txt`], 'utf8'));
    }
    h.pagehide();
    assert.deepEqual(h.revoked, h.created);
    await assert.rejects(h.consume(h.delegated[0].url), /fetch failed/);
  });
}

test('no current result and invalid engine input create no Blob URLs', t => {
  const h = harness(t);
  h.download();
  h.nodes.get('programme-form').dispatch('submit');
  h.download();
  assert.equal(h.created.length, 0);
  assert.equal(h.delegated.length, 0);
  assert.equal(h.nodes.get('error-summary').hidden, false);
});

test('pagehide cleanup is idempotent and a restored document can export a fresh brief', async t => {
  const h = harness(t);
  h.submit(0); h.download();
  h.pagehide(); h.pagehide();
  assert.deepEqual(h.revoked, [h.created[0]]);
  h.submit(1); h.download();
  assert.equal(h.created.length, 2);
  assert.deepEqual(await h.consume(h.delegated[1].url), Buffer.from(EXPECTED['en-patched-1.txt'], 'utf8'));
  h.pagehide(); h.pagehide();
  assert.deepEqual(h.revoked, h.created);
});

for (const failure of ['append', 'click']) {
  test(failure + ' exception releases only its own Blob URL and preserves an earlier delegated brief', async t => {
    const h = harness(t);
    h.submit(0); h.download();
    const error = new Error('synthetic ' + failure + ' failure');
    h.submit(1);
    h.faults[failure] = error;
    assert.throws(() => h.download(), caught => caught === error);
    assert.equal(h.created.length, 2);
    assert.deepEqual(h.revoked, [h.created[1]]);
    assert.deepEqual(await h.consume(h.delegated[0].url), Buffer.from(EXPECTED['en-patched-0.txt'], 'utf8'));
    await assert.rejects(h.consume(h.created[1]), /fetch failed/);
    assert(h.body.children.every(link => link.removed));
    h.pagehide();
    assert.equal(h.revoked.filter(url => url === h.created[0]).length, 1);
    assert.equal(h.revoked.filter(url => url === h.created[1]).length, 1);
  });
}

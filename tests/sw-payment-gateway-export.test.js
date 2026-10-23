/* Exercises the genuine shared calculator and complete Swahili form/export runtime. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture(options = {}) {
  const nodes = new Map(), observers = new Map(), blobs = new Map(), downloads = [], copied = [], pendingCopies = [];
  let blobId = 0, submissions = 0;
  class Element {
    constructor(tag, id = '', value = '') {
      this.tagName = tag.toUpperCase(); this.id = id; this.value = value;
      this.children = []; this.parentNode = null; this.attributes = {}; this.listeners = {};
      this.hidden = false; this.disabled = false; this._text = ''; this._classes = new Set();
      this.classList = {
        add: n => { this._classes.add(n); this.changed(); },
        remove: n => { this._classes.delete(n); this.changed(); },
        contains: n => this._classes.has(n)
      };
      if (id) nodes.set(id, this);
    }
    changed() { for (const fn of observers.get(this) || []) fn(); }
    set className(x) { this._classes = new Set(x.split(/\s+/).filter(Boolean)); }
    get className() { return [...this._classes].join(' '); }
    set textContent(x) { this._text = String(x); this.children = []; }
    get textContent() { return this._text + this.children.map(x => x.textContent).join(''); }
    get innerText() { return this._text + this.children.map(x => x.innerText).join('\n'); }
    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k] ?? null; }
    appendChild(x) { this.children.push(x); x.parentNode = this; return x; }
    replaceChildren() { this.children = []; this._text = ''; }
    insertAdjacentElement(where, x) {
      assert.equal(where, 'afterend'); assert.ok(this.parentNode);
      const siblings = this.parentNode.children; siblings.splice(siblings.indexOf(this) + 1, 0, x); x.parentNode = this.parentNode;
    }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(x => x !== this); }
    matches(s) {
      if (s.startsWith('#')) return this.id === s.slice(1);
      if (s.startsWith('.')) return this.classList.contains(s.slice(1));
      if (s.startsWith('[')) return Object.hasOwn(this.attributes, s.slice(1, -1));
      return this.tagName.toLowerCase() === s;
    }
    querySelector(s) { return this.querySelectorAll(s)[0] || null; }
    querySelectorAll(s) {
      const found = []; for (const x of this.children) { if (x.matches(s)) found.push(x); found.push(...x.querySelectorAll(s)); } return found;
    }
    addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
    dispatch(name, extra = {}) {
      const event = { target: this, prevented: false, preventDefault() { this.prevented = true; }, ...extra };
      for (let n = this; n; n = n.parentNode) for (const fn of n.listeners[name] || []) fn(event);
      return event;
    }
    focus() { this.focused = true; }
    click() {
      if (this.disabled) return;
      if (this.tagName === 'A') downloads.push({ name: this.download, blob: blobs.get(this.href) });
      else this.dispatch('click');
    }
  }
  const body = new Element('body'); body.setAttribute('data-sw-fintech-payment-app', options.app || 'payment-gateway');
  const form = body.appendChild(new Element('form')); form.setAttribute('data-sw-fintech-payment-form', ''); form.setAttribute('data-calculate', 'calcGateway');
  form.checkValidity = () => options.nativeValid !== false;
  form.reportValidity = () => false;
  form.requestSubmit = () => { submissions++; form.dispatch('submit'); };
  const values = { 'pg-currency': 'KES', 'pg-avg-txn': '15000', 'pg-monthly-txns': '200' };
  for (let i = 1; i <= 3; i++) Object.assign(values, {
    ['pg-name-' + i]: 'Gateway ' + String.fromCharCode(64 + i),
    ['pg-rate-' + i]: ['1.5', '1.4', '2'][i - 1], ['pg-flat-' + i]: i === 1 ? '100' : '0', ['pg-cap-' + i]: i === 1 ? '2000' : '0'
  });
  const fields = [];
  for (const [id, value] of Object.entries(values)) fields.push(form.appendChild(new Element(id === 'pg-currency' ? 'select' : 'input', id, value)));
  const country = form.appendChild(new Element('select', 'context-country', 'KE')); country.selectedOptions = [{ textContent: 'Kenya' }];
  form.appendChild(new Element('p', 'pg-error')).className = 'form-error';
  const result = form.appendChild(new Element('div', 'pg-results')); result.className = 'results';
  for (const id of ['pg-winner-name', 'pg-winner-detail', 'pg-monthly-vol', 'pg-cheapest-fee', 'pg-most-exp', 'pg-annual-saving', 'pg-table-body']) result.appendChild(new Element('div', id));
  const info = body.appendChild(new Element('section')); info.className = 'info-box';
  info.appendChild(new Element('p')).textContent = 'Hili ni kadirio la kupanga, si bei ya mwisho. Hakiki VAT na masharti ya mtoa huduma.';
  const document = {
    body, documentElement: { lang: options.lang || 'sw' },
    getElementById: id => nodes.get(id),
    querySelector: s => s === '.info-box p' ? info.querySelector('p') : body.querySelector(s),
    querySelectorAll: s => s.includes('id^=') ? fields : body.querySelectorAll(s),
    createElement: tag => new Element(tag)
  };
  const navigator = {};
  if (options.copyMode !== 'missing') navigator.clipboard = { writeText: async text => {
    if (options.copyMode === 'deferred') return new Promise((resolve, reject) => pendingCopies.push({ text, resolve, reject }));
    if (options.copyMode === 'reject') throw new Error('synthetic permission denial');
    copied.push(text);
  } };
  const context = {
    document, navigator, Blob,
    location: { pathname: options.route || '/sw/zana/ada-za-payment-gateway/' },
    URL: { createObjectURL(blob) { const id = 'blob:synthetic-' + ++blobId; blobs.set(id, blob); return id; }, revokeObjectURL(id) { blobs.delete(id); } },
    setTimeout: () => 1,
    MutationObserver: class { constructor(fn) { this.fn = fn; } observe(node) { (observers.get(node) || (observers.set(node, []), observers.get(node))).push(this.fn); } },
    fetch() { throw new Error('No network in this fixture'); }
  };
  context.window = context;
  vm.createContext(context);
  const controller = process.env.GATEWAY_CONTROLLER || path.join(__dirname, '../assets/js/pages/fintech-shared-controllers/payment-gateway.js');
  const runtime = process.env.SW_PAYMENT_RUNTIME || path.join(__dirname, '../assets/js/pages/sw-fintech-payment-family.js');
  vm.runInContext(fs.readFileSync(controller, 'utf8'), context, { filename: controller });
  vm.runInContext(fs.readFileSync(runtime, 'utf8'), context, { filename: runtime });
  return {
    nodes, form, body, result, downloads, copied, country, pendingCopies,
    actions: () => body.querySelector('[data-sw-pg-actions]'),
    copy: () => body.querySelector('[data-sw-pg-copy]'),
    download: () => body.querySelector('[data-sw-pg-download]'),
    status: () => body.querySelector('[data-sw-pg-status]').textContent,
    submit: () => form.requestSubmit(), submissions: () => submissions,
    edit(id, value, event = 'input') { const n = nodes.get(id); n.value = value; n.dispatch(event); }
  };
}

test('exports start unavailable and stay outside Enter-to-calculate form', () => {
  const f = fixture(); assert.ok(f.actions()); assert.equal(f.actions().hidden, true); assert.equal(f.copy().disabled, true); assert.equal(f.download().disabled, true);
  assert.equal(f.actions().parentNode, f.body); assert.notEqual(f.actions().parentNode, f.form);
  f.download().click(); assert.equal(f.downloads.length, 0); assert.equal(f.submissions(), 0);
});

test('real calculated TXT includes current amount/count/country/quotes/costs and assumptions', async () => {
  const f = fixture(); f.submit(); assert.equal(f.result.classList.contains('on'), true); assert.equal(f.actions().hidden, false); assert.match(f.status(), /tayari kunakiliwa/);
  f.download().click(); assert.equal(f.downloads.length, 1); assert.equal(f.downloads[0].name, 'payment-gateway-ulinganisho.txt');
  const text = await f.downloads[0].blob.text();
  for (const v of ['Kenya', 'Sarafu: KES', 'KES 15000', 'Idadi ya miamala kwa mwezi: 200', 'Gateway B', 'KES 42,000.00', '1.5%', 'kikomo KES 2000', 'kadirio la kupanga']) assert.ok(text.includes(v), v);
});

test('amount, currency, country and quote edits retire all exports immediately', () => {
  for (const id of ['pg-avg-txn', 'pg-currency', 'context-country', 'pg-monthly-txns', 'pg-name-2', 'pg-rate-2', 'pg-flat-2', 'pg-cap-2']) {
    const f = fixture(); f.submit(); f.edit(id, f.nodes.get(id).value, id.includes('currency') || id === 'context-country' ? 'change' : 'input');
    assert.equal(f.result.classList.contains('on'), false, id); assert.equal(f.actions().hidden, true, id); assert.equal(f.download().disabled, true, id); assert.equal(f.copy().disabled, true, id);
    f.download().dispatch('click'); f.copy().dispatch('click'); assert.equal(f.downloads.length, 0, id); assert.equal(f.copied.length, 0, id);
  }
});

test('recalculation exports new currency and winner instead of prior comparison', async () => {
  const f = fixture(); f.submit(); f.download().click(); const oldText = await f.downloads[0].blob.text();
  f.edit('pg-avg-txn', '10000'); f.edit('pg-currency', 'GHS', 'change'); f.edit('pg-rate-2', '3'); f.submit(); f.download().click();
  const current = await f.downloads[1].blob.text(); assert.notEqual(current, oldText); assert.match(current, /GHS 10000/); assert.match(current, /Gateway C/); assert.match(current, /GHS 40,000.00/); assert.doesNotMatch(current, /KES/);
});

test('blank input cannot export; original form Enter calculation recovers', async () => {
  const f = fixture(); f.submit(); f.edit('pg-avg-txn', ''); f.submit(); assert.equal(f.actions().hidden, true); f.download().dispatch('click'); assert.equal(f.downloads.length, 0);
  f.edit('pg-avg-txn', '10000'); const event = f.nodes.get('pg-avg-txn').dispatch('keydown', { key: 'Enter' }); assert.equal(event.prevented, true);
  assert.equal(f.result.classList.contains('on'), true); f.download().click(); assert.match(await f.downloads[0].blob.text(), /KES 28,000.00/);
});

test('copy uses the latest valid comparison and reports success only after completion', async () => {
  const f = fixture(); f.submit(); f.edit('pg-currency', 'GHS', 'change'); f.edit('pg-avg-txn', '10000'); f.submit(); f.copy().click(); await Promise.resolve(); await Promise.resolve();
  assert.equal(f.copied.length, 1); assert.match(f.copied[0], /GHS 28,000.00/); assert.doesNotMatch(f.copied[0], /KES/); assert.match(f.status(), /yamenakiliwa/); assert.equal(f.submissions(), 2);
});

test('unavailable or denied clipboard tells visitor to use TXT without claiming success', async () => {
  for (const copyMode of ['missing', 'reject']) {
    const f = fixture({ copyMode }); f.submit(); f.copy().click(); await Promise.resolve(); await Promise.resolve();
    assert.equal(f.copied.length, 0); assert.match(f.status(), /Tumia Pakua TXT/); assert.doesNotMatch(f.status(), /yamenakiliwa/); f.download().click(); assert.equal(f.downloads.length, 1);
  }
});

test('no export UI is enrolled on other family apps, locales or route aliases', () => {
  for (const options of [{ app: 'merchant-fees' }, { app: 'pos-fees' }, { lang: 'fr' }, { route: '/tools/payment-gateway/' }]) assert.equal(fixture(options).actions(), null);
});


test('deferred clipboard outcomes cannot replace a new comparison or newer export status', async () => {
  const flush = () => new Promise(resolve => setImmediate(resolve));
  for (const outcome of ['resolve', 'reject']) {
    for (const next of ['edit-and-recalculate', 'recalculate-only', 'newer-copy', 'download']) {
      const f = fixture({ copyMode: 'deferred' });
      f.submit(); f.copy().click();
      const old = f.pendingCopies[0];
      assert.match(old.text, /KES 42,000.00/);
      if (next === 'edit-and-recalculate') {
        f.edit('pg-avg-txn', '10000'); f.edit('pg-currency', 'GHS', 'change'); f.submit();
        assert.match(f.nodes.get('pg-winner-detail').textContent, /GHS 28,000.00/);
      } else if (next === 'recalculate-only') {
        f.submit();
      } else if (next === 'newer-copy') {
        f.copy().click();
        assert.equal(f.pendingCopies.length, 2);
        const latest = f.pendingCopies[1];
        if (outcome === 'resolve') latest.reject(new Error('newer synthetic denial'));
        else latest.resolve();
        await flush();
        assert.match(f.status(), outcome === 'resolve' ? /hakukufaulu/ : /yamenakiliwa/);
      } else {
        f.download().click();
        assert.equal(f.downloads.length, 1);
        assert.match(f.status(), /TXT limeandaliwa/);
      }
      const currentStatus = f.status();
      if (next === 'edit-and-recalculate' || next === 'recalculate-only') assert.match(currentStatus, /tayari kunakiliwa/);
      if (outcome === 'resolve') old.resolve();
      else old.reject(new Error('old synthetic denial'));
      await flush();
      assert.equal(f.status(), currentStatus, next + ': stale ' + outcome);
      assert.equal(f.result.classList.contains('on'), true);
      assert.equal(f.actions().hidden, false);
    }
  }
});

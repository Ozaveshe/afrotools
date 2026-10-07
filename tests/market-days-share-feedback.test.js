const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function fixture(navigator = {}) {
  const nodes = new Map();
  const listeners = new Map();
  const pageListeners = new Map();
  const document = { activeElement: null };
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag; this.children = []; this.listeners = new Map();
      this.attributes = new Map(); this.value = ''; this.textContent = '';
      this.disabled = false; this.isConnected = true;
      this.style = { setProperty() {} };
    }
    set innerHTML(value) { this.children = []; }
    appendChild(child) { this.children.push(child); return child; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    addEventListener(type, callback) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(callback);
    }
    emit(type) {
      const results = (this.listeners.get(type) || []).map(callback => callback({ target: this, currentTarget: this }));
      return Promise.all(results);
    }
    querySelector(selector) {
      const date = selector.match(/^\[data-date-key="(.+)"\]$/)?.[1];
      return this.children.find(child => child.getAttribute('data-date-key') === date) || null;
    }
    focus() { document.activeElement = this; }
    scrollIntoView() {}
  }
  document.getElementById = id => {
    if (!nodes.has(id)) { const node = new Element(); node.id = id; nodes.set(id, node); }
    return nodes.get(id);
  };
  document.createElement = tag => new Element(tag);
  document.createDocumentFragment = () => new Element('fragment');
  document.addEventListener = (type, callback) => listeners.set(type, callback);
  const window = {
    AfroTools: { engines: {} }, location: new URL('https://local.test/tools/market-days/?date=2026-10-01'),
    addEventListener(type, callback) { pageListeners.set(type, callback); }
  };
  window.history = { replaceState(state, title, url) { window.location = new URL(url, window.location); } };
  const context = vm.createContext({ window, document, navigator, URLSearchParams, Intl, Date, Math, console });
  const root = path.resolve(__dirname, '..');
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/engines/igbo-market-days.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/pages/market-days.js'), 'utf8'), context);
  listeners.get('DOMContentLoaded')();
  return {
    node: id => document.getElementById(id),
    click: id => document.getElementById(id).emit('click'),
    date(value, event = 'change') { const node = document.getElementById('lookupDate'); node.value = value; return node.emit(event); },
    status: () => document.getElementById('shareStatus').textContent,
    hide: () => pageListeners.get('pagehide')(),
    location: () => window.location.href,
    document
  };
}

function held() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// Wait for the adapter's callback chain even when an older event handler returns no Promise.
const drainCallbacks = () => new Promise(resolve => setImmediate(resolve));

test('clipboard captures the date-only URL and confirms actual resolved success', async () => {
  const calls = [];
  const f = fixture({ clipboard: { writeText: value => { calls.push(value); return Promise.resolve(); } } });
  await f.click('shareView');
  assert.deepEqual(calls, ['https://local.test/tools/market-days/?date=2026-10-01']);
  assert.equal(f.status(), 'Link copied to clipboard.');
});

for (const mode of ['throw', 'reject']) {
  test(`clipboard ${mode} reports actionable manual recovery without rejecting the click`, async () => {
    const f = fixture({ clipboard: { writeText() { if (mode === 'throw') throw new Error('synthetic'); return Promise.reject(new Error('synthetic')); } } });
    await f.click('shareView');
    assert.equal(f.status(), 'Could not copy automatically. Copy this link manually: https://local.test/tools/market-days/?date=2026-10-01');
  });
}

test('unavailable clipboard retains the captured local URL for manual copying', async () => {
  const f = fixture(); await f.click('shareView');
  assert.equal(f.status(), 'Copy this URL from the address bar: https://local.test/tools/market-days/?date=2026-10-01');
});

test('share preserves its payload and confirms resolved success', async () => {
  let payload;
  const f = fixture({ share: value => { payload = value; return Promise.resolve(); } });
  await f.click('shareView');
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), { title: 'Igbo Market Day Finder', text: 'Check this verified Igbo market day lookup.', url: 'https://local.test/tools/market-days/?date=2026-10-01' });
  assert.equal(f.status(), 'Shared.');
});

for (const mode of ['throw', 'reject', 'cancel']) {
  test(`share ${mode} distinguishes cancellation from failure`, async () => {
    const f = fixture({ share() {
      const error = new Error('synthetic'); if (mode === 'cancel') error.name = 'AbortError';
      if (mode === 'throw') throw error; return Promise.reject(error);
    } });
    await f.click('shareView');
    assert.equal(f.status(), mode === 'cancel' ? 'Share cancelled.' : 'Could not share automatically. Copy this link manually: https://local.test/tools/market-days/?date=2026-10-01');
  });
}

for (const outcome of ['resolve', 'reject']) {
  test(`cleared date suppresses held clipboard ${outcome}`, async () => {
    const pending = held(); const f = fixture({ clipboard: { writeText: () => pending.promise } });
    const attempt = f.click('shareView'); await f.date('', 'input');
    assert.equal(f.status(), ''); pending[outcome](new Error('synthetic')); await attempt; await drainCallbacks();
    assert.equal(f.status(), '');
  });
}

test('date away and back invalidates the older Share even when the value matches again', async () => {
  const pending = held(); const f = fixture({ share: () => pending.promise });
  const attempt = f.click('shareView'); await f.date('2026-10-02'); await f.date('2026-10-01');
  assert.equal(f.location(), 'https://local.test/tools/market-days/?date=2026-10-01');
  pending.resolve(); await attempt; await drainCallbacks(); assert.equal(f.status(), '');
});

test('Today reset invalidates an older attempt and keeps current selection feedback empty', async () => {
  const pending = held(); const f = fixture({ clipboard: { writeText: () => pending.promise } });
  const attempt = f.click('shareView'); await f.click('useNigeriaToday'); pending.resolve(); await attempt; await drainCallbacks();
  assert.equal(f.status(), '');
});

test('new attempt wins over an older failure while preserving user-moved focus', async () => {
  const pending = held(); let calls = 0;
  const f = fixture({ clipboard: { writeText: () => ++calls === 1 ? pending.promise : Promise.resolve() } });
  const first = f.click('shareView'); f.node('marketSearch').focus(); await f.click('shareView');
  pending.reject(new Error('synthetic')); await first; await drainCallbacks();
  assert.equal(f.status(), 'Link copied to clipboard.'); assert.equal(f.document.activeElement.id, 'marketSearch');
});

test('pagehide suppresses pending completion', async () => {
  const pending = held(); const f = fixture({ share: () => pending.promise });
  const attempt = f.click('shareView'); f.hide(); pending.resolve(); await attempt; await drainCallbacks(); assert.equal(f.status(), '');
});

test('invalid or mismatched current field never starts an export', async () => {
  let calls = 0; const f = fixture({ clipboard: { writeText() { calls++; return Promise.resolve(); } } });
  await f.date('', 'input'); await f.click('shareView');
  // A programmatic field replacement can leave the controller's selection unchanged.
  f.node('lookupDate').value = '2026-10-02'; await f.click('shareView');
  assert.equal(calls, 0); assert.equal(f.status(), '');
});

test('valid date input exports the immediately updated selection', async () => {
  const calls = [];
  const f = fixture({ clipboard: { writeText(value) { calls.push(value); return Promise.resolve(); } } });
  await f.date('2026-10-02', 'input');
  await f.click('shareView');
  assert.deepEqual(calls, ['https://local.test/tools/market-days/?date=2026-10-02']);
  assert.equal(f.status(), 'Link copied to clipboard.');
});

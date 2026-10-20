const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function fixture(navigator = {}, options = {}) {
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
  // Product-event assertions load the maintained wrapper; gtag captures local
  // commands only and is not evidence that Google Analytics ingested an event.
  const analyticsCalls = [];
  const session = new Map();
  let consent = Object.hasOwn(options, 'consent') ? options.consent : 'accepted';
  const window = {
    AfroTools: { engines: {} }, location: new URL('https://local.test/tools/market-days/?date=2026-10-01'),
    addEventListener(type, callback) { pageListeners.set(type, callback); },
    localStorage: {
      getItem(key) { return key === 'afrotools_cookie_consent' ? consent : null; },
      removeItem() {}
    },
    sessionStorage: {
      getItem(key) { return session.get(key) ?? null; },
      setItem(key, value) { session.set(key, String(value)); }
    },
    gtag() { analyticsCalls.push(Array.from(arguments)); }
  };
  window.history = { replaceState(state, title, url) { window.location = new URL(url, window.location); } };
  const context = vm.createContext({ window, document, navigator, URLSearchParams, Intl, Date, Math, console });
  const root = path.resolve(__dirname, '..');
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/engines/igbo-market-days.js'), 'utf8'), context);
  if (options.analytics === 'library') {
    vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/lib/analytics.js'), 'utf8'), context);
  } else if (options.analytics === 'throw') {
    window.AfroTools.analytics = { trackShare() { throw new Error('synthetic analytics failure'); } };
  }
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/pages/market-days.js'), 'utf8'), context);
  listeners.get('DOMContentLoaded')();
  return {
    node: id => document.getElementById(id),
    click: id => document.getElementById(id).emit('click'),
    date(value, event = 'change') { const node = document.getElementById('lookupDate'); node.value = value; return node.emit(event); },
    status: () => document.getElementById('shareStatus').textContent,
    hide: () => pageListeners.get('pagehide')(),
    location: () => window.location.href,
    analyticsEvents: () => JSON.parse(JSON.stringify(analyticsCalls.filter(call => call[0] === 'event'))),
    setConsent(value) {
      consent = value;
      pageListeners.get('afrotools:cookie-consent')?.({ detail: { status: value } });
    },
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
  await f.date('2026-10-02', 'input'); await f.click('shareView');
  assert.equal(calls, 0); assert.equal(f.status(), '');
});

// These assertions prove page-to-wrapper behavior and accepted-only commands,
// not GA4 network delivery, property counts, or conversion uplift.
for (const method of ['native', 'clipboard']) {
  function navigatorFor(operation) {
    return method === 'native' ? { share: operation } : { clipboard: { writeText: operation } };
  }

  test(`${method} emits one metadata-only share_result after actual success`, async () => {
    const pending = held();
    const f = fixture(navigatorFor(() => pending.promise), { analytics: 'library', consent: 'accepted' });
    const attempt = f.click('shareView');
    assert.deepEqual(f.analyticsEvents(), [], 'choosing an action is not a successful share');
    pending.resolve(); await attempt;
    assert.deepEqual(f.analyticsEvents(), [['event', 'share_result', { tool_name: 'market-days', method }]]);
    assert.equal(f.status(), method === 'native' ? 'Shared.' : 'Link copied to clipboard.');
  });

  for (const consent of [null, 'declined']) {
    test(`${method} succeeds without product events when consent is ${consent ?? 'fresh'}`, async () => {
      const f = fixture(navigatorFor(() => Promise.resolve()), { analytics: 'library', consent });
      await f.click('shareView');
      assert.deepEqual(f.analyticsEvents(), []);
      assert.equal(f.status(), method === 'native' ? 'Shared.' : 'Link copied to clipboard.');
    });
  }

  test(`${method} respects consent withdrawn while the operation is pending`, async () => {
    const pending = held();
    const f = fixture(navigatorFor(() => pending.promise), { analytics: 'library', consent: 'accepted' });
    const attempt = f.click('shareView'); f.setConsent('declined');
    pending.resolve(); await attempt;
    assert.deepEqual(f.analyticsEvents(), []);
    assert.equal(f.status(), method === 'native' ? 'Shared.' : 'Link copied to clipboard.');
  });

  for (const failure of ['throw', 'reject', 'cancel']) {
    test(`${method} ${failure} never emits a successful-share event`, async () => {
      const f = fixture(navigatorFor(() => {
        const error = new Error('synthetic');
        if (failure === 'cancel') error.name = 'AbortError';
        if (failure === 'throw') throw error;
        return Promise.reject(error);
      }), { analytics: 'library', consent: 'accepted' });
      await f.click('shareView');
      assert.deepEqual(f.analyticsEvents(), []);
      assert.match(f.status(), method === 'native' && failure === 'cancel' ? /^Share cancelled/ : /^Could not (share|copy) automatically/);
    });
  }

  for (const invalidation of ['clear', 'away-back', 'pagehide']) {
    test(`${method} suppresses stale success after ${invalidation}`, async () => {
      const pending = held();
      const f = fixture(navigatorFor(() => pending.promise), { analytics: 'library', consent: 'accepted' });
      const attempt = f.click('shareView');
      if (invalidation === 'clear') await f.date('', 'input');
      else if (invalidation === 'away-back') { await f.date('2026-10-02'); await f.date('2026-10-01'); }
      else f.hide();
      pending.resolve(); await attempt;
      assert.deepEqual(f.analyticsEvents(), []);
      assert.equal(f.status(), '');
    });
  }

  for (const analytics of ['missing', 'throw']) {
    test(`${method} remains successful with ${analytics} analytics`, async () => {
      const f = fixture(navigatorFor(() => Promise.resolve()), { analytics });
      await f.click('shareView');
      assert.equal(f.status(), method === 'native' ? 'Shared.' : 'Link copied to clipboard.');
      assert.deepEqual(f.analyticsEvents(), []);
    });
  }
}

test('unavailable export and invalid date emit no product event with the actual wrapper', async () => {
  const missing = fixture({}, { analytics: 'library', consent: 'accepted' });
  await missing.click('shareView');
  assert.deepEqual(missing.analyticsEvents(), []);
  let exports = 0;
  const invalid = fixture({ clipboard: { writeText() { exports++; return Promise.resolve(); } } }, { analytics: 'library', consent: 'accepted' });
  await invalid.date('', 'input'); await invalid.click('shareView');
  assert.equal(exports, 0); assert.deepEqual(invalid.analyticsEvents(), []);
});

test('new successful attempt is measured once while an older native success becomes stale', async () => {
  const pending = held(); let operations = 0;
  const f = fixture({ share: () => ++operations === 1 ? pending.promise : Promise.resolve() }, { analytics: 'library', consent: 'accepted' });
  const first = f.click('shareView'); await f.click('shareView');
  pending.resolve(); await first;
  assert.deepEqual(f.analyticsEvents(), [['event', 'share_result', { tool_name: 'market-days', method: 'native' }]]);
});

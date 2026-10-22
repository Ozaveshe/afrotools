const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const consentSource = fs.readFileSync(path.join(__dirname, '../assets/js/components/analytics-consent-v2.js'), 'utf8');
const installSource = fs.readFileSync(path.join(__dirname, '../assets/js/pwa-install.js'), 'utf8');
const CONSENT = 'afrotools_cookie_consent';
const DISMISSED = 'afro_pwa_dismissed';

// Full maintained scripts run with a synthetic DOM, capability event, storage,
// animation-frame queue and observer delivery. Geometry below is a deterministic
// flow model for the scroll-anchor algorithm, not a browser/CSS measurement.
// No network, worker, native prompt, telemetry endpoint or real storage is used.
function page({ choice, bodyReady = true, wrapped = false, lang = 'sw', consentPersistenceFails = false, smoothPage = false, firstChoiceOffset = 0, choiceHeight = 0 } = {}) {
  const store = new Map(choice ? [[CONSENT, choice]] : []);
  const writes = [], events = [], analytics = [], timers = [], frames = [], observers = [];
  const properties = new Map();
  const smoothAnimations = [];
  let pendingMutation = false;
  let document;
  const window = {
    location: { pathname: `/${lang}/tools/` }, scrollX: 0, scrollY: 0, innerWidth: 375, innerHeight: 812,
    requestAnimationFrame(fn) { frames.push(fn); },
    scrollBy(x, y) {
      const options = typeof x === 'object' ? x : { left: x, top: y };
      scrollTarget(this.scrollX + (options.left || 0), this.scrollY + (options.top || 0), options.behavior);
    },
    scrollTo(x, y) {
      const options = typeof x === 'object' ? x : { left: x, top: y };
      scrollTarget(options.left || 0, options.top || 0, options.behavior);
    }
  };
  function scrollTarget(left, top, behavior) {
    top = Math.max(0, top);
    if (smoothPage && behavior !== 'instant') smoothAnimations.push({ left, top, remaining: 8 });
    else { smoothAnimations.length = 0; window.scrollX = left; window.scrollY = top; }
  }
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, fn, options) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push({ fn, once: options?.once });
    }
    removeEventListener(type, fn) { this.listeners.set(type, (this.listeners.get(type) || []).filter(row => row.fn !== fn)); }
    dispatchEvent(event) {
      event.target ||= this;
      for (const row of [...(this.listeners.get(event.type) || [])]) {
        if (row.once) this.removeEventListener(event.type, row.fn);
        row.fn(event);
      }
      return !event.defaultPrevented;
    }
  }
  class Element extends Target {
    constructor(tag) { super(); this.tagName = tag.toUpperCase(); this.children = []; this.parentNode = null; this.attrs = new Map(); this.id = ''; this.height = tag === 'afro-navbar' ? 56 : 0; }
    setAttribute(name, value) { this.attrs.set(name, value); if (name === 'id') this.id = value; }
    getAttribute(name) { return this.attrs.get(name) ?? null; }
    get firstChild() { return this.children[0] || null; }
    get nextSibling() { return this.parentNode?.children[this.parentNode.children.indexOf(this) + 1] || null; }
    get isConnected() { return this === body || this === head || !!this.parentNode?.isConnected; }
    appendChild(node) { return this.insertBefore(node, null); }
    insertBefore(node, reference) {
      if (reference && !this.children.includes(reference)) throw new Error('Invalid insertion reference');
      if (node.parentNode) node.parentNode.removeChild(node);
      const index = reference ? this.children.indexOf(reference) : this.children.length;
      this.children.splice(index, 0, node); node.parentNode = this; pendingMutation = true; return node;
    }
    removeChild(node) {
      const index = this.children.indexOf(node); assert.ok(index >= 0);
      this.children.splice(index, 1); node.parentNode = null; pendingMutation = true;
      if (node.contains(document.activeElement)) document.activeElement = body;
      return node;
    }
    remove() { this.parentNode?.removeChild(this); }
    contains(node) { return this === node || this.children.some(child => child.contains(node)); }
    closest(selector) {
      if (selector === '[data-afro-flow-notice]' && this.attrs.has('data-afro-flow-notice')) return this;
      if (selector === '[data-afro-cookie-consent-open]' && this.attrs.has('data-afro-cookie-consent-open')) return this;
      return this.parentNode?.closest?.(selector) || null;
    }
    focus() { document.activeElement = this; document.dispatchEvent({ type: 'focusin', target: this }); }
    scrollIntoView(options) {
      const rect = this.getBoundingClientRect();
      if (options?.block === 'nearest') {
        if (rect.top < 76) window.scrollBy({ left: 0, top: rect.top - 76, behavior: options?.behavior });
        else if (rect.bottom > window.innerHeight) window.scrollBy({ left: 0, top: rect.bottom - window.innerHeight, behavior: options?.behavior });
      } else window.scrollBy({ left: 0, top: rect.top - 76, behavior: options?.behavior });
    }
    getBoundingClientRect() {
      // Only marked flow notices contribute height in this fixture. A fixed
      // baseline notice therefore leaves the modeled tool offset unchanged.
      const flowHeight = node => node.id.startsWith('afro-') && node.attrs.has('data-afro-flow-notice') ? 120 : node.height;
      let top = this.offset || 0, branch = this;
      while (branch.parentNode) {
        for (const sibling of branch.parentNode.children) { if (sibling === branch) break; top += flowHeight(sibling); }
        top += branch.parentNode.offset || 0; branch = branch.parentNode;
      }
      return { top: top - window.scrollY, bottom: top - window.scrollY + flowHeight(this), height: flowHeight(this) || 100 };
    }
    set innerHTML(value) {
      this.html = value; this.children = [];
      for (const match of value.matchAll(/<(button|a)\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
        const child = new Element(match[1]);
        for (const attribute of match[2].matchAll(/([\w-]+)="([^"]*)"/g)) child.setAttribute(attribute[1], attribute[2]);
        if (child.id === 'afro-analytics-consent-accept') { child.offset = firstChoiceOffset; child.height = choiceHeight; }
        this.appendChild(child);
      }
    }
    get innerHTML() { return this.html || ''; }
  }
  const body = new Element('body'), head = new Element('head');
  const skip = new Element('a'), nav = new Element('afro-navbar'), main = new Element('main');
  const input = new Element('input'), result = new Element('output'), reopen = new Element('button');
  skip.height = 0; main.height = 900; input.offset = 300; result.offset = 420; reopen.offset = 600;
  input.value = '1250'; result.textContent = 'Calculated result'; reopen.setAttribute('data-afro-cookie-consent-open', '');
  main.appendChild(input); main.appendChild(result); main.appendChild(reopen);
  body.appendChild(skip);
  if (wrapped) { const wrapper = new Element('div'); wrapper.appendChild(nav); wrapper.appendChild(main); body.appendChild(wrapper); }
  else { body.appendChild(nav); body.appendChild(main); }
  document = new Target();
  Object.assign(document, {
    body: bodyReady ? body : null, head, activeElement: body,
    documentElement: { lang, style: { setProperty: (k, v) => properties.set(k, v), removeProperty: k => properties.delete(k) } },
    createElement: tag => new Element(tag),
    getElementById(id) { return find(body, node => node.id === id) || find(head, node => node.id === id); },
    querySelector(selector) {
      if (selector.startsWith('link[') || selector.startsWith('meta[')) return {};
      if (selector === 'afro-navbar') return nav;
      if (selector === 'main,[role="main"]') return main;
      return null;
    },
    elementFromPoint() { return result; }
  });
  function find(node, predicate) { if (predicate(node)) return node; for (const child of node.children) { const found = find(child, predicate); if (found) return found; } return null; }
  const windowTarget = new Target();
  for (const method of ['addEventListener', 'removeEventListener', 'dispatchEvent']) window[method] = windowTarget[method].bind(windowTarget);
  window.localStorage = { getItem: key => store.get(key) || null, setItem(key, value) { if (key === CONSENT && consentPersistenceFails) throw new Error('Synthetic storage unavailable'); store.set(key, value); writes.push([key, value]); } };
  window.addEventListener('afrotools:cookie-consent', event => events.push(event.detail.status));
  class Observer {
    constructor(callback) { this.callback = callback; this.connected = false; observers.push(this); }
    observe() { this.connected = true; }
    disconnect() { this.connected = false; }
  }
  const context = vm.createContext({ window, document, localStorage: window.localStorage, navigator: {},
    MutationObserver: Observer, ResizeObserver: Observer,
    customElements: { whenDefined: () => Promise.resolve() },
    CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    setTimeout(callback, delay) { timers.push({ callback, delay }); }, gtag: (...args) => analytics.push(args)
  });
  const loadConsent = () => vm.runInContext(consentSource, context, { filename: 'analytics-consent-v2.js' });
  const loadInstall = () => vm.runInContext(installSource, context, { filename: 'pwa-install.js' });
  function flush() {
    for (let step = 0; step < 20; step++) {
      const changed = pendingMutation; pendingMutation = false;
      if (changed) for (const observer of [...observers]) if (observer.connected) observer.callback([]);
      const batch = frames.splice(0); for (const callback of batch) callback();
      if (!pendingMutation && !frames.length) return;
    }
    throw new Error('Unbounded fixture scheduling');
  }
  function click(id) { const target = document.getElementById(id); assert.ok(target, `Missing ${id}`); target.focus(); return Promise.all((target.listeners.get('click') || []).map(row => row.fn({ type: 'click', target }))); }
  function offer(outcome = 'accepted') {
    let calls = 0;
    const event = { type: 'beforeinstallprompt', prevented: false, preventDefault() { this.prevented = true; }, prompt() { calls++; }, userChoice: Promise.resolve({ outcome }) };
    window.dispatchEvent(event); return { event, calls: () => calls };
  }
  return { window, document, body, nav, main, input, result, reopen, store, writes, events, analytics, properties, observers,
    loadConsent, loadInstall, flush, click, offer,
    renderFrames(count) {
      for (let index = 0; index < count; index++) {
        const batch = frames.splice(0); for (const callback of batch) callback();
        for (const animation of [...smoothAnimations]) {
          window.scrollX += (animation.left - window.scrollX) / animation.remaining;
          window.scrollY += (animation.top - window.scrollY) / animation.remaining;
          if (--animation.remaining === 0) smoothAnimations.splice(smoothAnimations.indexOf(animation), 1);
        }
      }
    },
    runDelay() { for (const timer of timers.splice(0)) { assert.equal(timer.delay, 3000); timer.callback(); } flush(); },
    ready() { document.body = body; document.dispatchEvent({ type: 'DOMContentLoaded' }); flush(); }
  };
}

test('automatic consent enters flow after the real navbar without moving main, stealing focus or changing a tool', () => {
  const p = page(); p.input.focus(); const main = p.main, top = p.input.getBoundingClientRect().top;
  p.loadConsent(); p.flush();
  const banner = p.document.getElementById('afro-cookie-consent');
  assert.equal(p.nav.nextSibling, banner); assert.equal(banner.nextSibling, main);
  assert.equal(p.document.activeElement, p.input); assert.equal(p.input.getBoundingClientRect().top, top);
  assert.equal(p.input.value, '1250'); assert.equal(p.result.textContent, 'Calculated result');
  assert.equal(p.store.has(CONSENT), false); assert.deepEqual(p.writes, []); assert.deepEqual(p.events, []);
  assert.equal(banner.getAttribute('role'), 'region'); assert.equal(banner.getAttribute('aria-modal'), null);
  assert.equal(p.input.disabled, undefined); assert.equal(p.main.inert, undefined);
});

for (const [id, status] of [['afro-cc-decline', 'declined'], ['afro-analytics-consent-accept', 'accepted']]) {
  test(`${status}: optional install waits for a real consent choice, without silently saving, dismissing or prompting`, async () => {
    const p = page(); p.loadConsent(); p.loadInstall(); const event = p.offer(); p.runDelay();
    assert.equal(p.document.getElementById('afro-pwa-banner'), null);
    assert.equal(event.event.prevented, true); assert.equal(event.calls(), 0);
    assert.deepEqual(p.writes, []); assert.deepEqual(p.events, []); assert.equal(p.store.has(DISMISSED), false);
    assert.ok(p.observers.some(observer => observer.connected));
    await p.click(id); p.flush();
    assert.equal(p.store.get(CONSENT), status); assert.deepEqual(p.writes, [[CONSENT, status]]); assert.deepEqual(p.events, [status]);
    assert.equal(p.document.getElementById('afro-cookie-consent'), null);
    assert.equal(p.nav.nextSibling.id, 'afro-pwa-banner'); assert.equal(p.nav.nextSibling.nextSibling, p.main);
    assert.ok(p.observers.every(observer => !observer.connected)); assert.equal(event.calls(), 0);
    await p.click('afro-pwa-close'); p.flush();
    assert.equal(p.store.get(DISMISSED), '1'); assert.equal(p.store.get(CONSENT), status); assert.deepEqual(p.analytics, []);
  });
}

test('explicit reopen focuses choices and returns the opener/view after close or a choice, including repeated reopen', async () => {
  const p = page({ choice: 'declined' }); p.loadConsent(); p.reopen.focus(); p.window.scrollY = 480;
  p.window.AfroTools.analyticsConsent.open();
  assert.equal(p.document.activeElement.id, 'afro-analytics-consent-accept');
  p.window.AfroTools.analyticsConsent.open(); p.flush();
  await p.click('afro-cc-close'); p.flush();
  assert.equal(p.document.activeElement, p.reopen); assert.equal(p.window.scrollY, 480); assert.deepEqual(p.writes, []);
  p.document.dispatchEvent({ type: 'click', target: p.reopen, preventDefault() {} });
  await p.click('afro-analytics-consent-accept'); p.flush();
  assert.equal(p.document.activeElement, p.reopen); assert.equal(p.window.scrollY, 480);
  assert.deepEqual(p.writes, [[CONSENT, 'accepted']]); assert.deepEqual(p.events, ['accepted']);
});

test('PWA insertion/removal anchors an active result and preserves the original install outcome lifecycle', async () => {
  const p = page({ choice: 'declined' }); p.loadConsent(); p.loadInstall();
  p.input.focus(); p.window.scrollY = 210; const top = p.input.getBoundingClientRect().top;
  const old = p.offer('dismissed'), latest = p.offer('accepted'); p.runDelay();
  assert.equal(p.input.getBoundingClientRect().top, top); assert.equal(p.document.activeElement, p.input);
  const handler = p.document.getElementById('afro-pwa-install').listeners.get('click')[0].fn;
  await p.click('afro-pwa-install'); p.flush(); await handler();
  assert.equal(old.calls(), 0); assert.equal(latest.calls(), 1);
  assert.equal(p.document.getElementById('afro-pwa-banner'), null); assert.equal(p.document.activeElement, p.input);
  assert.equal(p.input.getBoundingClientRect().top, top);
  assert.equal(JSON.stringify(p.analytics), JSON.stringify([['event', 'pwa_install', { outcome: 'accepted' }]]));
  assert.deepEqual(p.writes, []); assert.equal(p.store.has(DISMISSED), false);
});

test('late consent and explicit reopen remain separate flow regions while keeping PWA controls and tool identity', async () => {
  const p = page({ choice: 'declined' }); p.loadInstall(); const offered = p.offer(); p.runDelay();
  const install = p.document.getElementById('afro-pwa-banner'); p.loadConsent(); p.reopen.focus();
  p.window.dispatchEvent({ type: 'afrotools:open-cookie-consent' });
  const consent = p.document.getElementById('afro-cookie-consent');
  assert.equal(p.nav.nextSibling, consent); assert.equal(consent.nextSibling, install); assert.equal(install.nextSibling, p.main);
  assert.ok(p.document.getElementById('afro-pwa-close').isConnected); assert.equal(offered.calls(), 0);
  await p.click('afro-cc-close'); p.flush();
  assert.equal(p.document.getElementById('afro-pwa-banner'), install); assert.deepEqual(p.writes, []);
});

test('DOMContentLoaded deferral and a dismissal made while waiting never cause an extra prompt or persistent consent write', async () => {
  const p = page({ bodyReady: false }); p.loadConsent(); p.loadInstall(); const offer = p.offer(); p.runDelay();
  assert.equal(p.document.getElementById('afro-cookie-consent'), null); assert.equal(p.document.getElementById('afro-pwa-banner'), null);
  p.ready(); assert.ok(p.document.getElementById('afro-cookie-consent')); assert.equal(p.document.getElementById('afro-pwa-banner'), null);
  p.store.set(DISMISSED, '1'); await p.click('afro-cc-decline'); p.flush();
  assert.equal(p.document.getElementById('afro-pwa-banner'), null); assert.equal(offer.calls(), 0);
  assert.ok(p.observers.every(observer => !observer.connected)); assert.deepEqual(p.writes, [[CONSENT, 'declined']]);
});

test('a navbar/main wrapper is retained and notices never reparent the tool to create their anchor', () => {
  const p = page({ wrapped: true }); const parent = p.main.parentNode; p.loadConsent(); p.flush();
  const notice = p.document.getElementById('afro-cookie-consent');
  assert.equal(p.main.parentNode, parent); assert.equal(p.nav.parentNode, parent); assert.equal(notice.parentNode, p.body);
  assert.equal(notice.nextSibling, parent); assert.equal(p.document.activeElement, p.body);
});

for (const consentPersistenceFails of [false, true]) {
  test(`late consent loader defers PWA until a real choice, persistence failure=${consentPersistenceFails}`, async () => {
    const p = page({ consentPersistenceFails }); p.loadInstall(); const offer = p.offer(); p.runDelay();
    assert.equal(p.document.getElementById('afro-pwa-banner'), null);
    assert.deepEqual(p.writes, []); assert.equal(offer.calls(), 0);
    p.input.focus(); p.loadConsent(); p.flush();
    assert.ok(p.document.getElementById('afro-cookie-consent')); assert.equal(p.document.getElementById('afro-pwa-banner'), null);
    assert.equal(p.document.activeElement, p.input);
    await p.click('afro-cc-decline'); p.flush();
    assert.equal(p.document.getElementById('afro-cookie-consent'), null);
    assert.ok(p.document.getElementById('afro-pwa-banner')); assert.equal(offer.calls(), 0);
    assert.deepEqual(p.events, ['declined']); assert.equal(p.store.get(CONSENT), consentPersistenceFails ? undefined : 'declined');
    assert.deepEqual(p.writes, consentPersistenceFails ? [] : [[CONSENT, 'declined']]);
    assert.equal(p.store.has(DISMISSED), false); assert.ok(p.observers.every(observer => !observer.connected));
  });
}

test('dismiss tracks a newly focused tool field after PWA insertion and detaches its focus listener', async () => {
  const p = page({ choice: 'declined' }); p.loadConsent(); p.loadInstall(); p.input.focus();
  p.offer(); p.runDelay();
  // The visitor moves from the field active at insertion to a different tool
  // control, then activates the notice's close control. Restore this new control.
  const second = p.document.createElement('input'); second.value = '250'; second.offset = 360;
  p.main.appendChild(second); second.focus(); const top = second.getBoundingClientRect().top;
  await p.click('afro-pwa-close'); p.flush();
  assert.equal(p.document.activeElement, second);
  assert.equal(second.getBoundingClientRect().top, top); assert.equal(second.value, '250');
  assert.equal((p.document.listeners.get('focusin') || []).length, 0);
  assert.equal(p.input.value, '1250'); assert.equal(p.result.textContent, 'Calculated result');
  assert.deepEqual(p.writes, [[DISMISSED, '1']]); assert.deepEqual(p.events, []);
});

test('notice anchoring and repeated reopen remain visible after two frames on a smooth-scrolling page', async () => {
  const p = page({ smoothPage: true }); p.window.scrollY = 200; p.input.focus();
  const top = p.input.getBoundingClientRect().top; p.loadConsent(); p.renderFrames(2);
  assert.equal(p.input.getBoundingClientRect().top, top, 'Automatic reflow must preserve the active tool without animation');
  await p.click('afro-cc-decline'); p.flush(); p.reopen.focus(); p.window.scrollY = 480;
  p.window.AfroTools.analyticsConsent.open(); p.window.AfroTools.analyticsConsent.open(); p.renderFrames(2);
  const accept = p.document.getElementById('afro-analytics-consent-accept');
  assert.equal(p.document.activeElement, accept);
  assert.ok(accept.getBoundingClientRect().top >= 56 && accept.getBoundingClientRect().bottom <= 812);
  await p.click('afro-cc-close'); p.renderFrames(2);
  assert.equal(p.document.activeElement, p.reopen); assert.equal(p.window.scrollY, 480);
  assert.deepEqual(p.writes, [[CONSENT, 'declined']]);
});

test('explicit reopen visibly focuses the first choice when a returned-choice card is taller than the viewport', () => {
  const p = page({ choice: 'declined', smoothPage: true, firstChoiceOffset: 600, choiceHeight: 400 });
  p.loadConsent(); p.reopen.focus(); p.window.scrollY = 480;
  p.window.AfroTools.analyticsConsent.open(); p.renderFrames(2);
  const first = p.document.getElementById('afro-analytics-consent-accept'), rect = first.getBoundingClientRect();
  assert.equal(p.document.activeElement, first);
  assert.ok(rect.top >= 56 && rect.bottom <= 812, 'Focused choice must be visible rather than only its parent card');
  assert.equal(p.store.get(CONSENT), 'declined'); assert.deepEqual(p.writes, []); assert.deepEqual(p.events, []);
});

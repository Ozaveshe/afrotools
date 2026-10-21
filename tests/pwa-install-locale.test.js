const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/pwa-install.js'), 'utf8');

// Exercise the complete maintained script with synthetic browser capabilities.
// This fixture proves label selection and event/state behavior, not layout or
// native installation, and never starts a browser, worker, server or network.
function runPage({ pathname = '/', lang = 'en', navigatorLanguage = 'en-US', dismissed = false } = {}) {
  const ids = new Map();
  const listeners = new Map();
  const timers = [];
  const storage = new Map(dismissed ? [['afro_pwa_dismissed', '1']] : []);
  const properties = new Map();
  const analytics = [];
  const observers = [];
  const banners = [];
  class Element {
    constructor(tag) { this.tagName = tag; this.handlers = new Map(); this.isConnected = false; }
    set innerHTML(value) {
      this.html = value;
      for (const match of value.matchAll(/id="([^"]+)"/g)) {
        const child = new Element('button');
        child.id = match[1];
        ids.set(child.id, child);
      }
    }
    get innerHTML() { return this.html; }
    addEventListener(name, callback) { this.handlers.set(name, callback); }
    getBoundingClientRect() { return { height: 100 }; }
    remove() { this.isConnected = false; ids.delete(this.id); }
  }
  class Observer {
    constructor() { this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const window = {
    location: { pathname },
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(callback);
    },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); }
  };
  const document = {
    documentElement: {
      lang,
      style: {
        setProperty(key, value) { properties.set(key, value); },
        removeProperty(key) { properties.delete(key); }
      }
    },
    querySelector(selector) { return selector.startsWith('link[') || selector.startsWith('meta[') ? {} : null; },
    getElementById(id) { return ids.get(id) || null; },
    createElement(tag) { return new Element(tag); },
    head: { appendChild() { throw new Error('Existing manifest/theme fixture must be retained'); } },
    body: {
      appendChild(element) {
        element.isConnected = true;
        ids.set(element.id, element);
        banners.push(element);
      }
    }
  };
  const context = vm.createContext({
    window, document,
    navigator: { language: navigatorLanguage, languages: [navigatorLanguage] },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    MutationObserver: Observer,
    ResizeObserver: Observer,
    customElements: { whenDefined: () => Promise.resolve() },
    setTimeout(callback, delay) { timers.push({ callback, delay }); },
    gtag: (...args) => analytics.push(args)
  });
  vm.runInContext(source, context, { filename: 'pwa-install.js' });
  function offer(outcome = 'dismissed') {
    let calls = 0;
    const event = {
      prevented: false,
      preventDefault() { this.prevented = true; },
      prompt() { calls++; },
      userChoice: Promise.resolve({ outcome })
    };
    for (const callback of listeners.get('beforeinstallprompt')) callback(event);
    return { event, promptCalls: () => calls };
  }
  return {
    ids, timers, storage, properties, analytics, observers, banners, listeners, offer,
    show() { for (const timer of timers.splice(0)) { assert.equal(timer.delay, 3000); timer.callback(); } },
    click(id) { return ids.get(id).handlers.get('click')(); }
  };
}

test('Swahili catalogue route uses native install labels despite English HTML/browser defaults', () => {
  const page = runPage({ pathname: '/sw/zana-zote/', navigatorLanguage: 'en-GB' });
  const offer = page.offer();
  assert.equal(offer.event.prevented, true);
  assert.equal(page.banners.length, 0);
  page.show();
  const banner = page.banners[0];
  assert.equal(banner.lang, 'sw');
  assert.match(banner.innerHTML, /<strong>Sakinisha AfroTools<\/strong>/);
  assert.match(banner.innerHTML, /id="afro-pwa-install">Sakinisha<\/button>/);
  assert.match(banner.innerHTML, /Ongeza AfroTools kwenye kifaa chako ili uifikie kwa urahisi\./);
  assert.doesNotMatch(banner.innerHTML, /zana zote|bila mtandao/);
  assert.match(banner.innerHTML, /aria-label="Funga"/);
  assert.doesNotMatch(banner.innerHTML, /Quick access to all tools|aria-label="Dismiss"/);
  assert.equal(offer.promptCalls(), 0);
});

for (const [locale, title, close, purpose] of [
  ['fr', 'Installer AfroTools', 'Fermer', /Ajoutez AfroTools à votre appareil pour y accéder facilement\./],
  ['ha', 'Shigar da AfroTools', 'Rufe', /Ƙara AfroTools a na'urarka don buɗe shi cikin sauƙi\./],
  ['yo', 'Fi AfroTools sí ẹ̀rọ', 'Pa Dé', /Fi AfroTools sí ẹ̀rọ rẹ fún lílò tó rọrùn\./]
]) {
  test(`${locale} public route overrides a conflicting Swahili HTML/browser language`, () => {
    const page = runPage({ pathname: `/${locale}/`, lang: 'sw', navigatorLanguage: 'sw-KE' });
    page.offer(); page.show();
    const banner = page.banners[0];
    assert.equal(banner.lang, locale);
    assert.ok(banner.innerHTML.includes(`<strong>${title}</strong>`));
    assert.ok(banner.innerHTML.includes(`aria-label="${close}"`));
    assert.match(banner.innerHTML, purpose);
    assert.doesNotMatch(banner.innerHTML, /Quick access to all tools/);
  });
}

test('unprefixed native page uses its regional HTML language instead of navigator preference', () => {
  // The default locale has an empty route prefix, not /en. Match the navbar
  // contract for that unrecognized path segment as well as ordinary routes.
  for (const pathname of ['/tools/example/', '/en/example/']) {
    const page = runPage({ pathname, lang: 'sw-KE', navigatorLanguage: 'fr-FR' });
    page.offer(); page.show();
    assert.equal(page.banners[0].lang, 'sw');
    assert.match(page.banners[0].innerHTML, /Sakinisha AfroTools/);
  }
});

test('English and unsupported pages retain original controls with accurate install-purpose body', () => {
  for (const lang of ['en', 'hy', 'pt', '__proto__', '<img src=x onerror=alert(1)>']) {
    const page = runPage({ pathname: '/tools/example/', lang, navigatorLanguage: 'sw-KE' });
    page.offer(); page.show();
    const banner = page.banners[0];
    assert.equal(banner.lang, 'en');
    assert.match(banner.innerHTML, /<strong>Install AfroTools<\/strong>/);
    assert.match(banner.innerHTML, /Add AfroTools to your device for easy access\./);
    assert.match(banner.innerHTML, /id="afro-pwa-install">Install<\/button>/);
    assert.match(banner.innerHTML, /aria-label="Dismiss"/);
    assert.doesNotMatch(banner.innerHTML, /onerror=|Quick access to all tools|even offline/);
  }
});

test('dismissal preserves existing storage key, observer cleanup and future suppression', () => {
  const page = runPage({ pathname: '/sw/' });
  page.offer(); page.show();
  assert.equal(page.properties.get('--afro-pwa-banner-clearance'), '128px');
  page.click('afro-pwa-close');
  assert.equal(page.storage.get('afro_pwa_dismissed'), '1');
  assert.equal(page.ids.has('afro-pwa-banner'), false);
  assert.equal(page.properties.has('--afro-pwa-banner-clearance'), false);
  assert.ok(page.observers.every(observer => observer.disconnected));
  assert.equal(page.listeners.get('resize').size, 0);
  page.offer(); page.show();
  assert.equal(page.banners.length, 1);
  assert.deepEqual(page.analytics, []);
  const alreadyDismissed = runPage({ pathname: '/sw/', dismissed: true });
  alreadyDismissed.offer(); alreadyDismissed.show();
  assert.equal(alreadyDismissed.banners.length, 0);
});

test('localized install retains one prompt call, outcome analytics and event-state cleanup', async () => {
  const page = runPage({ pathname: '/sw/' });
  const offer = page.offer('accepted'); page.show();
  const install = page.ids.get('afro-pwa-install').handlers.get('click');
  await install();
  await install();
  assert.equal(offer.promptCalls(), 1);
  assert.equal(page.ids.has('afro-pwa-banner'), false);
  assert.equal(page.properties.has('--afro-pwa-banner-clearance'), false);
  assert.ok(page.observers.every(observer => observer.disconnected));
  assert.equal(page.storage.has('afro_pwa_dismissed'), false);
  assert.equal(JSON.stringify(page.analytics), JSON.stringify([['event', 'pwa_install', { outcome: 'accepted' }]]));
});

test('repeated capability events keep a single banner and use the latest install event', async () => {
  const page = runPage({ pathname: '/fr/' });
  const first = page.offer();
  const latest = page.offer('accepted');
  page.show();
  assert.equal(page.banners.length, 1);
  await page.click('afro-pwa-install');
  assert.equal(first.promptCalls(), 0);
  assert.equal(latest.promptCalls(), 1);
});

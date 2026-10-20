'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');

function controller(html) {
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)]
    .map(match => match[1]).find(text => text.includes("var input    = document.getElementById('hero-search-input')"));
  assert.ok(script, 'Actual homepage inline controller must exist');
  const marker = script.indexOf("var input    = document.getElementById('hero-search-input')");
  const candidates = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionExpression' && node.start < marker && node.end > marker) candidates.push(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(acorn.parse(script, { ecmaVersion: 'latest' }));
  candidates.sort((a, b) => a.end - a.start - (b.end - b.start));
  assert.ok(candidates.length);
  return '(' + script.slice(candidates[0].start, candidates[0].end) + ')();';
}

// Synthetic DOM/event/timer surfaces only. The entire real search controller,
// including scoring, rendering, routing and listeners, is executed unchanged.
// This does not emulate browser layout or assistive technology.
function mount(options = {}) {
  const html = fs.readFileSync(process.env.AFROTOOLS_HOME_SEARCH_SOURCE || path.join(__dirname, '..', 'index.html'), 'utf8');
  const timers = new Map(), scripts = [], docHandlers = {}, winHandlers = {};
  let timerId = 0;
  let document;
  class Element {
    constructor(attrs = {}) {
      this.attrs = { ...attrs }; this.handlers = {}; this.value = '';
      this.children = []; this._html = ''; this.dataset = {};
      for (const [key, value] of Object.entries(attrs)) if (key.startsWith('data-')) this.dataset[key.slice(5)] = value;
      this.classes = new Set((attrs.class || '').split(/\s+/).filter(Boolean));
      this.classList = {
        add: name => this.classes.add(name),
        remove: name => this.classes.delete(name),
        contains: name => this.classes.has(name),
        toggle: (name, force) => {
          const add = force === undefined ? !this.classes.has(name) : force;
          if (add) this.classes.add(name); else this.classes.delete(name);
        }
      };
    }
    get id() { return this.attrs.id || ''; }
    get innerHTML() { return this._html; }
    set innerHTML(value) {
      this._html = value;
      this.children = [...value.matchAll(/<(?:a|div)\b([^>]*\bid="sd-(?:option-\d+|see-all)"[^>]*)>/g)].map(match => {
        const attrs = {};
        for (const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g)) attrs[attr[1]] = attr[2];
        return new Element(attrs);
      });
    }
    setAttribute(key, value) { this.attrs[key] = String(value); }
    getAttribute(key) { return Object.hasOwn(this.attrs, key) ? this.attrs[key] : null; }
    removeAttribute(key) { delete this.attrs[key]; }
    addEventListener(name, fn) { (this.handlers[name] ||= []).push(fn); }
    querySelectorAll(selector) {
      assert.equal(selector, '.sd-item, #sd-see-all');
      return this.children;
    }
    closest(selector) {
      if (selector === '.sd-item') return this.classes.has('sd-item') ? this : null;
      if (selector === '#sd-see-all') return this.id === 'sd-see-all' ? this : null;
      if (selector === '.hero-search-wrap') return this === input || this === dropdown || this === button ? this : null;
      throw new Error('Unexpected closest selector: ' + selector);
    }
    focus() { document.activeElement = this; }
  }
  const input = new Element({ id: 'hero-search-input', 'aria-expanded': 'false' });
  const dropdown = new Element({ id: 'search-dropdown', role: 'listbox' });
  const button = new Element({ id: 'hero-search-btn' }), form = new Element({ id: 'ai-frontdoor-form' });
  const elements = { 'hero-search-input': input, 'search-dropdown': dropdown, 'hero-search-btn': button, 'ai-frontdoor-form': form };
  document = {
    documentElement: { lang: 'en', dataset: {} }, activeElement: input,
    getElementById: id => elements[id] || null,
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener: (name, fn) => (docHandlers[name] ||= []).push(fn),
    createElement: tag => ({ tagName: tag }),
    head: { appendChild: script => scripts.push(script) }
  };
  const catalogue = [
    { id: 'alpha-one', name: 'Alpha calculator', desc: 'find alpha tools', href: '/alpha/', category: 'financial', status: 'live' },
    { id: 'alpha-two', name: 'Alpha document', desc: 'find alpha tools', href: '/alpha-document/', category: 'document-pdf', status: 'new' },
    { id: 'beta', name: 'Beta calculator', desc: 'find beta tools', href: '/beta/', category: 'financial', status: 'live' }
  ];
  const storage = new Map();
  const window = {
    AFRO_TOOLS: catalogue, AFROTOOLS_FLAGS: { aiFrontdoorEnabled: false },
    location: { href: '/', search: '' },
    addEventListener: (name, fn) => (winHandlers[name] ||= []).push(fn)
  };
  const schedule = fn => { const id = ++timerId; timers.set(id, fn); return id; };
  window.setTimeout = schedule;
  const context = {
    window, document, AFRO_TOOLS: catalogue, URLSearchParams,
    setTimeout: schedule, clearTimeout: id => timers.delete(id),
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    sessionStorage: { setItem: (key, value) => storage.set(key, value) }
  };
  Object.assign(window, context);
  window.window = window;
  window.CustomEvent = function (type, options) { this.type = type; this.detail = options && options.detail; };
  window.dispatchEvent = event => { for (const fn of [...(winHandlers[event.type] || [])]) fn(event); return true; };
  document.readyState = 'complete';
  document.dispatchEvent = event => { for (const fn of [...(docHandlers[event.type] || [])]) fn(event); return true; };
  document.removeEventListener = (name, fn) => { docHandlers[name] = (docHandlers[name] || []).filter(handler => handler !== fn); };
  if (options.deferredRegistry) delete window.AFRO_TOOLS;
  const sandbox = vm.createContext(window);
  vm.runInContext(controller(html), sandbox, { timeout: 1000 });
  function fire(element, name, extra = {}) {
    let prevented = false;
    const event = { target: element, preventDefault() { prevented = true; }, ...extra };
    for (const handler of element.handlers[name] || []) handler.call(element, event);
    return prevented;
  }
  function tick() {
    for (const [id, fn] of [...timers]) { timers.delete(id); fn(); }
  }
  function type(value) { input.value = value; fire(input, 'input'); }
  function key(value) { return fire(input, 'keydown', { key: value }); }
  function outside() { for (const fn of docHandlers.click || []) fn({ target: { closest: () => null } }); }
  function refresh() { for (const fn of winHandlers['afrotools:registry-ready'] || []) fn(); }
  async function finishRouter() {
    window.AfroToolsAIOrchestrator = { buildPlan: () => ({ status: 'error' }) };
    for (let count = 0; count < 40; count++) {
      const script = scripts.shift();
      if (script) script.onload();
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  return { input, dropdown, window, scripts, fire, tick, type, key, outside, refresh, finishRouter, context: sandbox, html };
}

test('all selectable search entries including the footer expose unselected option semantics', () => {
  const h = mount(); h.type('alpha'); h.tick();
  assert.equal(h.dropdown.children.length, 3);
  for (const item of h.dropdown.children) {
    assert.equal(item.getAttribute('role'), 'option');
    assert.equal(item.getAttribute('aria-selected'), 'false');
    assert.equal(item.getAttribute('tabindex'), '-1');
  }
});

test('editing immediately discards the previous active suggestion before debounce', () => {
  const h = mount(); h.type('alpha'); h.tick(); h.key('ArrowDown');
  assert.equal(h.input.getAttribute('aria-activedescendant'), 'sd-option-0');
  h.type('beta');
  assert.equal(h.input.getAttribute('aria-activedescendant'), null);
  assert.equal(h.dropdown.children.length, 0);
  h.tick();
  assert.equal(h.dropdown.children[0].getAttribute('href'), '/beta/');
  assert.equal(h.input.getAttribute('aria-activedescendant'), null);
});

test('registry rerender clears selection rather than naming a replaced result', () => {
  const h = mount(); h.type('alpha'); h.tick(); h.key('ArrowDown'); h.refresh();
  assert.equal(h.input.getAttribute('aria-activedescendant'), null);
  assert.ok(h.dropdown.children.every(item => item.getAttribute('aria-selected') === 'false'));
});

for (const dismiss of ['Escape', 'Tab', 'outside']) {
  test(dismiss + ' cancels pending suggestions and leaves the dropdown closed', () => {
    const h = mount(); h.type('alpha');
    if (dismiss === 'outside') h.outside(); else {
      const prevented = h.key(dismiss);
      if (dismiss === 'Tab') assert.equal(prevented, false, 'Tab must retain normal focus movement');
    }
    h.tick();
    assert.equal(h.input.getAttribute('aria-expanded'), 'false');
    assert.equal(h.dropdown.children.length, 0);
    assert.equal(h.input.getAttribute('aria-activedescendant'), null);
  });
}

test('an asynchronous router completion cannot reopen dismissed suggestions', async () => {
  const h = mount(); h.type('find alpha tools'); h.tick();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(h.scripts.length, 'Real controller must request the deferred router');
  h.key('Escape');
  await h.finishRouter();
  assert.equal(h.input.getAttribute('aria-expanded'), 'false');
  assert.equal(h.dropdown.children.length, 0);
});

test('arrow selection and Enter preserve exact tool navigation', () => {
  const h = mount(); h.type('alpha'); h.tick(); h.key('ArrowDown');
  assert.equal(h.input.getAttribute('aria-activedescendant'), 'sd-option-0');
  assert.equal(h.dropdown.children[0].getAttribute('aria-selected'), 'true');
  h.key('ArrowUp');
  assert.equal(h.input.getAttribute('aria-activedescendant'), null);
  h.key('ArrowDown'); h.key('Enter');
  assert.equal(h.window.location.href, '/alpha/');
});

test('footer Enter and pointer activation retain the search fallback', () => {
  for (const pointer of [false, true]) {
    const h = mount(); h.type('alpha'); h.tick();
    if (pointer) h.fire(h.dropdown, 'click', { target: h.dropdown.children.at(-1) });
    else { h.key('ArrowDown'); h.key('ArrowDown'); h.key('ArrowDown'); h.key('Enter'); }
    assert.equal(h.window.location.href, '/search?q=alpha');
  }
});

test('new input after dismissal reopens suggestions while exact-name submission still works', () => {
  const h = mount(); h.type('alpha'); h.tick(); h.key('Escape');
  h.type('beta'); h.tick();
  assert.equal(h.input.getAttribute('aria-expanded'), 'true');
  h.fire(h.input, 'keydown', { key: 'Enter' });
  assert.equal(h.window.location.href, '/beta/');
});


// Exercise both complete homepage IIFEs and the actual served registry owner.
// A catalogue arriving after the input debounce must open current results,
// while an explicit dismissal must survive that same readiness event.
for (const dismissal of ['none', 'Escape', 'Tab', 'outside']) {
  test('delayed real catalogue readiness respects ' + dismissal, () => {
    const h = mount({ deferredRegistry: true });
    const loaders = [...h.html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)]
      .map(match => match[1]).filter(text => text.includes('function loadRegistry()') && text.includes('tool-registry.min.js'));
    assert.equal(loaders.length, 1);
    vm.runInContext(loaders[0], h.context, { timeout: 1000 });
    h.window.dispatchEvent(new h.window.CustomEvent('focusin'));
    const requests = h.scripts.filter(script => /^\/assets\/js\/components\/tool-registry\.min\.js(?:\?|$)/.test(script.src || ''));
    assert.equal(requests.length, 1);
    h.type('AfroKitchen'); h.tick();
    assert.equal(h.input.getAttribute('aria-expanded'), 'false');
    if (dismissal === 'outside') h.outside();
    else if (dismissal !== 'none') h.key(dismissal);
    const registryPath = process.env.AFROTOOLS_HOME_SEARCH_REGISTRY || path.join(__dirname, '..', 'assets/js/components/tool-registry.min.js');
    vm.runInContext(fs.readFileSync(registryPath, 'utf8'), h.context, { timeout: 5000 });
    assert.ok(Array.isArray(h.window.AFRO_TOOLS) && h.window.AFRO_TOOLS.length > 0);
    requests[0].onload();
    if (dismissal === 'none') {
      assert.equal(h.input.getAttribute('aria-expanded'), 'true');
      assert.ok(h.dropdown.children.some(item => item.getAttribute('href') === '/tools/afrokitchen/'));
    } else {
      assert.equal(h.input.getAttribute('aria-expanded'), 'false');
      assert.equal(h.dropdown.children.length, 0);
    }
    h.type('AfroKitchen'); h.tick();
    assert.equal(h.input.getAttribute('aria-expanded'), 'true');
    assert.ok(h.dropdown.children.some(item => item.getAttribute('href') === '/tools/afrokitchen/'));
  });
}

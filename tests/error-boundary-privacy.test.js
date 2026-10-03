'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const source = fs.readFileSync(process.env.AFROTOOLS_ERROR_BOUNDARY_SOURCE || path.join(__dirname, '../assets/js/lib/error-boundary.js'), 'utf8');
const PRIVATE = 'synthetic.person@example.invalid salary 123456';

function harness({ body = true, code = source } = {}) {
  const logs = [], events = [], listeners = {}, timers = [];
  function element(tagName) {
    const node = { tagName, children: [], attributes: {}, style: {}, handlers: {}, parentElement: null,
      appendChild(child) { child.parentElement = this; this.children.push(child); return child; },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, callback) { this.handlers[name] = callback; },
      remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
    };
    Object.defineProperty(node, 'innerHTML', { set() { throw new Error('HTML parsing is forbidden for error text'); } });
    return node;
  }
  const document = { body: body ? element('body') : null, createElement: element,
    getElementById(id) { return this.body && this.body.children.find(child => child.id === id); } };
  const window = { AFRO_TOOLS: [{ id: 'cv-builder' }], AfroTools: { analytics: { trackError(...args) { events.push(args); } } },
    addEventListener(name, callback) { listeners[name] = callback; } };
  vm.runInNewContext(code, { window, document, console: { error(...args) { logs.push(args); } }, setTimeout(callback, delay) { timers.push({ callback, delay }); }, Error, TypeError }, { filename: 'error-boundary.js' });
  return { window, document, logs, events, listeners, timers };
}

test('manual error reporting never forwards exception text, stacks or request details', () => {
  const h = harness();
  const error = new Error(PRIVATE);
  error.stack = 'Synthetic stack: ' + PRIVATE;
  h.window.AfroTools.errors.report('cv-builder', error, { source: '/export?content=' + PRIVATE });
  assert.equal(JSON.stringify(h.logs).includes(PRIVATE), false, 'application console diagnostics contain no exception content');
  assert.equal(JSON.stringify(h.events).includes(PRIVATE), false, 'analytics receives no exception content');
  assert.equal(h.events[0][0], 'cv-builder');
  assert.equal(h.events[0][1], 'js_error');
  assert.equal(h.events[0][2], '');
});

test('unknown caller labels cannot become diagnostic or analytics identifiers', () => {
  const h = harness();
  h.window.AfroTools.errors.report('synthetic-person', PRIVATE, { private: PRIVATE });
  assert.equal(h.events[0][0], 'global');
  assert.equal(JSON.stringify(h.logs).includes('synthetic-person'), false);
  assert.equal(JSON.stringify(h.logs).includes(PRIVATE), false);
});

test('reporting never reads, coerces or serializes arbitrary error objects', () => {
  const h = harness();
  let reads = 0;
  const hostile = new Proxy({}, { get() { reads++; throw new Error('Exception object was inspected'); } });
  assert.doesNotThrow(() => h.window.AfroTools.errors.report('cv-builder', hostile, hostile));
  assert.equal(reads, 0);
});

test('global errors and rejection handlers retain propagation without copying private payloads', () => {
  const h = harness();
  assert.equal(h.window.onerror(PRIVATE, '/tool.js?private=' + PRIVATE, 1, 2, new Error(PRIVATE)), false);
  const rejection = {};
  Object.defineProperty(rejection, 'reason', { get() { throw new Error('Private rejection reason was read'); } });
  assert.doesNotThrow(() => h.listeners.unhandledrejection(rejection));
  assert.equal(h.events.length, 2);
  assert.equal(JSON.stringify(h.logs).includes(PRIVATE), false);
  assert.equal(JSON.stringify(h.events).includes(PRIVATE), false);
});

test('sync and async wrappers preserve successful results and safe failure behavior', async () => {
  const h = harness();
  const api = h.window.AfroTools.errors;
  assert.equal(api.wrap('cv-builder', () => 42), 42);
  assert.equal(await api.wrapAsync('cv-builder', () => Promise.resolve(99)), 99);
  assert.equal(api.wrap('cv-builder', () => { throw new Error(PRIVATE); }), null);
  assert.equal(await api.wrapAsync('cv-builder', () => Promise.reject(new Error(PRIVATE))), undefined);
  assert.equal(h.logs.length, 2);
  assert.equal(JSON.stringify(h.logs).includes(PRIVATE), false);
  assert.equal(h.document.body.children.length, 1, 'duplicate alerts do not accumulate');
});

test('diagnostic rate limiting retains the original five-report ceiling', () => {
  const h = harness();
  for (let count = 0; count < 8; count++) h.window.AfroTools.errors.report('cv-builder', new Error(PRIVATE));
  assert.equal(h.logs.length, 5);
  assert.equal(h.events.length, 5);
  assert.equal(JSON.stringify(h.logs).includes(PRIVATE), false);
});

test('alerts create literal text, a named button and the existing expiry timer', () => {
  const h = harness();
  const text = '<img src=x onerror=window.syntheticInjection=true>';
  h.window.AfroTools.errors.showBanner(text);
  const banner = h.document.getElementById('afro-error-banner');
  assert.equal(banner.attributes.role, 'alert');
  assert.equal(banner.children[1].textContent, text);
  assert.equal(banner.children[2].type, 'button');
  assert.equal(banner.children[2].attributes['aria-label'], 'Dismiss error');
  assert.equal(h.timers[0].delay, 8000);
  banner.children[2].handlers.click();
  assert.equal(h.document.body.children.length, 0);
});

test('errors before body creation can be reported without a secondary failure', () => {
  const h = harness({ body: false });
  assert.doesNotThrow(() => h.window.onerror(PRIVATE, '/tool.js', 1, 2, new Error(PRIVATE)));
  assert.equal(h.logs.length, 1);
  assert.equal(h.timers.length, 0);
});

test('actual bundle generation preserves the previous production URL with the repaired reporting boundary', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-error-bundle-'));
  try {
    fs.mkdirSync(path.join(temporaryRoot, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(temporaryRoot, 'assets/js/lib'), { recursive: true });
    fs.copyFileSync(path.join(__dirname, '../scripts/bundle.js'), path.join(temporaryRoot, 'scripts/bundle.js'));
    fs.writeFileSync(path.join(temporaryRoot, 'assets/js/lib/error-boundary.js'), source);
    const run = spawnSync(process.execPath, [path.join(temporaryRoot, 'scripts/bundle.js')], { encoding: 'utf8', timeout: 10000 });
    assert.equal(run.status, 0, 'the actual bundle owner regenerates the fixture');
    const directory = path.join(temporaryRoot, 'assets/js/bundles');
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
    assert(manifest.core.aliases.includes('/assets/js/bundles/core.23b1bcef.min.js'), 'the previous production script URL remains available');
    const current = fs.readFileSync(path.join(directory, manifest.core.file));
    assert(fs.readFileSync(path.join(directory, 'core.23b1bcef.min.js')).equals(current), 'the compatibility URL contains the same reporting repair');
    const h = harness({ code: current.toString() });
    h.window.AfroTools.errors.report('synthetic-person', new Error(PRIVATE), { url: PRIVATE });
    assert.equal(JSON.stringify(h.logs).includes(PRIVATE), false);
    assert.equal(JSON.stringify(h.events).includes(PRIVATE), false);
  } finally {
    const resolved = fs.realpathSync(temporaryRoot);
    const intendedParent = fs.realpathSync(os.tmpdir()) + path.sep;
    assert(resolved.startsWith(intendedParent) && path.basename(resolved).startsWith('afrotools-error-bundle-'), 'temporary fixture cleanup stays inside its intended directory');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

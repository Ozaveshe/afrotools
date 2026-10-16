'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(process.env.SOLAR_ASSISTANT_OWNER || path.join(__dirname, '../assets/js/energy-tool-assistant.js'), 'utf8');

// Full shipped owner and its real rendering/click callbacks; this DOM supplies
// structure/events, not country selection or calculation outcome logic.
function setup({ route = '/tools/solar-roi/', root = false, mount = true, native = false, sizes = [1, 3, 10] } = {}) {
  const ids = new Map(), nodes = [], events = [], calculations = [], delegated = [];
  let active = null;
  function element(tag, text = '') {
    const attrs = new Map(), listeners = new Map();
    const n = { tagName: tag.toUpperCase(), className: '', textContent: text, children: [], parentNode: null, value: '',
      setAttribute(k, v) { attrs.set(k, v); }, getAttribute(k) { return attrs.get(k) || null; },
      appendChild(x) { this.children.push(x); x.parentNode = this; return x; },
      insertBefore(x, ref) { const i = this.children.indexOf(ref); this.children.splice(i < 0 ? this.children.length : i, 0, x); x.parentNode = this; },
      addEventListener(k, fn) { (listeners.get(k) || (listeners.set(k, []), listeners.get(k))).push(fn); },
      click() { for (const fn of listeners.get('click') || []) fn({ target: this }); },
      dispatchEvent(event) { events.push([this.id, event.type]); },
      focus() { active = this; }, scrollIntoView(options) { this.scrolled = options; },
      querySelector() { return null; }, querySelectorAll() { return []; },
    };
    nodes.push(n); return n;
  }
  function input(id, value) { const n = element('input'); n.id = id; n.value = value; ids.set(id, n); return n; }
  const picker = root ? input('solarRootCountrySelect', 'kenya') : null;
  const size = !root ? input('systemKW', '1') : null;
  if (size) size.options = sizes.map(value => ({ value: String(value) }));
  const bill = input('monthlyBill', '7620');
  if (route === '/tools/generator-fuel/') {
    input('genKVA', '99'); input('dailyHours', '99'); input('fuelType', 'diesel');
  }
  const calc = !root ? input('calcBtn', '') : null;
  if (calc) calc.addEventListener('click', () => calculations.push({ size: size.value, bill: bill.value }));
  const nativeControls = native ? ['Small home', 'Family home', 'Shop / business'].map(label => {
    const n = element('a', 'Load this scenario');
    const heading = element('h3', label);
    n.closest = selector => selector === '.solar-scenario-card' ? { querySelector: selector => selector === 'h3' ? heading : null } : null;
    n.addEventListener('click', () => delegated.push(label)); return n;
  }) : [];
  const container = element('div'), anchor = element('h1'); container.appendChild(anchor);
  const head = element('head'), body = element('body');
  const document = { readyState: 'complete', head, body,
    createElement: element, getElementById: id => ids.get(id) || null,
    querySelector(selector) {
      if (selector === '.en-assistant-panel') return nodes.find(n => n.className.split(' ').includes('en-assistant-panel')) || null;
      if (selector === '.en-card-body') return mount && !root ? container : null;
      if (selector === '.en-hub .container' || selector === '.en-hub') return mount && root ? container : null;
      if (selector === 'h1') return anchor;
      return null;
    },
    querySelectorAll: selector => selector === '[data-scenario]' ? nativeControls : [],
    addEventListener() {},
  };
  const window = { location: { pathname: route }, setTimeout() {}, AfroEnergyTools: {} };
  vm.runInNewContext(source, { document, window, Event: class { constructor(type) { this.type = type; } },
    CustomEvent: class {}, localStorage: {}, navigator: {}, setTimeout() {}, URL, Blob }, { timeout: 1000 });
  return { ids, nodes, events, calculations, delegated, picker, bill, size, container, window,
    buttons: () => nodes.filter(n => n.tagName === 'BUTTON'), active: () => active,
    panel: () => container.children.find(n => n.className.split(' ').includes('en-assistant-panel')) };
}

test('root country action focuses and scrolls the actual picker without changing its choice', () => {
  const h = setup({ root: true });
  const button = h.buttons().find(n => n.textContent === 'Choose a country');
  assert.ok(button); button.click();
  assert.equal(h.active(), h.picker); assert.equal(h.picker.value, 'kenya');
  assert.equal(h.picker.scrolled.block, 'center');
  assert.equal(h.picker.scrolled.behavior, 'auto'); assert.equal(h.calculations.length, 0);
  assert.equal(h.buttons().length, 1, 'no numeric buttons with absent inputs');
});
test('existing country native scenarios remain their sole owner; no copied bill values', () => {
  const h = setup({ route: '/tools/solar-roi/kenya/', native: true });
  const buttons = h.buttons(); assert.equal(buttons.length, 3);
  assert.deepEqual(buttons.map(button => button.textContent), ['Small home', 'Family home', 'Shop / business']);
  buttons[1].click(); assert.deepEqual(h.delegated, ['Family home']);
  assert.equal(h.bill.value, '7620'); assert.equal(h.events.length, 0);
});
test('legacy mounted country fallback changes valid system size and invokes existing calculation', () => {
  const h = setup({ route: '/tools/solar-roi/kenya/', sizes: [1, 3] });
  assert.deepEqual(h.buttons().map(n => n.textContent), ['Compare 1 kW', 'Compare 3 kW']);
  h.buttons()[1].click(); assert.equal(h.bill.value, '7620');
  assert.deepEqual(h.calculations, [{ size: '3', bill: '7620' }]);
  assert.deepEqual(h.events, [['systemKW', 'input'], ['systemKW', 'change']]);
});
test('current country template without an assistant mount remains unmounted', () => {
  const h = setup({ route: '/tools/solar-roi/kenya/', mount: false, native: true });
  assert.equal(h.panel(), undefined); assert.equal(h.delegated.length, 0);
  assert.equal(h.calculations.length, 0);
});
test('Solar guidance retains reference destinations and source details affordance', () => {
  const h = setup({ root: true });
  const references = h.nodes.filter(n => n.tagName === 'A');
  assert.deepEqual(references.map(n => n.href), ['https://pvwatts.nrel.gov/', 'https://www.energysage.com/solar/calculator/']);
  assert.ok(h.nodes.some(n => n.tagName === 'DETAILS'));
  assert.ok(h.nodes.some(n => n.textContent === 'Planning check'));
});
test('non-Solar presets and report entry points retain original behavior', () => {
  const h = setup({ route: '/tools/generator-fuel/' });
  assert.deepEqual(h.buttons().map(n => n.textContent), ['Evening home', 'Hybrid home', 'Small office']);
  h.buttons()[0].click(); assert.equal(h.calculations.length, 0);
  assert.equal(h.ids.get('genKVA').value, 2);
  assert.equal(h.ids.get('dailyHours').value, 5);
  assert.equal(h.ids.get('fuelType').value, 'petrol');
  assert.equal(h.events.length, 6);
  for (const name of ['saveEnergyReport', 'downloadEnergyPdf', 'buildReport']) assert.equal(typeof h.window.AfroEnergyTools[name], 'function');
  assert.ok(h.nodes.some(n => n.textContent === 'Competitor check'));
});

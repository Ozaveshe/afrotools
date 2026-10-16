'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const owner = process.env.PORTFOLIO_OWNER || path.join(root, 'assets/js/pages/fintech-shared-controllers/stock-portfolio.js');
const i18n = path.join(root, 'assets/js/pages/fintech-shared-controller-i18n.js');

// Run the complete shipped owner and real Intl arithmetic. This small DOM seam
// observes rendered state/events; it is not browser or native-number-input proof.
function harness(values = [['EXAMPLE', '10', '100', '125']], lang = 'en') {
  const nodes = new Map();
  let focused;
  function node(tagName = 'DIV') {
    const attrs = new Map();
    const classes = new Set();
    let html = '';
    const item = {
      tagName, value: '', textContent: '', style: {}, children: [], listeners: {}, validity: { badInput: false },
      classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) },
      setAttribute: (k, v) => attrs.set(k, String(v)), getAttribute: k => attrs.get(k) ?? null,
      removeAttribute: k => attrs.delete(k), focus() { focused = item; },
      addEventListener(type, fn) { this.listeners[type] = fn; },
      querySelectorAll() { return []; },
      appendChild(child) { this.children.push(child); child.parentNode = this; },
      remove() { this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1); },
      get innerHTML() { return html; }, set innerHTML(v) { html = v; this.children = []; }
    };
    return item;
  }
  const tbody = node('TBODY');
  nodes.set('holdings-tbody', tbody);
  for (const rowValues of values) {
    const row = node('TR');
    row.inputs = rowValues.map(value => Object.assign(node('INPUT'), { value }));
    row.querySelectorAll = selector => selector === 'input' ? row.inputs : [];
    tbody.appendChild(row);
  }
  ['sp-error', 'sp-results', 'sp-table-body', 'sp-total-value', 'sp-total-cost', 'sp-total-gain', 'sp-return-pct'].forEach(id => nodes.set(id, node()));
  const tabs = [node('BUTTON'), node('BUTTON')];
  tabs[0].classList.add('active');
  const document = {
    documentElement: { lang },
    getElementById: id => nodes.get(id), createElement: tag => node(tag.toUpperCase()),
    querySelectorAll: selector => selector === '#holdings-tbody tr' ? tbody.children : selector === '.etab' ? tabs : [],
    querySelector() { return null; }, addEventListener() {}
  };
  const context = vm.createContext({ document, window: {}, Intl, Number });
  vm.runInContext(fs.readFileSync(i18n, 'utf8'), context, { filename: i18n });
  if (lang === 'sw') vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/pages/sw-fintech-wealth-planning.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(owner, 'utf8'), context, { filename: owner });
  return { context, nodes, tbody, tabs, focused: () => focused,
    calculate: () => context.calcPortfolio(),
    visible: () => nodes.get('sp-results').classList.contains('on'),
    edit(row, field, value) {
      const input = tbody.children[row].inputs[field]; input.value = value;
      tbody.listeners.input?.({ target: input });
    }
  };
}

test('complete holdings retain correct independent arithmetic and unused blank rows', () => {
  const h = harness([['A', '10', '100', '125'], ['B', '5', '80', '50'], ['', '', '', '']]);
  h.calculate();
  assert.equal(h.visible(), true);
  assert.equal(h.nodes.get('sp-total-value').textContent, new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(1500));
  assert.equal(h.nodes.get('sp-total-cost').textContent, new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(1400));
  assert.equal(h.nodes.get('sp-return-pct').textContent, '+7.1%');
  assert.equal(h.nodes.get('sp-table-body').children.length, 2);
});

test('an explicit current price of zero remains a valid total loss', () => {
  const h = harness([['A', '10', '100', '0']]); h.calculate();
  assert.equal(h.visible(), true); assert.equal(h.nodes.get('sp-return-pct').textContent, '-100.0%');
});

test('blank current price is incomplete, not an entered zero', () => {
  const h = harness([['A', '10', '100', '']]); h.calculate();
  assert.equal(h.visible(), false); assert.equal(h.nodes.get('sp-error').classList.contains('on'), true);
  assert.equal(h.tbody.children[0].inputs[3].getAttribute('aria-invalid'), 'true');
  assert.equal(h.focused(), h.tbody.children[0].inputs[3]);
});

test('native badInput on an otherwise empty row cannot be silently ignored', () => {
  const h = harness([['A', '10', '100', '125'], ['', '', '', '']]);
  h.tbody.children[1].inputs[3].validity.badInput = true; h.calculate();
  assert.equal(h.visible(), false); assert.equal(h.focused(), h.tbody.children[1].inputs[1]);
  assert.equal(h.tbody.children[1].inputs[3].getAttribute('aria-invalid'), 'true');
});

test('editing a holding removes old metrics and result rows until recalculation', () => {
  const h = harness(); h.calculate(); h.edit(0, 3, '130');
  assert.equal(h.visible(), false); assert.equal(h.nodes.get('sp-total-value').textContent, '');
  assert.equal(h.nodes.get('sp-table-body').children.length, 0);
  h.calculate(); assert.equal(h.visible(), true); assert.equal(h.nodes.get('sp-return-pct').textContent, '+30.0%');
});

test('adding or deleting a holding invalidates the displayed result', () => {
  const add = harness(); add.calculate(); add.context.addRow(); assert.equal(add.visible(), false);
  const del = harness(); del.calculate();
  del.context.delRow({ closest: () => del.tbody.children[0] });
  assert.equal(del.visible(), false); assert.equal(del.nodes.get('sp-table-body').children.length, 0);
});

test('currency changes invalidate amounts and recalculation formats the chosen currency', () => {
  const h = harness(); h.calculate(); h.context.setExchange('USD', '$', h.tabs[1]);
  assert.equal(h.visible(), false); h.calculate();
  assert.equal(h.nodes.get('sp-total-value').textContent, new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(1250));
  assert.equal(h.tabs[1].getAttribute('aria-pressed'), 'true');
});

test('finite inputs whose products overflow cannot render Infinity or NaN', () => {
  const h = harness([['A', '1e308', '1e308', '1e308']]); h.calculate();
  assert.equal(h.visible(), false); assert.match(h.nodes.get('sp-error').textContent, /too large|range/i);
});

test('finite row totals whose combined sum overflows are rejected', () => {
  const h = harness([['A', '1e308', '1', '1'], ['B', '1e308', '1', '1']]); h.calculate();
  assert.equal(h.visible(), false); assert.match(h.nodes.get('sp-error').textContent, /too large|range/i);
});

test('cost underflow and unrepresentable returns are rejected rather than NaN/Infinity', () => {
  for (const values of [[['A', '1e-300', '1e-300', '1']], [['A', '1', '1e-308', '1e308']]]) {
    const h = harness(values); h.calculate(); assert.equal(h.visible(), false);
  }
});

test('a positive current price whose value underflows cannot become an explicit zero loss', () => {
  const h = harness([['A', '1e-300', '1', '1e-300']]); h.calculate();
  assert.equal(h.visible(), false); assert.match(h.nodes.get('sp-error').textContent, /range/i);
});

test('validation preserves unrelated input descriptions through recovery', () => {
  const h = harness([['A', '10', '100', '']]);
  const input = h.tbody.children[0].inputs[3]; input.setAttribute('aria-describedby', 'price-help');
  h.calculate(); assert.equal(input.getAttribute('aria-describedby'), 'price-help sp-error');
  h.edit(0, 3, '125'); h.calculate();
  assert.equal(input.getAttribute('aria-describedby'), 'price-help'); assert.equal(h.visible(), true);
});

test('French invalid input, range error and recovery use shared translated owner feedback', () => {
  const h = harness([['A', '10', '100', '']], 'fr'); h.calculate();
  assert.equal(h.visible(), false); assert.match(h.nodes.get('sp-error').textContent, /Chaque ligne/);
  const input = h.tbody.children[0].inputs[3];
  assert.ok(input.getAttribute('aria-describedby').split(/\s+/).includes('sp-error'));
  h.edit(0, 3, '0'); h.calculate(); assert.equal(h.visible(), true);
  assert.equal(input.getAttribute('aria-invalid'), null);
  const large = harness([['A', '1e308', '1e308', '1']], 'fr'); large.calculate();
  assert.equal(large.visible(), false); assert.match(large.nodes.get('sp-error').textContent, /trop|plage/i);
});

test('Swahili portfolio range feedback uses its real route dictionary', () => {
  const h = harness([['A', '1e308', '1e308', '1']], 'sw'); h.calculate();
  assert.equal(h.visible(), false); assert.match(h.nodes.get('sp-error').textContent, /wigo wa namba/);
});

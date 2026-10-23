const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/pages/fintech-shared-controllers/bond-yield.js'), 'utf8');

function fixture() {
  const values = { 'by-currency': 'NGN', 'by-face': '100000', 'by-coupon': '10', 'by-price': '95', 'by-years': '2', 'by-freq': '1' };
  const elements = {};
  for (const id of [...Object.keys(values), 'by-error', 'by-results', 'by-ytm', 'by-sub', 'by-current-yield', 'by-annual-coupon', 'by-total-return', 'by-market-price']) {
    const classes = new Set(), handlers = {};
    elements[id] = { value: values[id] || '', textContent: '', classList: { add: key => classes.add(key), remove: key => classes.delete(key), contains: key => classes.has(key) }, addEventListener: (type, callback) => { (handlers[type] ||= []).push(callback); }, focus() {}, edit(value, type) { this.value = value; for (const callback of handlers[type] || []) callback(); } };
  }
  const context = { window: {}, document: { getElementById: id => elements[id] } };
  vm.runInNewContext(source, context);
  return { elements, calculate: () => context.calcBond() };
}

test('editing any bond assumption invalidates the displayed result without changing the solver', () => {
  const changes = { 'by-currency': 'USD', 'by-face': '200000', 'by-coupon': '11', 'by-price': '110', 'by-years': '3', 'by-freq': '2' };
  for (const [id, value] of Object.entries(changes)) {
    for (const event of ['input', 'change']) {
      const { elements: e, calculate } = fixture();
      calculate();
      assert.equal(e['by-ytm'].textContent, '13.00%');
      assert.equal(e['by-results'].classList.contains('on'), true);
      e[id].edit(value, event);
      assert.equal(e['by-results'].classList.contains('on'), false, `${id}/${event} hides the old result`);
      calculate();
      assert.equal(e['by-results'].classList.contains('on'), true, `${id}/${event} recalculates`);
      assert.equal(e['by-error'].textContent, '');
    }
  }
});

test('invalid input hides results and a corrected edit clears the old error before recovery', () => {
  const { elements: e, calculate } = fixture();
  calculate();
  e['by-price'].edit('0', 'input');
  calculate();
  assert.equal(e['by-results'].classList.contains('on'), false);
  assert.match(e['by-error'].textContent, /positive face and price/);
  e['by-price'].edit('110', 'input');
  assert.equal(e['by-error'].textContent, '');
  assert.equal(e['by-results'].classList.contains('on'), false);
  calculate();
  assert.equal(e['by-results'].classList.contains('on'), true);
  assert.equal(e['by-ytm'].textContent, '4.65%');
  assert.equal(e['by-current-yield'].textContent, '9.09%');
  assert.equal(e['by-market-price'].textContent, 'NGN 110,000.00');
});

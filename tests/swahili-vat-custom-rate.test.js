'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const COUNTRIES = ['benin', 'botswana', 'burkina-faso', 'libya', 'south-sudan'];

// Exercise each shipped inline controller and its real engine. The small DOM
// records output/export behavior; it does not replace calculation functions.
function page(country) {
  const html = fs.readFileSync(path.join(ROOT, 'sw', country, 'kikokotoo-vat', 'index.html'), 'utf8');
  const controllers = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1]).filter(source => /var VAT_DATA\s*=/.test(source));
  assert.equal(controllers.length, 1);
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set();
      nodes.set(id, {
        value: id === 'amount' ? '10000' : id === 'whRate' ? '20' : '',
        textContent: '', innerHTML: '', attributes: {}, validity: { badInput: false },
        classList: {
          add: c => classes.add(c), remove: c => classes.delete(c),
          toggle: (c, on) => on ? classes.add(c) : classes.delete(c),
          contains: c => classes.has(c)
        },
        setAttribute(name, value) { this.attributes[name] = value; },
        setCustomValidity(message) { this.validationMessage = message; },
        addEventListener() {}, appendChild() {}
      });
    }
    return nodes.get(id);
  }
  const exports = { shares: [], prints: 0, pdfs: [] };
  const context = {
    document: { getElementById: node, querySelectorAll: () => [], createElement: () => node(Symbol()) },
    navigator: { share: payload => exports.shares.push(payload) },
    alert() {}, print() { exports.prints++; }, console
  };
  context.window = context;
  vm.createContext(context);
  if (country === 'benin') vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/engines/bj-vat.js'), 'utf8'), context);
  if (country === 'burkina-faso') vm.runInContext(fs.readFileSync(path.join(ROOT, 'engines/tva-engine.js'), 'utf8'), context);
  context.AfroTools = context.AfroTools || {};
  context.AfroTools.localVatPdf = payload => exports.pdfs.push(payload);
  vm.runInContext(controllers[0], context, { filename: country + '-shipped-controller.js' });
  return {
    context, node, exports,
    custom(value) { node('customRate').value = value; context.onCustomRate(); },
    mode(value) { context.setMode(value); },
    result: () => context.RESULT,
    html
  };
}
function close(actual, expected) { assert.ok(Math.abs(actual - expected) < 0.011, `${actual} != ${expected}`); }

for (const country of COUNTRIES) {
  test(country + ': explicit custom zero reaches results, invoice, withholding and export', () => {
    const p = page(country);
    assert.match(p.html, /id="customRate"[^>]*min="0"/);
    p.custom('0');
    assert.equal(p.result().rate, 0);
    assert.equal(p.result().vatAmount, 0);
    assert.equal(p.result().totalInclusive, 10000);
    assert.equal(p.node('usedRate').textContent, '0%');
    assert.doesNotMatch(p.node('itemsTotal').innerHTML, /NaN|Infinity/);
    assert.ok(p.node('itemsTotal').innerHTML.includes('VAT: <strong>' + p.context.fmt(0) + '</strong>'));
    if (typeof p.context.calcWithholding === 'function') {
      assert.ok(p.node('whResults').innerHTML.includes('<strong>' + p.context.fmt(0) + '</strong>'));
    }
    p.context.shareResult();
    assert.match(p.exports.shares[0].text, /\(0%\)/);
    if (country === 'burkina-faso') {
      p.context.downloadPdfResult();
      assert.ok(p.exports.pdfs[0].rows.some(row => row.label === 'VAT (0%)'));
    } else {
      p.context.printResult();
      assert.equal(p.exports.prints, 1);
    }
    p.mode('remove');
    assert.equal(p.result().netAmount, 10000);
    assert.equal(p.result().vatAmount, 0);
    assert.equal(p.result().totalInclusive, 10000);
    assert.equal(p.node('customRate').attributes['aria-invalid'], 'false');
  });

  test(country + ': blank restores selected rate; changing preset clears custom zero', () => {
    const p = page(country), selected = p.context.RATE;
    p.custom('7.5');
    p.custom('');
    assert.equal(p.result().rate, selected);
    close(p.result().vatAmount, 10000 * selected);
    p.custom('0');
    p.context.setRate(selected, 'existing selected rate', { classList: { add() {} } });
    assert.equal(p.node('customRate').value, '');
    assert.equal(p.result().rate, selected);
    p.custom('   ');
    assert.equal(p.result().rate, selected);
  });

  test(country + ': finite positive boundaries retain existing add/extract arithmetic', () => {
    const p = page(country);
    for (const value of ['0.01', '7.5', '100']) {
      p.mode('add'); p.custom(value);
      const r = Number(value) / 100;
      assert.equal(p.result().rate, r);
      close(p.result().vatAmount, 10000 * r);
      close(p.result().totalInclusive, 10000 * (1 + r));
      p.mode('remove');
      close(p.result().netAmount, 10000 / (1 + r));
      close(p.result().vatAmount, 10000 - 10000 / (1 + r));
    }
  });

  test(country + ': native number-input badInput must not become a blank/default reset', () => {
    const p = page(country);
    p.custom('7.5');
    p.node('customRate').value = '';
    p.node('customRate').validity.badInput = true;
    p.context.onCustomRate();
    assert.equal(p.result(), null);
    assert.equal(p.node('customRate').attributes['aria-invalid'], 'true');
    assert.notEqual(p.node('customRateError').textContent, '');
    p.node('customRate').validity.badInput = false;
    p.custom('');
    assert.equal(p.result().rate, p.context.RATE);
  });

  test(country + ': invalid rates cannot retain or export stale valid results', () => {
    const p = page(country);
    for (const value of ['-0.01', 'Infinity', 'NaN', 'not-a-number']) {
      p.custom('7.5');
      assert.notEqual(p.result(), null);
      p.custom(value);
      assert.equal(p.result(), null, 'invalid ' + value);
      assert.equal(p.node('customRate').attributes['aria-invalid'], 'true');
      const count = p.exports.shares.length;
      p.context.shareResult();
      assert.equal(p.exports.shares.length, count);
      p.context.calcItems();
      assert.doesNotMatch(p.node('itemsTotal').innerHTML, /NaN|Infinity/);
      p.custom('');
      assert.notEqual(p.result(), null);
      assert.equal(p.node('customRate').attributes['aria-invalid'], 'false');
    }
    if (country === 'benin') {
      p.custom('100.01');
      assert.equal(p.result(), null, 'preserve existing Benin 100% ceiling');
    }
  });
}


for (const country of ['libya', 'south-sudan']) {
  test(country + ': invalid amounts clear all outputs and prevent stale share/print', () => {
    const p = page(country);
    for (const value of ['-1', 'Infinity', 'NaN', 'not-a-number', '']) {
      p.node('amount').value = '10000'; p.custom('7.5');
      assert.notEqual(p.result(), null);
      p.node('amount').value = value;
      p.context.calculate();
      assert.equal(p.result(), null, value);
      assert.equal(p.node('amount').attributes['aria-invalid'], 'true');
      assert.notEqual(p.node('amountError').textContent, '');
      for (const id of ['heroAmount', 'netAmount', 'vatAmount', 'totalAmount', 'usedRate']) assert.equal(p.node(id).textContent, '—');
      assert.equal(p.node('formulaText').textContent, '');
      assert.equal(p.node('itemsTotal').textContent, '—');
      assert.equal(p.node('results').classList.contains('on'), false);
      const shares = p.exports.shares.length, prints = p.exports.prints;
      p.context.shareResult(); p.context.printResult();
      assert.equal(p.exports.shares.length, shares); assert.equal(p.exports.prints, prints);
    }
  });
  test(country + ': native bad amount is invalid, while actual zero and recovery remain valid', () => {
    const p = page(country);
    p.custom('0'); p.node('amount').value = ''; p.node('amount').validity.badInput = true;
    p.context.calculate(); assert.equal(p.result(), null);
    p.node('amount').validity.badInput = false; p.node('amount').value = '0';
    for (const mode of ['add', 'remove']) {
      p.mode(mode); assert.equal(p.result().netAmount, 0); assert.equal(p.result().vatAmount, 0); assert.equal(p.result().totalInclusive, 0);
    }
    p.node('amount').value = '10000'; p.mode('add'); p.custom('7.5');
    assert.equal(p.result().totalInclusive, 10750); assert.equal(p.node('amount').attributes['aria-invalid'], 'false');
    assert.equal(p.node('amountError').textContent, '');
  });
  test(country + ': export revalidates current inputs even without input event', () => {
    const p = page(country); p.custom('7.5');
    p.node('amount').value = '-1'; p.context.shareResult();
    assert.equal(p.exports.shares.length, 0); assert.equal(p.result(), null);
    p.node('amount').value = '10000'; p.custom('0');
    p.node('amount').value = ''; p.node('amount').validity.badInput = true; p.context.printResult();
    assert.equal(p.exports.prints, 0); assert.equal(p.result(), null);
  });
}


test('benin: required amount rejects blank, negative and nonfinite input without stale outputs', () => {
  const p = page('benin');
  for (const value of ['', '   ', '-1', 'Infinity', 'NaN', 'not-a-number']) {
    p.node('amount').value = '10000'; p.custom('7.5');
    p.node('amount').value = value; p.context.calculate();
    assert.equal(p.result(), null, value);
    assert.equal(p.node('amount').attributes['aria-invalid'], 'true');
    assert.notEqual(p.node('calcStatus').textContent, '');
    for (const id of ['heroAmount', 'netAmount', 'vatAmount', 'totalAmount', 'usedRate']) assert.equal(p.node(id).textContent, '—');
    assert.equal(p.node('formulaText').textContent, '');
    assert.equal(p.node('itemsTotal').textContent, '—');
    assert.equal(p.node('results').classList.contains('on'), false);
    const shares = p.exports.shares.length, prints = p.exports.prints;
    p.context.shareResult(); p.context.printResult();
    assert.equal(p.exports.shares.length, shares); assert.equal(p.exports.prints, prints);
  }
});
test('benin: native badInput cannot become zero and exports revalidate without an input event', () => {
  const p = page('benin'); p.custom('7.5');
  p.node('amount').value = ''; p.node('amount').validity.badInput = true;
  p.context.shareResult();
  assert.equal(p.result(), null); assert.equal(p.exports.shares.length, 0);
  assert.equal(p.node('amount').attributes['aria-invalid'], 'true');
  p.node('amount').validity.badInput = false; p.node('amount').value = '10000'; p.custom('0');
  p.node('amount').value = '-1'; p.context.printResult();
  assert.equal(p.result(), null); assert.equal(p.exports.prints, 0);
});
test('benin: actual zero amount, selected blank rate and valid export recovery remain supported', () => {
  const p = page('benin'); p.node('amount').value = '0';
  for (const mode of ['add', 'remove']) {
    p.mode(mode); p.custom(''); assert.equal(p.result().rate, 0.18);
    assert.equal(p.result().netAmount, 0); assert.equal(p.result().vatAmount, 0); assert.equal(p.result().totalInclusive, 0);
  }
  p.node('amount').value = '10000'; p.mode('add'); p.custom('7.5'); p.context.shareResult(); p.context.printResult();
  assert.equal(p.result().totalInclusive, 10750); assert.equal(p.node('amount').attributes['aria-invalid'], 'false');
  assert.equal(p.exports.shares.length, 1); assert.match(p.exports.shares[0].text, /7.5%/); assert.equal(p.exports.prints, 1);
});

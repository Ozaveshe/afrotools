'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/jamb-aggregate/jamb-aggregate-engine.js');
const fs = require('node:fs');
const path = require('node:path');

const example = engine.calculate({
  utme: 280,
  postUtme: 68,
  utmeWeight: 50,
  postUtmeWeight: 50,
  benchmark: 65
});
assert.equal(example.ok, true);
assert.equal(example.normalizedUtme, 70);
assert.equal(example.aggregate, 69);
assert.equal(example.difference, 4);

const custom = engine.calculate({
  utme: 320,
  postUtme: 60,
  utmeWeight: 70,
  postUtmeWeight: 30,
  benchmark: ''
});
assert.equal(custom.ok, true);
assert.equal(custom.aggregate, 74);
assert.equal(custom.benchmark, null);

assert.match(engine.calculate({
  utme: 280,
  postUtme: 68,
  utmeWeight: 60,
  postUtmeWeight: 50
}).error, /add up to 100/);

assert.match(engine.calculate({
  utme: 401,
  postUtme: 68,
  utmeWeight: 50,
  postUtmeWeight: 50
}).error, /UTME score/);

assert.match(engine.calculate({
  utme: 280,
  postUtme: 68,
  utmeWeight: 50,
  postUtmeWeight: 50,
  benchmark: 101
}).error, /benchmark/);

const page = fs.readFileSync(path.join(__dirname, '../tools/jamb-aggregate/index.html'), 'utf8');
assert.doesNotMatch(page, /var (?:FORMULAS|CUTOFFS)\s*=/);
assert.doesNotMatch(page, /Competitive courses like Medicine|Cutoff data sourced|16,000\+/);
assert.equal((page.match(/class="jamb-faq-item"/g) || []).length, 3);

console.log('JAMB screening worksheet verified: normalized UTME, published weights, benchmark comparison, and invalid-state guards.');

// Exercise the real UI controller after a prior successful calculation, not
// just a fresh engine rejection. All browser effects stay in this fixture.
const { test } = require('node:test');
const vm = require('node:vm');

function loadWorksheet() {
  const fields = new Map();
  const effects = { copies: [], downloads: 0, prints: 0, saves: [] };
  const defaults = { utme: '280', postUtme: '60', utmeWeight: '70',
    postUtmeWeight: '30', publishedBenchmark: '', institutionName: '', programmeName: '' };
  const document = {
    getElementById(id) {
      if (!fields.has(id)) {
        const classes = new Set(id === 'resultCard' ? ['hidden'] : []);
        const listeners = new Map();
        fields.set(id, { value: defaults[id] || '', textContent: '', innerHTML: '',
          focus() {}, scrollIntoView() {},
          addEventListener(type, handler) { listeners.set(type, handler); },
          input(value) { this.value = value; listeners.get('input')?.({ target: this }); },
          classList: {
            add(name) { classes.add(name); }, remove(name) { classes.delete(name); },
            contains(name) { return classes.has(name); },
            toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
          }
        });
      }
      return fields.get(id);
    },
    createElement() { effects.downloads++; throw new Error('Unexpected download while invalid'); }
  };
  const window = { JambAggregateEngine: engine, print() { effects.prints++; } };
  const context = vm.createContext({ window, document,
    navigator: { clipboard: { writeText(text) { effects.copies.push(text); return Promise.resolve(); } } },
    localStorage: { setItem(key, text) { effects.saves.push({ key, value: JSON.parse(text) }); } },
    Blob: function () { throw new Error('Unexpected Blob while invalid'); },
    URL: { createObjectURL() { throw new Error('Unexpected object URL while invalid'); } }
  });
  const owner = path.join(__dirname, '../tools/jamb-aggregate/jamb-aggregate-vip.js');
  vm.runInContext(fs.readFileSync(owner, 'utf8'), context, { filename: owner });
  return { window, effects, field: id => document.getElementById(id) };
}

for (const [name, changed, message] of [
  ['out-of-range UTME', { utme: '401' }, /UTME score/],
  ['out-of-range Post-UTME', { postUtme: '101' }, /Post-UTME score/],
  ['invalid formula total', { utmeWeight: '60', postUtmeWeight: '50' }, /add up to 100/],
  ['invalid benchmark', { publishedBenchmark: '101' }, /published benchmark/]
]) {
  test(name + ' clears prior result and prevents stale worksheet exports, then recovers', async () => {
    const ui = loadWorksheet();
    ui.window.calculate();
    assert.equal(ui.field('aggregateScore').textContent, '67.00');
    assert.equal(ui.field('resultCard').classList.contains('hidden'), false);
    for (const [id, value] of Object.entries(changed)) ui.field(id).value = value;
    ui.window.calculate();
    assert.match(ui.field('jambFormStatus').textContent, message);
    assert.equal(ui.field('resultCard').classList.contains('hidden'), true);
    assert.equal(ui.field('jambActionStatus').textContent, '');
    ui.window.downloadJambActionPack();
    ui.window.printJambWorksheet();
    ui.window.saveJambActionPack();
    ui.window.copyJambActionPack();
    await Promise.resolve();
    assert.equal(ui.effects.downloads, 0);
    assert.equal(ui.effects.prints, 0);
    assert.equal(ui.effects.saves.length, 0);
    assert.equal(ui.effects.copies.length, 1);
    assert.match(ui.effects.copies[0], /^No planning result yet/);
    assert.doesNotMatch(ui.effects.copies[0], /67\.00|Planning aggregate:/);
    for (const [id, value] of Object.entries({ utme: '280', postUtme: '60',
      utmeWeight: '50', postUtmeWeight: '50', publishedBenchmark: '' })) ui.field(id).value = value;
    ui.window.calculate();
    assert.equal(ui.field('resultCard').classList.contains('hidden'), false);
    assert.equal(ui.field('aggregateScore').textContent, '65.00');
    assert.match(ui.field('breakdown').textContent, /35\.00[\s\S]*30\.00[\s\S]*65\.00/);
    ui.window.saveJambActionPack();
    assert.equal(ui.effects.saves.length, 1);
    assert.equal(ui.effects.saves[0].value.result.aggregate, 65);
  });
}

for (const [id, value] of [
  ['utme', '300'], ['postUtme', '62'], ['utmeWeight', '60'], ['postUtmeWeight', '40'],
  ['publishedBenchmark', '65'], ['institutionName', 'Synthetic University'], ['programmeName', 'Synthetic Programme']
]) {
  test(id + ' edit invalidates the previous worksheet before Calculate without deleting a saved record', () => {
    const ui = loadWorksheet();
    ui.window.calculate();
    ui.window.saveJambActionPack();
    const prior = JSON.stringify(ui.effects.saves);
    ui.field(id).input(value);
    assert.equal(ui.field(id).value, value);
    assert.equal(ui.field('resultCard').classList.contains('hidden'), true);
    assert.match(ui.field('jambFormStatus').textContent, /Calculate a new planning aggregate/);
    ui.window.saveJambActionPack();
    ui.window.downloadJambActionPack();
    ui.window.printJambWorksheet();
    assert.equal(JSON.stringify(ui.effects.saves), prior);
    assert.equal(ui.effects.downloads, 0);
    assert.equal(ui.effects.prints, 0);
  });
}

test('loading sample scores invalidates a prior result, preserves saved record, and calculates the new sample only on request', () => {
  const ui = loadWorksheet();
  ui.window.calculate();
  ui.window.saveJambActionPack();
  const prior = JSON.stringify(ui.effects.saves);
  ui.window.loadJambSample();
  assert.equal(ui.field('resultCard').classList.contains('hidden'), true);
  assert.equal(ui.field('postUtme').value, '68');
  ui.window.saveJambActionPack();
  assert.equal(JSON.stringify(ui.effects.saves), prior);
  ui.window.calculate();
  assert.equal(ui.field('aggregateScore').textContent, '69.00');
  assert.equal(ui.field('resultCard').classList.contains('hidden'), false);
  assert.equal(JSON.stringify(ui.effects.saves), prior);
});

test('Reset clears current inputs/result without deleting the saved worksheet', () => {
  const ui = loadWorksheet();
  ui.window.calculate();
  ui.window.saveJambActionPack();
  const prior = JSON.stringify(ui.effects.saves);
  ui.window.resetForm();
  assert.equal(ui.field('utme').value, '');
  assert.equal(ui.field('resultCard').classList.contains('hidden'), true);
  assert.equal(JSON.stringify(ui.effects.saves), prior);
});

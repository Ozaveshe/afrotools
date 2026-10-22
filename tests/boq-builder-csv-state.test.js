'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../assets/js/engines/boq-builder-engine.js');
const html = fs.readFileSync(path.join(__dirname, '../tools/boq-builder/app.html'), 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  .find(match => match[1].includes('var CATEGORIES ='))[1];
const clone = value => JSON.parse(JSON.stringify(value));
const csv = rows => rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\n');
const header = ['Category', 'Description', 'Unit', 'Quantity', 'Rate', 'Amount'];

function load() {
  const fields = new Map();
  const outputs = [...html.matchAll(/<button\b[^>]*data-boq-output[^>]*>/g)].map(() => ({ disabled: false }));
  const effects = { downloads: [], shares: [], copies: [], windows: 0, alerts: [], saved: [] };
  const defaults = { projCurrency: 'NGN', contingencyPct: '10', vatPct: '7.5', markupPct: '0' };
  const document = {
    getElementById(id) {
      if (!fields.has(id)) {
        const classes = new Set();
        fields.set(id, { value: defaults[id] || '', textContent: '', innerHTML: '', hidden: id === 'boqError',
          classList: { add(v) { classes.add(v); }, remove(v) { classes.delete(v); },
            contains(v) { return classes.has(v); }, toggle(v) { if (classes.has(v)) classes.delete(v); else classes.add(v); } },
          querySelectorAll() { return []; }, focus() {}, click() {}
        });
      }
      return fields.get(id);
    },
    querySelectorAll(selector) { return selector === '[data-boq-output]' ? outputs : []; },
    addEventListener() {},
    createElement() { return { click() { effects.downloads.push(currentBlob); } }; }
  };
  let currentBlob;
  class FileReader {
    readAsText(file) { this.onload({ target: { result: file.text } }); }
  }
  class SaveState {
    save(entry) { const copy = clone(entry); effects.saved.push(copy); return { id: entry.id || 'synthetic-draft' }; }
  }
  SaveState.message = error => error.message;
  const window = { location: { search: '' }, SaveState,
    open() { effects.windows++; throw new Error('Unexpected print window during invalid calculation'); } };
  const context = vm.createContext({ window, document, BOQBuilderEngine: engine, FileReader, Blob, URLSearchParams,
    URL: { createObjectURL(blob) { currentBlob = blob; return 'blob:synthetic'; } },
    alert(message) { effects.alerts.push(message); }, confirm() { return true; }, setTimeout() {},
    navigator: {
      share(value) { effects.shares.push(value); return Promise.resolve(); },
      clipboard: { writeText(value) { effects.copies.push(value); return Promise.resolve(); } }
    }
  });
  vm.runInContext(script, context, { filename: 'tools/boq-builder/app.html#maintained-script' });
  return { api: context, field: id => document.getElementById(id), effects, outputs,
    import(text) { context.handleCSVImport({ target: { files: [{ text }], value: 'synthetic.csv' } }); },
    row(category = 'substructure') { return context.getCat(category).items.find(item => item.desc || item.qty || item.rate); }
  };
}

test('the supplied quoted-comma import preserves description, cubic unit, quantity, rate and recalculated amount', () => {
  const ui = load();
  ui.import(csv([header, ['Substructure', 'Concrete, grade C25', 'm³', '2', '100', '9999']]));
  const item = ui.row();
  assert.equal(item.desc, 'Concrete, grade C25');
  assert.equal(item.unit, 'm³');
  assert.equal(item.qty, '2');
  assert.equal(item.rate, '100');
  assert.equal(item._amount, 200, 'imported Amount is not trusted over the real engine');
});

for (const description of ['Concrete, grade "C25"', 'First lift\nSecond lift', 'First lift\r\nSecond lift', '  measured finish  ']) {
  test('actual CSV export/import round-trips ' + JSON.stringify(description), async () => {
    const ui = load();
    ui.api.getCat('substructure').items = [{ desc: description, unit: 'm³', qty: '2.5', rate: '100' }];
    ui.api.recalcAll();
    ui.api.exportCSV();
    const text = await ui.effects.downloads[0].text();
    const reopened = load();
    reopened.import(text);
    assert.equal(reopened.row().desc, description);
    assert.equal(reopened.row().unit, 'm³');
    assert.equal(reopened.row().qty, '2.5');
    assert.equal(reopened.row().rate, '100');
    assert.equal(reopened.row()._amount, 250);
  });
}

test('UTF-8 BOM and CRLF records import without losing existing unlabelled numeric work', () => {
  const ui = load();
  ui.api.getCat('substructure').items = [{ desc: '', unit: 'm²', qty: '3', rate: '50' }];
  ui.api.recalcAll();
  ui.import('\uFEFF' + csv([header, ['Substructure', 'Second item', 'nr', '0', '20', '0']]).replace(/\n/g, '\r\n'));
  const items = ui.api.getCat('substructure').items;
  assert.equal(items.length, 2);
  assert.equal(items[0].qty, '3');
  assert.equal(items[0].rate, '50');
  assert.equal(items[1].qty, '0');
  assert.equal(items[1]._amount, 0);
});

for (const bad of [
  csv([header, ['Substructure', 'Valid first row', 'm³', '2', '100', '200']]) + '\n"Unclosed',
  csv([header, ['Substructure', 'Invalid quantity', 'm³', '-2', '100', '200']]),
  csv([header, ['Unknown category', 'Must not become preliminaries', 'm³', '2', '100', '200']])
]) {
  test('failed CSV import is atomic and keeps draft, totals and saved records: ' + bad.slice(-28), () => {
    const ui = load();
    ui.api.getCat('preliminaries').items = [{ desc: 'Existing work', unit: 'sum', qty: '10', rate: '250' }];
    ui.api.recalcAll();
    ui.api.saveBOQ();
    const before = JSON.stringify(ui.api.CATEGORIES);
    const saved = JSON.stringify(ui.effects.saved);
    const total = ui.field('rtGrand').textContent;
    ui.import(bad);
    assert.equal(JSON.stringify(ui.api.CATEGORIES), before);
    assert.equal(JSON.stringify(ui.effects.saved), saved);
    assert.equal(ui.field('rtGrand').textContent, total);
    assert.match(ui.field('boqStatus').textContent, /CSV not imported/);
  });
}

for (const [name, mutate, message] of [
  ['negative quantity', ui => { ui.api.getCat('preliminaries').items[0].qty = '-10'; }, /Preliminaries.*item 1.*Quantity/],
  ['invalid rate', ui => { ui.api.getCat('preliminaries').items[0].rate = 'invalid'; }, /Preliminaries.*item 1.*Rate/],
  ['VAT over 100', ui => { ui.field('vatPct').value = '101'; }, /VAT.*100%/]
]) {
  test(name + ' clears obsolete totals and computed actions, preserves entries/saves, and recovers', () => {
    const ui = load();
    ui.api.getCat('preliminaries').items = [{ desc: 'Existing work', unit: 'sum', qty: '10', rate: '250' }];
    ui.api.recalcAll();
    assert.match(ui.field('rtGrand').textContent, /2,956\.25/);
    ui.api.saveBOQ();
    const saved = JSON.stringify(ui.effects.saved);
    mutate(ui);
    const raw = clone(ui.api.getCat('preliminaries').items[0]);
    assert.doesNotThrow(() => ui.api.recalcSummary());
    assert.match(ui.field('boqError').textContent, message);
    assert.equal(ui.field('boqError').hidden, false);
    assert.equal(ui.field('rtGrand').textContent, '—');
    assert.equal(ui.field('rtSubtotal').textContent, '—');
    assert.equal(ui.field('summaryTotals').innerHTML, '');
    assert.equal(ui.field('amt-preliminaries-0').textContent, '—');
    assert.equal(ui.outputs.length, 4);
    assert.ok(ui.outputs.every(button => button.disabled));
    for (const id of ['desc', 'unit', 'qty', 'rate']) assert.equal(ui.api.getCat('preliminaries').items[0][id], raw[id]);
    ui.api.exportCSV(); ui.api.exportPDF(); ui.api.shareBOQ(); ui.api.showTenderQA(); ui.api.copyTenderQA();
    assert.equal(ui.effects.downloads.length + ui.effects.windows + ui.effects.shares.length + ui.effects.copies.length, 0);
    assert.equal(JSON.stringify(ui.effects.saved), saved);
    ui.api.getCat('preliminaries').items[0].qty = '2';
    ui.api.getCat('preliminaries').items[0].rate = '100';
    ui.field('vatPct').value = '7.5';
    ui.api.recalcAll();
    assert.equal(ui.field('boqError').hidden, true);
    assert.match(ui.field('rtGrand').textContent, /236\.50/);
    assert.ok(ui.outputs.every(button => !button.disabled));
    assert.equal(JSON.stringify(ui.effects.saved), saved);
  });
}

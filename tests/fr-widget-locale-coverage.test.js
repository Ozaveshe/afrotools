const assert = require('node:assert/strict');
const test = require('node:test');
const pack = require('../widgets/lite/widget-pack.js');

test('every localised widget defines a French label for each calculator input', () => {
  for (const spec of pack.specs) {
    const french = pack.frenchWidget(spec.id);
    if (!french) continue;
    assert.ok(french.title && french.description, spec.id);
    assert.deepEqual(Object.keys(french.fields).sort(), spec.fields.map(field => field.id).sort(), spec.id);
    for (const label of Object.values(french.fields)) assert.ok(label.trim(), spec.id);
    assert.ok(french.result || (french.resultLabel && french.note), spec.id);
  }
});

test('French import fees and returns describe the quantities actually calculated', () => {
  for (const id of ['landed-cost-lite', 'fx-landed-price']) {
    assert.equal(pack.byId(id).calc.type, 'percent-cost');
    assert.match(pack.frenchWidget(id).resultLabel, /frais|supplément/i);
  }
  assert.equal(pack.byId('export-margin-widget').calc.type, 'roi');
  assert.match(pack.frenchWidget('export-margin-widget').resultLabel, /sur coûts/);
});

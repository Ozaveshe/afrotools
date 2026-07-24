const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../assets/js/engines/inventory-planner.js');

function item(overrides = {}) {
  const parsed = engine.normalizeItem(Object.assign({ name: 'Soap', sku: 'S-1', category: 'Care', unitCost: 10, sellPrice: 15, quantity: 4, reorderPoint: 4, targetStock: 12 }, overrides));
  assert.equal(parsed.ok, true, parsed.errors && parsed.errors.join(' '));
  return parsed.item;
}

test('zero inventory and zero values are valid', () => {
  assert.deepEqual(engine.summarize([]), { totalProducts: 0, lowStock: 0, stockCostValue: 0, potentialSales: 0, potentialGrossProfit: 0, suggestedReorderUnits: 0 });
  assert.equal(engine.normalizeItem({ name: 'Sample', cost: 0, sell: 0, stock: 0, minStock: 0 }).ok, true);
});
test('formula terminology stays exact and equality is low stock', () => {
  const result = engine.calculateItem(item());
  assert.deepEqual(result, { costValue: 40, potentialSales: 60, potentialGrossProfit: 20, lowStock: true, suggestedReorder: 8 });
});
test('signed loss and fractional quantities remain valid', () => {
  const result = engine.calculateItem(item({ unitCost: 12, sellPrice: 8, quantity: 2.5, reorderPoint: 1, targetStock: '' }));
  assert.equal(result.potentialGrossProfit, -10);
  assert.equal(result.suggestedReorder, null);
});
test('negative, non-finite and malformed numbers are rejected', () => {
  for (const bad of [-1, Infinity, '12x']) assert.equal(engine.normalizeItem({ name: 'Bad', cost: bad, sell: 1, stock: 1, minStock: 1 }).ok, false);
});
test('legacy migration uses stable source-qualified ids and exact dedupe only', () => {
  const en = [{ name: 'Soap', category: 'Care', cost: 10, sell: 15, stock: 4, minStock: 2 }];
  const sw = [{ name: 'Soap', category: 'Care', cost: 10, sell: 15, qty: 4, low: 2 }, { name: 'Soap', sku: 'DIFFERENT', cost: 10, sell: 15, qty: 4, low: 2 }];
  const first = engine.migrateLegacy(en, sw);
  const second = engine.migrateLegacy(en, sw);
  assert.equal(first.ok, true);
  assert.equal(first.duplicates, 1);
  assert.equal(first.items.length, 2);
  assert.deepEqual(first.items.map(x => x.id), second.items.map(x => x.id));
  assert.match(first.items[0].id, /^inv-legacy-en-/);
});
test('strict versioned import limits and validation do not return partial data', () => {
  assert.equal(engine.parseBackupText('[]').ok, false);
  assert.equal(engine.parseBackupText('{}', engine.LIMITS.maxFileBytes + 1).ok, false);
  const payload = { schemaVersion: 2, tool: 'inventory', displayUnit: 'KES', items: [{ name: 'Good', cost: 1, sell: 2, stock: 3, minStock: 1 }, { name: 'Bad', cost: -1, sell: 2, stock: 3, minStock: 1 }] };
  const parsed = engine.parseBackupText(JSON.stringify(payload));
  assert.equal(parsed.ok, false);
  assert.deepEqual(parsed.items, []);
});
test('record and text limits are enforced', () => {
  const tooMany = Array.from({ length: engine.LIMITS.maxRecords + 1 }, (_, i) => ({ name: `P${i}`, cost: 1, sell: 2, stock: 1, minStock: 0 }));
  assert.equal(engine.parseBackupObject({ schemaVersion: 2, tool: 'inventory', items: tooMany }).ok, false);
  const parsed = engine.normalizeItem({ name: 'x'.repeat(200), sku: 's'.repeat(100), category: 'c'.repeat(100), cost: 1, sell: 2, stock: 1, minStock: 0 });
  assert.equal(parsed.item.name.length, engine.LIMITS.maxName);
  assert.equal(engine.parseBackupObject({ schemaVersion: 2, tool: 'inventory', items: [{ name: 'x'.repeat(121), cost: 1, sell: 2, stock: 1, minStock: 0 }] }).ok, false);
});
test('merge preserves distinct records and formula-safe CSV neutralizes spreadsheet formulas', () => {
  const a = item({ id: 'one', name: '=HYPERLINK("bad")' });
  const b = item({ id: 'two', sku: 'different' });
  const merged = engine.mergeItems([a], [a, b]);
  assert.equal(merged.items.length, 2);
  assert.equal(merged.duplicates, 1);
  const csv = engine.toCsv([a], 'USD');
  assert.match(csv, /"'=HYPERLINK/);
  assert.match(csv, /"Stock cost value"/);
});

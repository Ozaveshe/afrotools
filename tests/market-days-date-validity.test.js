const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/pages/market-days-trip.js'), 'utf8');
let validator;
function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'FunctionDeclaration' && node.id.name === 'isValidLookupDate') {
    assert.equal(validator, undefined);
    validator = source.slice(node.start, node.end);
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
  }
}
visit(acorn.parse(source, { ecmaVersion: 'latest' }));
assert.ok(validator);
const sandbox = { window: { AfroTools: { engines: {} } }, Intl, Date, Math, RegExp, Number, String, Object, Array };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/engines/igbo-market-days.js'), 'utf8'), sandbox);
const engine = sandbox.window.AfroTools.engines.igboMarketDays;
const context = { Date, engine: () => engine };
vm.runInNewContext(validator, context);

for (const value of ['0000-01-01', '0001-01-01', '0099-12-31', '0100-01-01', '0999-01-01']) {
  test(`trip validation rejects ${value}, which the calendar cannot represent exactly`, () => {
    assert.notEqual(engine.toDateKey(engine.parseDateKey(value)), value);
    assert.equal(context.isValidLookupDate(value), false);
  });
}
for (const value of ['1000-01-01', '1900-01-01', '2000-02-29', '2024-02-29', '2026-01-04', '9999-12-31']) {
  test(`trip validation accepts exactly represented date ${value}`, () => {
    assert.equal(engine.toDateKey(engine.parseDateKey(value)), value);
    assert.equal(context.isValidLookupDate(value), true);
  });
}
for (const value of ['2026-02-31', '2026-02-29', '2026-13-01', '2026-00-01', '2026-04-31', '2026-01-00', '', 'not-a-date']) {
  test(`trip validation keeps rejecting impossible or incomplete date ${JSON.stringify(value)}`, () => {
    assert.equal(context.isValidLookupDate(value), false);
  });
}

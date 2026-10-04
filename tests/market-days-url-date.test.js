const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const controller = fs.readFileSync(path.join(root, 'assets/js/pages/market-days.js'), 'utf8');
const ast = acorn.parse(controller, { ecmaVersion: 'latest' });
const candidates = [];
function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'ConditionalExpression' && node.consequent.type === 'Identifier' &&
      node.alternate.type === 'CallExpression' && node.alternate.callee.type === 'MemberExpression' &&
      node.alternate.callee.property.name === 'getTodayDateKey') candidates.push(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
  }
}
visit(ast);
assert.equal(candidates.length, 1, 'one actual URL-date initializer');
const selection = candidates[0];
const engineSandbox = { window: { AfroTools: { engines: {} } }, Intl, Date, Math, RegExp, Number, String, Object, Array };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/engines/igbo-market-days.js'), 'utf8'), engineSandbox);
const engine = engineSandbox.window.AfroTools.engines.igboMarketDays;
const today = '2026-10-04';
function selectDate(input) {
  const api = Object.create(engine);
  api.getTodayDateKey = zone => { assert.equal(zone, 'Africa/Lagos'); return today; };
  const context = {
    [selection.alternate.callee.object.name]: api,
    [selection.consequent.name]: input,
    [selection.alternate.arguments[0].name]: 'Africa/Lagos'
  };
  return vm.runInNewContext(controller.slice(selection.start, selection.end), context, { timeout: 500 });
}

for (const input of ['2026-02-31', '2026-02-29', '2026-13-01', '2026-00-01', '2026-04-31', '2026-01-00']) {
  test(`impossible URL date ${input} falls back to Nigeria today`, () => assert.equal(selectDate(input), today));
}
for (const input of ['2024-02-29', '2000-02-29', '2026-01-01']) {
  test(`valid URL date ${input} stays selected`, () => {
    assert.equal(selectDate(input), input);
    assert.equal(engine.toDateKey(engine.parseDateKey(input)), input);
  });
}
test('missing or malformed URL dates keep the existing Nigeria-today fallback', () => {
  for (const input of [null, '', '2026-2-1', 'not-a-date']) assert.equal(selectDate(input), today);
});

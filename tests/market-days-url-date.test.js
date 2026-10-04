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

const lookupListeners = [], declarations = new Map();
function inspectLookup(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'FunctionDeclaration' && node.id) declarations.set(node.id.name, node);
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' &&
      node.callee.property.name === 'addEventListener' &&
      node.callee.object.type === 'MemberExpression' && node.callee.object.property.name === 'lookupDate' &&
      ['input', 'change'].includes(node.arguments[0].value)) lookupListeners.push(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(inspectLookup);
    else if (value && typeof value === 'object') inspectLookup(value);
  }
}
inspectLookup(ast);
assert.equal(lookupListeners.length, 2, 'actual date input and change registrations');
function lookupSignal(type, value) {
  const calls = [], callbacks = {}, state = { currentMonthDate: new Date(Date.UTC(2026, 0, 1)) };
  const context = {
    Date, a: engine, d: state,
    s: key => calls.push(`selected:${key}`),
    invalidateShare: () => calls.push('invalidate'),
    l: { lookupDate: { addEventListener: (name, callback) => { callbacks[name] = callback; } } }
  };
  const named = new Set(lookupListeners.map(node => node.arguments[1])
    .filter(node => node.type === 'Identifier' && node.name !== 'invalidateShare').map(node => node.name));
  for (const name of named) {
    assert.ok(declarations.has(name), `actual callback declaration ${name}`);
    const node = declarations.get(name);
    vm.runInNewContext(controller.slice(node.start, node.end), context, { timeout: 500 });
  }
  for (const node of lookupListeners) vm.runInNewContext(controller.slice(node.start, node.end), context, { timeout: 500 });
  assert.equal(typeof callbacks[type], 'function');
  callbacks[type]({ target: { value } });
  return { calls, month: engine.toDateKey(state.currentMonthDate) };
}
for (const type of ['input', 'change']) {
  for (const value of ['2026-01-04', '2024-02-29', '2000-02-29']) {
    test(`${type} immediately selects valid date ${value} after invalidating old sharing`, () => {
      const result = lookupSignal(type, value);
      assert.deepEqual(result.calls, ['invalidate', `selected:${value}`]);
      assert.equal(result.month, `${value.slice(0, 7)}-01`);
    });
  }
  for (const value of ['2026-02-31', '2026-02-29', '2026-13-01', '2026-00-01', '2026-04-31', '2026-01-00', '', 'not-a-date']) {
    test(`${type} rejects impossible or incomplete date ${JSON.stringify(value)}`, () => {
      const result = lookupSignal(type, value);
      assert.deepEqual(result.calls, ['invalidate']);
      assert.equal(result.month, '2026-01-01');
    });
  }
}

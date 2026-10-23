const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the maintained whole controller and engine. The DOM adapter supplies
// only its existing inputs/events; it performs no calculations or network I/O.
function fixture() {
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'tools/percentage-calc/index.html'), 'utf8');
  const nodes = new Map(), inputs = [], tabs = [], panels = [], tips = [], actions = [];
  const copied = [], downloaded = [];
  let focused;
  function node(id = '') {
    const handlers = {}, classes = new Set();
    return { id, dataset: {}, hidden: false, disabled: false, textContent: '', value: '', children: [],
      classList: { toggle(c, on) { if (on) classes.add(c); else classes.delete(c); } },
      addEventListener(type, fn) { handlers[type] = fn; },
      emit(type, extra = {}) { return handlers[type]?.({ preventDefault() {}, ...extra }); },
      click() { if (!this.disabled) this.emit('click'); },
      focus() { focused = id; }, setAttribute() {},
      append(...children) { this.children.push(...children); },
      appendChild(child) { this.children.push(child); }
    };
  }
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) nodes.set(match[1], node(match[1]));
  for (const match of html.matchAll(/<input\b[^>]*>/g)) {
    const tag = match[0], id = /\bid="([^"]+)"/.exec(tag)?.[1];
    if (!id) continue;
    const input = nodes.get(id);
    input.value = /\bvalue="([^"]*)"/.exec(tag)?.[1] || '';
    const mode = /data-calculate-mode="(\d)"/.exec(tag)?.[1];
    if (mode) { input.dataset.calculateMode = mode; inputs.push(input); }
  }
  for (let mode = 1; mode <= 6; mode++) {
    const tab = nodes.get('tab-' + mode), panel = nodes.get('mode-' + mode);
    assert.ok(tab && panel, 'real page declares mode ' + mode);
    tab.dataset.mode = String(mode); tabs.push(tab);
    panel.result = node(); panel.error = node(); panel.actions = [];
    panel.querySelector = selector => selector === '.mode-error' ? panel.error : null;
    panel.querySelectorAll = selector => selector === '.result-box' ? [panel.result] : selector === '.result-action' ? panel.actions : [];
    for (const kind of ['copy', 'download', 'print']) {
      const button = node(); button.dataset[kind + 'Mode'] = String(mode);
      button.kind = kind; panel.actions.push(button); actions.push(button);
    }
    panels.push(panel);
  }
  for (const match of html.matchAll(/data-tip="([^"]+)"/g)) {
    const button = node(); button.dataset.tip = match[1]; tips.push(button);
  }
  const document = { body: { dataset: {} }, getElementById: id => nodes.get(id),
    createElement: () => node(),
    querySelectorAll(selector) {
      if (selector === '.mode-tab') return tabs;
      if (selector === '.mode-content') return panels;
      if (selector === '[data-calculate-mode]') return inputs;
      if (selector === '.tip-btn') return tips;
      const kind = /^\[data-(copy|download|print)-mode\]$/.exec(selector)?.[1];
      return kind ? actions.filter(a => a.kind === kind) : [];
    }
  };
  const sandbox = { document, Intl, console,
    navigator: { clipboard: { writeText(text) { copied.push(text); return Promise.resolve(); } } },
    Blob: class { constructor(parts) { this.text = parts.join(''); } },
    URL: { createObjectURL(blob) { downloaded.push(blob.text); return 'blob:synthetic'; }, revokeObjectURL() {} },
    print() {}, setTimeout(fn) { fn(); }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const name of ['percentage-engine.js', 'percentage-vip.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'tools/percentage-calc', name), 'utf8'), sandbox, { filename: name });
  }
  return { nodes, panels, tabs, copied, downloaded, focused: () => focused,
    input(id, value, event = 'input') { const n = nodes.get(id); n.value = value; n.emit(event); },
    action(mode, kind) { return panels[mode - 1].actions.find(a => a.kind === kind); }
  };
}

const cases = [
  { mode: 1, invalid: ['p1_pct', ''], valid: [['p1_pct', '12.5'], ['p1_val', '80']], result: ['r1', '10'] },
  { mode: 2, invalid: ['p2_y', '0'], valid: [['p2_y', '400']], result: ['r2', '12.5%'] },
  { mode: 3, initial: [['p3_orig', '-100'], ['p3_new', '-50']], invalid: ['p3_orig', '0'], valid: [['p3_orig', '-200']], result: ['r3', '+75%'] },
  { mode: 4, invalid: ['p4_disc', '101'], valid: [['p4_disc', '50']], result: ['r4', '500'] },
  { mode: 5, invalid: ['p5_split', '0'], valid: [['p5_split', '4']], result: ['r5_per', '1,375'] },
  { mode: 6, invalid: ['p6_sell', '0'], valid: [['p6_sell', '1200']], result: ['r6_margin', '50%'] }
];
for (const scenario of cases) test(`mode ${scenario.mode}: invalid input hides stale result and recovery restores a current export`, async () => {
  const f = fixture(), panel = f.panels[scenario.mode - 1];
  f.tabs[scenario.mode - 1].click();
  for (const [id, value] of scenario.initial || []) f.input(id, value);
  assert.equal(panel.result.hidden, false);
  const oldResult = f.nodes.get(scenario.result[0]).textContent;
  f.input(...scenario.invalid);
  assert.equal(panel.result.hidden, true, 'all result contents must be hidden, including prior secondary values');
  assert.equal(panel.error.hidden, false);
  assert.ok(panel.error.textContent.length > 0);
  assert.ok(panel.actions.every(a => a.disabled));
  // Direct callback probes also exercise reportText's independent invalid guard.
  f.action(scenario.mode, 'copy').emit('click');
  f.action(scenario.mode, 'download').emit('click');
  assert.deepEqual(f.copied, []); assert.deepEqual(f.downloaded, []);
  for (const [id, value] of scenario.valid) f.input(id, value);
  assert.equal(panel.result.hidden, false);
  assert.equal(panel.error.hidden, true); assert.equal(panel.error.textContent, '');
  assert.ok(panel.actions.every(a => !a.disabled));
  assert.equal(f.nodes.get(scenario.result[0]).textContent, scenario.result[1]);
  assert.notEqual(f.nodes.get(scenario.result[0]).textContent, oldResult);
  f.action(scenario.mode, 'copy').click(); f.action(scenario.mode, 'download').click();
  await Promise.resolve();
  assert.equal(f.copied.length, 1); assert.equal(f.downloaded.length, 1);
  assert.equal(f.copied[0], f.downloaded[0]);
  assert.ok(f.downloaded[0].includes(scenario.result[1].replace(/^\+/, '')));
});

test('history, keyboard tabs and valid zero-cost margin retain their existing behavior', () => {
  const f = fixture();
  f.tabs[0].emit('keydown', { key: 'End' });
  assert.equal(f.focused(), 'tab-6');
  assert.equal(f.panels[5].hidden, false);
  f.input('p6_cost', '0', 'change');
  assert.equal(f.nodes.get('r6_markup').textContent, 'Not defined');
  assert.equal(f.panels[5].result.hidden, false);
  const list = f.nodes.get('histList'), completed = list.children.length;
  f.input('p6_sell', '0', 'change');
  assert.equal(list.children.length, completed, 'invalid values do not add completed history');
  f.nodes.get('clearHistory').click();
  assert.equal(f.nodes.get('percentageStatus').textContent, 'Session history cleared.');
});

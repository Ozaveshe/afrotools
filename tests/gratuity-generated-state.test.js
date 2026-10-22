'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
// Import the maintained Python generator without invoking its write-mode main.
const render = `import json,runpy,sys
m=runpy.run_path(sys.argv[1])
t=next(t for t in m['TOOLS'] if t['result_template']=='severance')
print(json.dumps([{'code':c[0],'html':m['gen_country_page'](t,*c)} for c in m['COUNTRIES_54']]))`;
const pages = JSON.parse(execFileSync(process.platform === 'win32' ? 'python' : 'python3',
  ['-I', '-B', '-c', render, path.join(root, 'generate_hr_tools.py')],
  { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 15000 }));

function boot(code = 'BW') {
  const html = pages.find(page => page.code === code).html;
  const ids = new Map();
  const document = { activeElement: null, getElementById: id => ids.get(id) || null };
  for (const match of html.matchAll(/<(?:input|button|div|p|span)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const attributes = Object.fromEntries([...match[0].matchAll(/([\w-]+)(?:="([^"]*)")?/g)]
      .map(attr => [attr[1], attr[2] ?? '']));
    const classes = new Set((attributes.class || '').split(/\s+/));
    const listeners = new Map();
    ids.set(match[1], {
      value: attributes.value || '', hidden: Object.hasOwn(attributes, 'hidden'),
      innerHTML: '', textContent: '', attributes,
      classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
      addEventListener(name, fn) { const list = listeners.get(name) || []; list.push(fn); listeners.set(name, list); },
      dispatch(name) { for (const fn of listeners.get(name) || []) fn.call(this, { target: this }); },
      setAttribute(name, value) { attributes[name] = String(value); },
      removeAttribute(name) { delete attributes[name]; },
      getAttribute(name) { return Object.hasOwn(attributes, name) ? attributes[name] : null; },
      focus() { document.activeElement = this; }
    });
  }
  const alerts = [];
  const context = vm.createContext({ document, alert: message => alerts.push(message) });
  context.window = context;
  for (const file of ['data/hr/employer-cost-data.js', 'data/hr/severance-data.js', 'engines/employee-cost-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file, timeout: 1000 });
  }
  const engine = context.AfroTools.HREngine;
  const original = engine.calculateSeverance;
  const calls = [];
  const outcomes = [];
  engine.calculateSeverance = function (...args) {
    calls.push(args);
    const result = original.apply(this, args);
    outcomes.push(result);
    return result;
  };
  const controller = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).find(source => source.includes('var CC='));
  assert.ok(controller, 'execute the actual generated inline controller');
  vm.runInContext(controller, context, { filename: `generated-${code}.js`, timeout: 1000 });
  function set(id, value, event = 'input') { ids.get(id).value = String(value); ids.get(id).dispatch(event); }
  function calculate(salary, years) {
    if (salary !== undefined) set('lastSalary', salary);
    if (years !== undefined) set('yearsOfService', years);
    ids.get('calcBtn').dispatch('click');
  }
  function visible() { return !ids.get('results').hidden && ids.get('results').classList.contains('on'); }
  return { html, ids, document, calls, outcomes, alerts, set, calculate, visible };
}

test('all 54 emitted gratuity forms expose required decimal inputs and field-error targets', () => {
  assert.equal(pages.length, 54);
  for (const page of pages) {
    for (const id of ['lastSalary', 'yearsOfService']) {
      const tag = page.html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))[0];
      assert.match(tag, /step="any"/);
      assert.match(tag, /inputmode="decimal"/);
      assert.match(tag, /\brequired\b/);
      assert.ok(page.html.includes(`id="${id}Error" role="alert" hidden`));
    }
  }
});

test('positive Botswana calculation keeps the real existing engine result', () => {
  const s = boot(); s.calculate(10000, 5);
  assert.equal(s.outcomes.at(-1).amount, 27273);
  assert.equal(s.visible(), true);
  assert.match(s.ids.get('results').innerHTML, /BWP 27,273/);
});

test('fractional inputs reach the genuine engine without truncation', () => {
  const s = boot(); s.calculate('10000.5', '1.5');
  assert.deepEqual(s.calls[0], ['BW', 10000.5, 1.5]);
  assert.equal(s.outcomes[0].amount, Math.round(10000.5 / 22 * 1.5 * 12));
  assert.equal(s.visible(), true);
});

test('empty or whitespace salary is an inline focused error, never a zero estimate', () => {
  for (const value of ['', '   ']) {
    const s = boot(); s.calculate(value, 5);
    assert.equal(s.calls.length, 0);
    assert.equal(s.visible(), false);
    assert.equal(s.ids.get('lastSalary').getAttribute('aria-invalid'), 'true');
    assert.equal(s.document.activeElement, s.ids.get('lastSalary'));
    assert.match(s.ids.get('lastSalaryError').textContent, /salary greater than zero/);
    assert.equal(s.alerts.length, 0);
  }
});

test('missing service years focuses that field without calculating', () => {
  const s = boot(); s.calculate(10000, '');
  assert.equal(s.calls.length, 0);
  assert.equal(s.document.activeElement, s.ids.get('yearsOfService'));
  assert.equal(s.ids.get('yearsOfService').getAttribute('aria-describedby'), 'yearsOfServiceError');
  assert.match(s.ids.get('yearsOfServiceError').textContent, /years of service/);
});

test('zero, negative, nonfinite or partially numeric salary cannot calculate', () => {
  for (const value of ['0', '-1', '-0.01', 'Infinity', '-Infinity', 'NaN', '1e309', '12abc']) {
    const s = boot(); s.calculate(value, 5);
    assert.equal(s.calls.length, 0, value);
    assert.equal(s.visible(), false, value);
    assert.equal(s.document.activeElement, s.ids.get('lastSalary'), value);
  }
});

test('negative and nonfinite service years cannot calculate', () => {
  for (const value of ['-1', '-0.25', 'Infinity', '-Infinity', 'NaN', '1e309', '5 years']) {
    const s = boot(); s.calculate(10000, value);
    assert.equal(s.calls.length, 0, value);
    assert.equal(s.visible(), false, value);
    assert.equal(s.document.activeElement, s.ids.get('yearsOfService'), value);
  }
});

test('zero service preserves existing arithmetic without inventing eligibility', () => {
  const s = boot(); s.calculate(10000, 0);
  assert.equal(s.outcomes[0].amount, 0);
  assert.equal(s.visible(), true);
});

test('editing salary immediately removes the previous amount until recalculated', () => {
  const s = boot(); s.calculate(10000, 5); s.set('lastSalary', 20000);
  assert.equal(s.visible(), false);
  assert.equal(s.ids.get('results').innerHTML, '');
  assert.equal(s.calls.length, 1);
  s.calculate();
  assert.equal(s.outcomes.at(-1).amount, 54545);
  assert.equal(s.visible(), true);
});

test('input and change events on either dependency invalidate without recalculating', () => {
  for (const id of ['lastSalary', 'yearsOfService']) {
    for (const event of ['input', 'change']) {
      const s = boot(); s.calculate(10000, 5); s.set(id, id === 'lastSalary' ? 20000 : 6, event);
      assert.equal(s.visible(), false, `${id}/${event}`);
      assert.equal(s.ids.get('results').innerHTML, '');
      assert.equal(s.calls.length, 1);
    }
  }
});

test('invalid-after-valid removes old content; correction clears error and recovers', () => {
  const s = boot(); s.calculate(10000, 5); s.set('lastSalary', ''); s.calculate();
  assert.equal(s.visible(), false);
  assert.equal(s.ids.get('results').innerHTML, '');
  assert.equal(s.ids.get('lastSalary').getAttribute('aria-invalid'), 'true');
  s.set('lastSalary', 20000);
  assert.equal(s.ids.get('lastSalary').getAttribute('aria-invalid'), null);
  assert.equal(s.ids.get('lastSalaryError').hidden, true);
  s.calculate();
  assert.equal(s.outcomes.at(-1).amount, 54545);
  assert.equal(s.visible(), true);
});

test('a nonrepresentable engine amount is not displayed as a financial result', () => {
  const s = boot(); s.calculate('1e308', 100);
  assert.equal(s.visible(), false);
  assert.equal(s.ids.get('results').innerHTML, '');
  assert.equal(s.alerts.at(-1), 'An estimate could not be calculated for these inputs.');
  assert.equal(s.ids.get('lastSalary').getAttribute('aria-invalid'), null);
});

test('both invalid fields expose messages and the first invalid field receives focus', () => {
  const s = boot(); s.calculate('', '');
  assert.equal(s.calls.length, 0);
  assert.equal(s.ids.get('lastSalaryError').hidden, false);
  assert.equal(s.ids.get('yearsOfServiceError').hidden, false);
  assert.equal(s.document.activeElement, s.ids.get('lastSalary'));
});

test('all country controllers preserve finite results, existing errors and legal metadata', () => {
  for (const page of pages) {
    const s = boot(page.code); s.calculate('10000.5', '5.5');
    assert.equal(s.calls.length, 1, page.code);
    const r = s.outcomes[0];
    if (r.error) {
      assert.equal(s.visible(), false, page.code);
      assert.equal(s.ids.get('results').innerHTML, '', page.code);
      assert.equal(s.alerts.at(-1), r.error, page.code);
      continue;
    }
    if (r.computable !== false && !Number.isFinite(r.amount)) {
      assert.equal(s.visible(), false, page.code);
      assert.equal(s.ids.get('results').innerHTML, '', page.code);
      assert.equal(s.alerts.at(-1), 'An estimate could not be calculated for these inputs.', page.code);
      continue;
    }
    assert.equal(s.visible(), true, page.code);
    assert.ok(s.ids.get('results').innerHTML.includes(r.formatted), page.code);
    if (r.law) assert.ok(s.ids.get('results').innerHTML.includes(r.law), page.code);
    if (r.notes) assert.ok(s.ids.get('results').innerHTML.includes(r.notes), page.code);
  }
});

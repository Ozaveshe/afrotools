'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const context = vm.createContext({ window: {} });
for (const file of ['data/hr/employer-cost-data.js', 'data/hr/severance-data.js', 'engines/src/employee-cost-engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const calculate = (salary, years) => context.window.AfroTools.HREngine.calculateSeverance('MW', salary, years);
test('Malawi ordinary decimal inputs return ten weeks for five completed years', () => {
  const out = calculate(10000.5, 5.5);
  assert.equal(out.amount, 23078);
  assert.equal(out.totalWeeks, 10);
  assert.equal(out.completedYears, 5);
  assert.equal(out.currency, 'MWK');
  assert.equal(out.computable, true);
  assert.ok(Math.abs(out.amountBeforeRounding - 23078.076923076922) < 0.000001);
});
test('Malawi first completed year is the first severance step', () => {
  assert.equal(calculate(52000, 0).amount, 0);
  assert.equal(calculate(52000, 0.999).totalWeeks, 0);
  assert.equal(calculate(52000, 1).amount, 24000);
});
test('Malawi sixth completed year adds three weeks without repricing the first five', () => {
  assert.equal(calculate(52000, 5).amount, 120000);
  assert.equal(calculate(52000, 5.999).amount, 120000);
  assert.equal(calculate(52000, 6).amount, 156000);
});
test('Malawi eleventh completed year adds four weeks without repricing earlier years', () => {
  assert.equal(calculate(52000, 10).amount, 300000);
  assert.equal(calculate(52000, 10.999).amount, 300000);
  assert.equal(calculate(52000, 11).amount, 348000);
  assert.equal(calculate(52000, 20).totalWeeks, 65);
});
test('Malawi uses exact twelve-month/fifty-two-week conversion, not 4.33', () => {
  assert.equal(calculate(52000, 1).weeklyWage, 12000);
  const out = calculate(98000, 5);
  assert.equal(out.totalWeeks, 10);
  assert.equal(out.amount, 226154);
  assert.match(out.qualification, /weekly wage is not rounded first/);
});
test('Malawi missing, nonfinite and negative inputs cannot become a zero or NaN estimate', () => {
  for (const [salary, years] of [[null, 5], ['', 5], [undefined, 5], [NaN, 5], [Infinity, 5], [0, 5], [-1, 5], [100, null], [100, ''], [100, -1], [100, NaN], [100, Infinity]]) {
    assert.match(calculate(salary, years).error, /positive monthly wage/);
  }
  assert.match(calculate(Number.MAX_VALUE, 5).error, /numeric range/);
  assert.match(calculate(10000, Number.MAX_VALUE).error, /numeric range/);
});
test('Malawi result identifies conditional severance rather than pension-exempt gratuity', () => {
  const out = calculate(52000, 5.5);
  assert.match(out.law, /First Schedule Part I/);
  assert.match(out.notes, /not an automatic payment on every departure/);
  assert.match(out.notes, /Pension-exempt gratuity/);
  assert.match(out.sourceUrl, /MWI91385\.pdf$/);
});
test('missing Somalia rule stays distinguishable from a zero entitlement', () => {
  const out = context.window.AfroTools.HREngine.calculateSeverance('SO', 10000.5, 5.5);
  assert.equal(out.error, 'Country not found');
  assert.equal(out.amount, undefined);
});

// Run the real generator's one-page function, not its filesystem-writing main.
function generatedMalawi() {
  const { execFileSync } = require('node:child_process');
  const source = 'import json,runpy,sys\nm=runpy.run_path(sys.argv[1])\nt=next(t for t in m["TOOLS"] if t["slug"]=="gratuity-calculator")\nc=next(c for c in m["COUNTRIES_54"] if c[0]=="MW")\nprint(json.dumps(m["gen_country_page"](t,*c)))';
  return JSON.parse(execFileSync(process.platform === 'win32' ? 'python' : 'python3',
    ['-I', '-B', '-c', source, path.join(root, 'generate_hr_tools.py')],
    { encoding: 'utf8', timeout: 10000, maxBuffer: 256 * 1024 }));
}
function bootGeneratedMalawi() {
  const html = generatedMalawi(), ids = new Map(), alerts = [];
  const document = { activeElement: null, getElementById: id => ids.get(id) };
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    const attrs = {}, listeners = new Map(), classes = new Set();
    for (const attr of match[0].matchAll(/([\w-]+)="([^"]*)"/g)) attrs[attr[1]] = attr[2];
    ids.set(match[1], {
      value: '', hidden: /\bhidden\b/.test(match[0]), innerHTML: '', textContent: '',
      classList: { add: key => classes.add(key), remove: key => classes.delete(key), contains: key => classes.has(key) },
      setAttribute(key, value) { attrs[key] = value; }, getAttribute: key => attrs[key], removeAttribute(key) { delete attrs[key]; },
      focus() { document.activeElement = this; },
      addEventListener(key, listener) { listeners.set(key, [...(listeners.get(key) || []), listener]); },
      dispatch(key) { for (const listener of listeners.get(key) || []) listener.call(this, { target: this }); }
    });
  }
  const ctx = vm.createContext({ window: {}, document, alert: value => alerts.push(value) });
  for (const file of ['data/hr/employer-cost-data.js', 'data/hr/severance-data.js', 'engines/src/employee-cost-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  }
  const controller = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).find(script => script.includes('var CC='));
  assert.ok(controller);
  vm.runInContext(controller, ctx, { filename: 'actual-generated-malawi-controller.js', timeout: 1000 });
  return { html, ids, alerts, document, set(id, value) { ids.get(id).value = String(value); ids.get(id).dispatch('input'); }, click() { ids.get('calcBtn').dispatch('click'); } };
}
test('generated Malawi form explains qualifying wage and completed years before calculation', () => {
  const html = generatedMalawi();
  assert.match(html, /<title>Malawi Severance Pay Estimate \| AfroTools<\/title>/);
  assert.match(html, /for="lastSalary">Current qualifying monthly wage<\/label>/);
  assert.match(html, /Basic salary alone may not be the correct base/);
  assert.match(html, /5\.5 years uses 5 completed years/);
  assert.match(html, /For qualifying redundancy, retrenchment/);
});
test('generated Malawi result exposes the useful amount, source and rounding qualification', () => {
  const page = bootGeneratedMalawi();
  page.set('lastSalary', '10000.5'); page.set('yearsOfService', '5.5'); page.click();
  const result = page.ids.get('results');
  assert.equal(result.hidden, false);
  assert.match(result.innerHTML, /MK 23,078/);
  assert.match(result.innerHTML, /Conditional severance estimate/);
  assert.match(result.innerHTML, /Completed years used:<\/strong> 5/);
  assert.match(result.innerHTML, /Severance weeks:<\/strong> 10/);
  assert.match(result.innerHTML, /href="https:\/\/natlex\.ilo\.org\/dyn\/natlex2\/natlex2\/files\/download\/91385\/MWI91385\.pdf"/);
  assert.match(result.innerHTML, /Final total rounded to the nearest kwacha/);
  assert.match(result.innerHTML, /<details[^>]*><summary>Eligibility, wage components and exclusions/);
  assert.deepEqual(page.alerts, []);
});
test('generated Malawi preserves gs01 stale-result recovery and wage help association', () => {
  const page = bootGeneratedMalawi();
  page.set('lastSalary', '10000.5'); page.set('yearsOfService', '5.5'); page.click();
  page.set('lastSalary', '');
  assert.equal(page.ids.get('results').hidden, true);
  assert.equal(page.ids.get('results').innerHTML, '');
  page.click();
  assert.equal(page.document.activeElement, page.ids.get('lastSalary'));
  assert.equal(page.ids.get('lastSalary').getAttribute('aria-describedby'), 'mw-wage-help lastSalaryError');
  page.set('lastSalary', '10000.5'); page.set('yearsOfService', '6'); page.click();
  assert.match(page.ids.get('results').innerHTML, /Severance weeks:<\/strong> 13/);
  assert.equal(page.ids.get('lastSalary').getAttribute('aria-describedby'), 'mw-wage-help');
  assert.deepEqual(page.alerts, []);
});

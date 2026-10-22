'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');
const sourceRoot = process.env.AFROTOOLS_TEST_SOURCE_ROOT || path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(sourceRoot, 'ghana/gh-paye.html'), 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g), match => match[1]);
const source = scripts.find(script => script.includes('function computePAYE(gross)'));
assert.ok(source, 'actual maintained Ghana controller exists');
const body = acorn.parse(source, { ecmaVersion: 'latest' }).body.find(node => node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression').expression.callee.body.body;
const declarations = ['BANDS', 'SSNIT_CAP', 'SSNIT_EMP_RATE', 'SSNIT_EMPLOYER_RATE', 'TIER3_CAP_RATE', 'R', 'period', 'chartType', 'chartInstance', 'chartLoaded', 'calcMode', '$', 'fmt', 'pct', 'parseAmt', 'salaryRecalculationTimer'];
const functions = ['calcTax', 'computePAYE', 'reverseCalc', 'invalidateResult', 'calculationInputError', 'calculationAmount', 'calculate', 'exportPdf'];
const projected = [];
for (const node of body) {
  if (node.type === 'VariableDeclaration') for (const declaration of node.declarations) {
    if (declaration.id.type === 'Identifier' && declarations.includes(declaration.id.name)) projected.push(node.kind + ' ' + source.slice(declaration.start, declaration.end) + ';');
  }
  if (node.type === 'FunctionDeclaration' && functions.includes(node.id.name)) projected.push(source.slice(node.start, node.end));
}
// Only DOM/render/PDF sinks are synthetic. Genuine maintained input handlers,
// calculation functions, invalidation and export guard run verbatim; no page
// bootstrap, authentication, analytics, SDK, network or storage is imported.
function runtime() {
  const nodes = new Map();
  let active = null, renders = 0;
  const pdfs = [];
  function node(id) {
    if (!nodes.has(id)) {
      const attributes = new Map();
      nodes.set(id, { id, value: '', checked: false, disabled: false, style: {}, textContent: '',
        classList: { remove() {} }, setAttribute(key, value) { attributes.set(key, String(value)); },
        getAttribute(key) { return attributes.get(key) || null; }, removeAttribute(key) { attributes.delete(key); },
        replaceChildren() { this.textContent = ''; }, focus() { active = this.id; }, scrollIntoView() {} });
    }
    return nodes.get(id);
  }
  const context = { document: { getElementById: node }, setTimeout() { return 1; }, clearTimeout() {},
    console: { error() { throw new Error('Unexpected controller error'); } },
    window: { matchMedia: () => ({ matches: true }), AfroTools: { pdf: { generate: async report => pdfs.push(report) } } },
    renderResults() { renders++; }, showTier3Optimizer() {}, };
  vm.createContext(context);
  vm.runInContext(projected.join('\n') + '\nthis.controller = { calculate, invalidateResult, exportPdf, result: () => R, setMode: value => { calcMode = value; } };', context);
  node('salaryInput').value = '60000'; node('togSSNIT').checked = true;
  return { api: context.controller, node, pdfs, focus: () => active, setFocus: value => { active = value; }, renders: () => renders };
}
function unavailable(r) {
  assert.equal(r.api.result(), null);
  assert.equal(r.node('resultsCard').style.display, 'none');
  assert.equal(r.node('resultsCard').getAttribute('aria-hidden'), 'true');
  assert.equal(r.node('calcSaveBtn').disabled, true);
}
test('existing 60000 annual scenario retains the modeled tax, pension and take-home arithmetic', () => {
  const r = runtime(); r.api.calculate(false); const value = r.api.result();
  assert.equal(value.gross, 60000); assert.equal(value.ssnit, 3300); assert.equal(value.chargeableIncome, 56700);
  assert.equal(value.tax, 9429); assert.equal(value.netAnnual, 47271); assert.equal(value.totalEmployerCost, 67800);
});
test('formatted salary and a valid separate basic salary keep existing deductions', () => {
  const r = runtime(); r.node('salaryInput').value = '60,000.00'; r.node('basicSalary').value = '30000'; r.api.calculate(false);
  assert.equal(r.api.result().gross, 60000); assert.equal(r.api.result().basic, 30000); assert.equal(r.api.result().ssnit, 1650);
});
test('negative basic salary is rejected with persistent field feedback and original input retained', () => {
  const r = runtime(); r.node('basicSalary').value = '-1000'; r.api.calculate(); unavailable(r);
  assert.equal(r.node('basicSalary').value, '-1000'); assert.equal(r.node('basicSalary').getAttribute('aria-invalid'), 'true');
  assert.equal(r.node('basicSalary').getAttribute('aria-describedby'), 'calculationStatus');
  assert.match(r.node('calculationStatus').textContent, /basic salary/); assert.equal(r.focus(), 'basicSalary');
});
test('invalid edited basic salary retires the prior result and blocks actual export guard', async () => {
  const r = runtime(); r.api.calculate(false); await r.api.exportPdf(); assert.equal(r.pdfs.length, 1);
  r.node('basicSalary').value = '-1000'; r.api.invalidateResult(); r.api.calculate(false); unavailable(r);
  await r.api.exportPdf(); assert.equal(r.pdfs.length, 1);
});
test('malformed and nonfinite basic amounts cannot create negative or nonfinite payroll outputs', () => {
  for (const value of ['30000junk', 'NaN', 'Infinity', '1e309', '-1e309']) {
    const r = runtime(); r.node('basicSalary').value = value; r.api.calculate(false); unavailable(r);
    assert.equal(r.node('basicSalary').value, value); assert.match(r.node('calculationStatus').textContent, /basic salary/);
  }
});
test('enabled Tier III rejects negative contribution before calculating, retaining the draft', () => {
  const r = runtime(); r.node('togTier3').checked = true; r.node('tier3Amt').value = '-1200'; r.api.calculate(); unavailable(r);
  assert.equal(r.node('tier3Amt').value, '-1200'); assert.equal(r.focus(), 'tier3Amt');
  assert.match(r.node('calculationStatus').textContent, /Tier III/);
});
test('inactive Tier III draft remains ignored, and blank optional amounts preserve existing defaults', () => {
  const r = runtime(); r.node('tier3Amt').value = '-1200'; r.api.calculate(false);
  assert.equal(r.api.result().tier3, 0); assert.equal(r.api.result().netAnnual, 47271);
  r.node('togTier3').checked = true; r.node('tier3Amt').value = ''; r.api.calculate(false);
  assert.equal(r.api.result().tier3, 0); assert.equal(r.api.result().basic, 60000);
});
test('blank, zero, negative, malformed and nonfinite annual salaries leave no usable result', () => {
  for (const value of ['', '0', '-1', '60000junk', 'Infinity', '1e309']) {
    const r = runtime(); r.api.calculate(false); r.node('salaryInput').value = value; r.api.calculate(false); unavailable(r);
    assert.equal(r.node('salaryInput').value, value); assert.match(r.node('calculationStatus').textContent, /annual salary/);
  }
});
test('a corrected valid basic salary restores result and export without overwriting other described-by content', async () => {
  const r = runtime(); r.node('basicSalary').setAttribute('aria-describedby', 'basic-help'); r.node('basicSalary').value = '-1'; r.api.calculate(false);
  r.node('basicSalary').value = '30000'; r.api.calculate(false); assert.equal(r.api.result().ssnit, 1650);
  assert.equal(r.node('basicSalary').getAttribute('aria-invalid'), null); assert.equal(r.node('basicSalary').getAttribute('aria-describedby'), 'basic-help');
  assert.equal(r.node('calcSaveBtn').disabled, false); await r.api.exportPdf(); assert.equal(r.pdfs.length, 1);
  assert.match(r.pdfs[0].title, /Ghana PAYE/); assert.equal(r.node('calculationStatus').textContent, '');
});
test('debounced invalid calculation does not steal focus from a different field', () => {
  const r = runtime(); r.setFocus('tier3Amt'); r.node('basicSalary').value = '-1'; r.api.calculate(false); unavailable(r);
  assert.equal(r.focus(), 'tier3Amt');
});
test('net-to-gross rejects invalid basic before search and preserves valid reverse calculation', () => {
  const r = runtime(); r.api.setMode('net'); r.node('salaryInput').value = '47271'; r.node('basicSalary').value = '-1'; r.api.calculate(false); unavailable(r);
  r.node('basicSalary').value = ''; r.api.calculate(false); assert.ok(Math.abs(r.api.result().gross - 60000) < 2);
  assert.ok(Math.abs(r.api.result().netAnnual - 47271) < 1);
});
test('finite input that overflows reverse calculation fails closed before renderer or exports', async () => {
  const r = runtime(); r.api.setMode('net'); r.node('salaryInput').value = '1e308'; r.api.calculate(false); unavailable(r);
  assert.equal(r.renders(), 0); await r.api.exportPdf(); assert.equal(r.pdfs.length, 0);
  assert.match(r.node('calculationStatus').textContent, /too large/);
});

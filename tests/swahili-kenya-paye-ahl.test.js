const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

// Run the page's real controller; chart/network/UI libraries are unnecessary for payroll arithmetic.
const pagePath = process.env.AFROTOOLS_KE_PAGE || path.join(__dirname, '../sw/kenya/kikokotoo-kodi-mshahara/index.html');
const html = fs.readFileSync(pagePath, 'utf8');
const controller = Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi), m => m[1])
  .find(script => script.includes('function calculate()') && script.includes('function calcNSSF('));
assert.ok(controller, 'Swahili Kenya controller exists');

function node() {
  const classes = new Set();
  return {
    value: '50000', min: '15000', max: '1500000', style: {}, innerHTML: '', textContent: '',
    addEventListener() {}, setAttribute() {}, removeAttribute() {}, focus() {},
    classList: {
      contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c),
      toggle(c) { if (classes.has(c)) classes.delete(c); else classes.add(c); }
    }
  };
}

function run(gross, enabled = ['nssf', 'shif', 'ahl', 'personalrelief']) {
  const nodes = new Map();
  const get = key => { if (!nodes.has(key)) nodes.set(key, node()); return nodes.get(key); };
  const toggles = Object.fromEntries(['nssf', 'shif', 'ahl', 'personalrelief'].map(key => [key, node()]));
  enabled.forEach(key => toggles[key].classList.add('on'));
  const document = {
    getElementById: get,
    querySelector(selector) {
      const match = selector.match(/^\[data-tog="([^"]+)"\]$/);
      return match ? toggles[match[1]] : get(selector);
    },
    querySelectorAll: selector => selector === '[data-tog]' ? Object.values(toggles) : []
  };
  let printBlob;
  const context = vm.createContext({ document, window: { open() { return null; } }, setTimeout() {}, console, Blob,
    URL: { createObjectURL(blob) { printBlob = blob; return 'blob:test'; }, revokeObjectURL() {} } });
  vm.runInContext(controller, context, { filename: pagePath });
  get('salaryInput').value = String(gross);
  context.calculate();
  return { result: context.RESULT, nodes, context, printDocument: () => printBlob.text() };
}

function close(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 0.00001, `${label}: expected ${expected}, received ${actual}`);
}

// Independently worked KRA examples: first KES24,000 at 10%, next 8,333 at 25%, remainder at 30%.
// AHL is an allowable deduction (KRA PAYE guidance); it is still paid once from gross cash.
// https://www.kra.go.ke/individual/filing-paying/types-of-taxes/paye
const examples = [
  { toggles: [], taxable: 80000, paye: 16383.35, net: 63616.65 },
  { toggles: ['ahl'], taxable: 78800, paye: 16023.35, net: 62776.65 },
  { toggles: ['shif'], taxable: 77800, paye: 15723.35, net: 62076.65 },
  { toggles: ['shif', 'ahl'], taxable: 76600, paye: 15363.35, net: 61236.65 },
  { toggles: ['nssf'], taxable: 75200, paye: 14943.35, net: 60256.65 },
  { toggles: ['nssf', 'ahl'], taxable: 74000, paye: 14583.35, net: 59416.65 },
  { toggles: ['nssf', 'shif'], taxable: 73000, paye: 14283.35, net: 58716.65 },
  { toggles: ['nssf', 'shif', 'ahl'], taxable: 71800, paye: 13923.35, net: 57876.65 }
];

for (const sample of examples) {
  test(`KES80,000 deductions: ${sample.toggles.join('+') || 'none'}`, () => {
    const { result: r, nodes } = run(80000, [...sample.toggles, 'personalrelief']);
    close(r.taxable, sample.taxable, 'taxable');
    close(r.paye, sample.paye, 'PAYE');
    close(r.net, sample.net, 'net');
    close(r.gross - r.net, r.nssf + r.shif + r.ahl + r.paye, 'each cash deduction counted once');
    const rendered = nodes.get('resContent').innerHTML;
    if (sample.toggles.includes('ahl')) {
      assert.equal((rendered.match(/AHL/g) || []).length, 1, 'one employee AHL result row');
      assert.ok(rendered.indexOf('AHL') < rendered.indexOf('Mapato Yanayolipishwa Kodi'), 'AHL shown before taxable income');
    } else {
      assert.ok(!rendered.includes('AHL'), 'disabled AHL omitted from employee deductions');
    }
  });
}

test('resident relief toggle changes only PAYE and take-home', () => {
  const { result: r } = run(80000, ['nssf', 'shif', 'ahl']);
  close(r.taxable, 71800, 'taxable');
  close(r.personalRelief, 0, 'relief');
  close(r.paye, 16323.35, 'PAYE without relief');
  close(r.net, 55476.65, 'net without relief');
});

test('personal relief cannot create negative PAYE', () => {
  const { result: r } = run(24000);
  close(r.taxable, 21540, 'taxable');
  close(r.paye, 0, 'PAYE floor');
  close(r.net, 21540, 'net at PAYE floor');
});

test('AHL crossing the first band boundary reduces PAYE without duplicate cash subtraction', () => {
  const { result: r } = run(24300, ['ahl', 'personalrelief']);
  close(r.ahl, 364.5, 'AHL');
  close(r.taxable, 23935.5, 'taxable');
  close(r.paye, 0, 'PAYE');
  close(r.net, 23935.5, 'net');
});

test('2026 NSSF ceiling applies before and after KES108,000 boundary', () => {
  close(run(107999).result.nssf, 6479.94, 'below ceiling');
  close(run(108000).result.nssf, 6480, 'at ceiling');
  close(run(120000).result.nssf, 6480, 'above ceiling');
});

test('annual display multiplies the same result without charging AHL again', () => {
  const { result: r, context, nodes } = run(80000);
  context.PERIOD = 'annual';
  context.renderResults();
  assert.equal(nodes.get('resAmount').textContent, 'KES\u00a0' + Math.round(57876.65 * 12).toLocaleString('en-KE'));
  assert.equal((nodes.get('resContent').innerHTML.match(/AHL/g) || []).length, 1);
  close(r.net, 57876.65, 'monthly state preserved');
});

test('print document includes AHL once before taxable income and uses corrected result', async () => {
  const runResult = run(80000);
  runResult.context.generatePdf();
  const document = await runResult.printDocument();
  assert.equal((document.match(/AHL \(1.5%, kabla ya PAYE\)/g) || []).length, 1);
  assert.ok(document.indexOf('AHL (1.5%, kabla ya PAYE)') < document.indexOf('Mapato Yanayolipishwa Kodi'));
  assert.ok(document.includes('KES 57,877'));
  assert.ok(document.includes('KES 71,800'));
  assert.ok(document.includes('KES 13,923'));
});
